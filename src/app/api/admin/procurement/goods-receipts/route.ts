import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { postGRNAcceptance } from "@/lib/accounting";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const grns = await prisma.goodsReceipt.findMany({
            include: {
                purchase_order: {
                    include: {
                        supplier: true,
                        items: true,
                    },
                },
                items: true,
            },
            orderBy: { received_date: "desc" },
        });
        return NextResponse.json(grns);
    } catch (error) {
        console.error("Error fetching goods receipts:", error);
        return NextResponse.json({ error: "Failed to fetch goods receipts" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { po_id, received_date, received_by, items, remarks } = data;

        if (!po_id || !received_date || !received_by || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ENFORCEMENT: GRN cannot exist without PO
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: po_id },
            include: {
                items: true,
                goods_receipts: {
                    include: {
                        items: true,
                    },
                },
            },
        });

        if (!po) {
            return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
        }

        // Calculate total received quantities per item
        const receivedQuantities: Record<string, number> = {};
        items.forEach((item: any) => {
            if (item.accepted) {
                receivedQuantities[item.item_name] = (receivedQuantities[item.item_name] || 0) + Number(item.quantity_received);
            }
        });

        // Validate received quantities don't exceed ordered
        for (const poItem of po.items) {
            const totalReceived = po.goods_receipts.reduce((sum, grn) => {
                const grnItem = grn.items.find(i => i.item_name === poItem.item_name && i.accepted);
                return sum + (grnItem ? grnItem.quantity_received : 0);
            }, 0);
            const newReceived = receivedQuantities[poItem.item_name] || 0;
            if (totalReceived + newReceived > poItem.quantity_ordered) {
                return NextResponse.json({ error: `Received quantity exceeds ordered for ${poItem.item_name}` }, { status: 400 });
            }
        }

        // Determine GRN status
        let allAccepted = true;
        let allRejected = true;
        items.forEach((item: any) => {
            if (item.accepted) allRejected = false;
            else allAccepted = false;
        });

        let status = "PARTIAL";
        if (allAccepted) status = "ACCEPTED";
        else if (allRejected) status = "REJECTED";

        const grn = await prisma.goodsReceipt.create({
            data: {
                po_id,
                received_date: new Date(received_date),
                received_by,
                status,
                remarks: remarks || null,
                items: {
                    create: items.map((item: any) => ({
                        item_name: item.item_name,
                        quantity_received: Number(item.quantity_received),
                        accepted: Boolean(item.accepted),
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        // Update PO status based on receipts
        const totalReceived = po.goods_receipts.reduce((sum, grn) => {
            return sum + grn.items.filter(i => i.accepted).reduce((s, i) => s + i.quantity_received, 0);
        }, 0) + items.filter((i: any) => i.accepted).reduce((sum: number, i: any) => sum + Number(i.quantity_received), 0);

        const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity_ordered, 0);
        let poStatus = "OPEN";
        if (totalReceived >= totalOrdered) poStatus = "RECEIVED";
        else if (totalReceived > 0) poStatus = "PARTIAL";

        await prisma.purchaseOrder.update({
            where: { id: po_id },
            data: { status: poStatus },
        });

        // AUTOMATIC ACCOUNTING: Post COST entry for ACCEPTED items only
        if (status === "ACCEPTED" || status === "PARTIAL") {
            const acceptedItems = items.filter((i: any) => i.accepted);
            const grnItems = acceptedItems.map((item: any) => {
                const poItem = po.items.find(pi => pi.item_name === item.item_name);
                return {
                    item_name: item.item_name,
                    quantity: Number(item.quantity_received),
                    unit_price: poItem ? poItem.unit_price_ugx : 0,
                };
            }).filter(item => item.unit_price > 0);

            if (grnItems.length > 0) {
                try {
                    await postGRNAcceptance(grn.id, po_id, grnItems, received_by);
                } catch (error) {
                    console.error("Error posting accounting entry:", error);
                }

                // Update inventory for accepted items
                for (const item of acceptedItems) {
                    const poItem = po.items.find(pi => pi.item_name === item.item_name);
                    if (poItem) {
                        await prisma.inventoryItem.upsert({
                            where: { name: item.item_name },
                            update: {
                                currentStock: { increment: Number(item.quantity_received) },
                                unitCost: poItem.unit_price_ugx,
                                lastRestocked: new Date(),
                            },
                            create: {
                                name: item.item_name,
                                category: poItem.item_name.split(" ")[0], // Simple category extraction
                                unit: "kg", // Default unit
                                currentStock: Number(item.quantity_received),
                                unitCost: poItem.unit_price_ugx,
                                lastRestocked: new Date(),
                            },
                        });
                    }
                }
            }
        }

        return NextResponse.json(grn);
    } catch (error) {
        console.error("Error creating goods receipt:", error);
        return NextResponse.json({ error: "Failed to create goods receipt" }, { status: 500 });
    }
}

