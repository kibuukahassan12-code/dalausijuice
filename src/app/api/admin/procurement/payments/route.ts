export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const payments = await prisma.supplierPayment.findMany({
            include: {
                supplier: true,
                purchase_order: true,
            },
            orderBy: { payment_date: "desc" },
        });
        return NextResponse.json(payments);
    } catch (error) {
        console.error("Error fetching supplier payments:", error);
        return NextResponse.json({ error: "Failed to fetch supplier payments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { supplier_id, po_id, payment_date, amount_ugx, payment_method, reference_number } = data;

        if (!supplier_id || !po_id || !payment_date || !amount_ugx || !payment_method) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ENFORCEMENT: Verify PO exists
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: po_id },
            include: {
                goods_receipts: {
                    include: {
                        items: true,
                    },
                },
                supplier_payments: true,
            },
        });

        if (!po) {
            return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
        }

        // ENFORCEMENT: Payment cannot exceed GRN value (accepted goods only)
        const acceptedGRNValue = po.goods_receipts.reduce((sum, grn) => {
            return sum + grn.items.filter(i => i.accepted).reduce((s, item) => {
                const poItem = po.items.find(pi => pi.item_name === item.item_name);
                return s + (poItem ? item.quantity_received * poItem.unit_price_ugx : 0);
            }, 0);
        }, 0);

        const totalPaid = po.supplier_payments.reduce((sum, p) => sum + p.amount_ugx, 0);
        const remainingPayable = acceptedGRNValue - totalPaid;

        if (Number(amount_ugx) > remainingPayable) {
            return NextResponse.json({ error: `Payment exceeds remaining payable. Maximum: UGX ${remainingPayable.toLocaleString()}` }, { status: 400 });
        }

        const status = Number(amount_ugx) >= remainingPayable ? "PAID" : "PARTIAL";

        const payment = await prisma.supplierPayment.create({
            data: {
                supplier_id,
                po_id,
                payment_date: new Date(payment_date),
                amount_ugx: Number(amount_ugx),
                payment_method: payment_method.toUpperCase(),
                reference_number: reference_number || null,
                status,
            },
            include: {
                supplier: true,
                purchase_order: true,
            },
        });

        // AUTOMATIC ACCOUNTING: Post PAYMENT entry
        try {
            await postSupplierPayment(payment.id, Number(amount_ugx), payment_method.toUpperCase(), "system"); // TODO: Get actual user ID
        } catch (error) {
            console.error("Error posting accounting entry:", error);
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error("Error creating supplier payment:", error);
        return NextResponse.json({ error: "Failed to create supplier payment" }, { status: 500 });
    }
}

