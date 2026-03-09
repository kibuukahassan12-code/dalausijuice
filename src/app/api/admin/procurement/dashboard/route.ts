import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Open POs
        const openPOs = await prisma.purchaseOrder.findMany({
            where: {
                status: { in: ["OPEN", "PARTIAL"] },
            },
            include: {
                supplier: true,
                items: true,
            },
        });

        // Supplier balances (payables)
        const allPOs = await prisma.purchaseOrder.findMany({
            include: {
                supplier: true,
                goods_receipts: {
                    include: {
                        items: true,
                    },
                },
                supplier_payments: true,
            },
        });

        const supplierBalances: Record<string, { name: string; payable: number; paid: number; balance: number }> = {};

        allPOs.forEach(po => {
            const acceptedValue = po.goods_receipts.reduce((sum, grn) => {
                return sum + grn.items.filter(i => i.accepted).reduce((s, item) => {
                    const poItem = po.items.find(pi => pi.item_name === item.item_name);
                    return s + (poItem ? item.quantity_received * poItem.unit_price_ugx : 0);
                }, 0);
            }, 0);

            const paid = po.supplier_payments.reduce((sum, p) => sum + p.amount_ugx, 0);
            const balance = acceptedValue - paid;

            if (!supplierBalances[po.supplier_id]) {
                supplierBalances[po.supplier_id] = {
                    name: po.supplier.name,
                    payable: 0,
                    paid: 0,
                    balance: 0,
                };
            }

            supplierBalances[po.supplier_id].payable += acceptedValue;
            supplierBalances[po.supplier_id].paid += paid;
            supplierBalances[po.supplier_id].balance += balance;
        });

        // Cost per category
        const costByCategory: Record<string, number> = {};
        const grns = await prisma.goodsReceipt.findMany({
            where: {
                status: "ACCEPTED",
            },
            include: {
                purchase_order: {
                    include: {
                        items: true,
                    },
                },
                items: true,
            },
        });

        grns.forEach(grn => {
            grn.items.filter(i => i.accepted).forEach(item => {
                const poItem = grn.purchase_order.items.find(pi => pi.item_name === item.item_name);
                if (poItem) {
                    const category = poItem.item_name.split(" ")[0]; // Simple category extraction
                    costByCategory[category] = (costByCategory[category] || 0) + (item.quantity_received * poItem.unit_price_ugx);
                }
            });
        });

        // PO Status distribution
        const statusDistributionRaw = await prisma.purchaseOrder.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        const statusDistribution = statusDistributionRaw.map(s => ({
            name: s.status,
            value: s._count.id
        }));

        // Outstanding payables
        const totalPayable = Object.values(supplierBalances).reduce((sum, s) => sum + s.payable, 0);
        const totalPaid = Object.values(supplierBalances).reduce((sum, s) => sum + s.paid, 0);
        const outstandingPayables = totalPayable - totalPaid;

        return NextResponse.json({
            openPOs: openPOs.length,
            openPOsList: openPOs.map(po => ({
                po_number: po.po_number,
                supplier: po.supplier.name,
                total_value: po.total_value_ugx,
                status: po.status,
            })),
            supplierBalances: Object.values(supplierBalances).sort((a, b) => b.payable - a.payable).slice(0, 5),
            costByCategory,
            outstandingPayables,
            totalPayable,
            totalPaid,
            statusDistribution
        });
    } catch (error) {
        console.error("Error fetching procurement dashboard:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
