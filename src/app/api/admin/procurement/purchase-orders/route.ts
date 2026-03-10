import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { postPOApproval, postGRNAcceptance } from "@/lib/accounting";
import { NextResponse } from "next/server";


function generatePONumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `PO-${year}${month}-${random}`;
}

export async function GET() {
    try {
        const pos = await prisma.purchaseOrder.findMany({
            include: {
                supplier: true,
                items: true,
                goods_receipts: {
                    include: {
                        items: true,
                    },
                },
                supplier_payments: true,
            },
            orderBy: { order_date: "desc" },
        });
        return NextResponse.json(pos);
    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { supplier_id, order_date, expected_delivery_date, approved_by, items } = data;

        if (!supplier_id || !order_date || !expected_delivery_date || !approved_by || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ENFORCEMENT: Check supplier exists and is ACTIVE
        const supplier = await prisma.supplier.findUnique({ where: { id: supplier_id } });
        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }
        if (supplier.status !== "ACTIVE") {
            return NextResponse.json({ error: "Cannot create PO for suspended supplier" }, { status: 400 });
        }

        // Calculate total value
        const total_value_ugx = items.reduce((sum: number, item: any) => {
            return sum + (Number(item.quantity_ordered) * Number(item.unit_price_ugx));
        }, 0);

        const po_number = generatePONumber();

        const po = await prisma.purchaseOrder.create({
            data: {
                po_number,
                supplier_id,
                order_date: new Date(order_date),
                expected_delivery_date: new Date(expected_delivery_date),
                approved_by,
                total_value_ugx,
                status: "OPEN",
                items: {
                    create: items.map((item: any) => ({
                        item_name: item.item_name,
                        quantity_ordered: Number(item.quantity_ordered),
                        unit_price_ugx: Number(item.unit_price_ugx),
                        total_price_ugx: Number(item.quantity_ordered) * Number(item.unit_price_ugx),
                    })),
                },
            },
            include: {
                supplier: true,
                items: true,
            },
        });

        // AUTOMATIC ACCOUNTING: Post PAYABLE entry
        try {
            await postPOApproval(po.id, total_value_ugx, approved_by);
        } catch (error) {
            console.error("Error posting accounting entry:", error);
            // Don't fail PO creation if accounting fails
        }

        return NextResponse.json(po);
    } catch (error) {
        console.error("Error creating purchase order:", error);
        return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
    }
}

