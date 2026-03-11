export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    where: { status: { not: "Cancelled" } },
                    include: { items: { include: { product: true } } }
                },
                events: {
                    where: { status: { not: "Cancelled" } },
                    include: { items: { include: { product: true } } }
                }
            }
        });

        const insights = customers.map(c => {
            const allOrders = [...c.orders.map(o => ({ ...o, type: 'Order' })), ...c.events.map(e => ({ ...e, type: 'Event' }))];

            const ltv = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            const orderCount = allOrders.length;

            // Find favorite product
            const productFreq: Record<string, number> = {};
            [...c.orders, ...c.events].forEach(o => {
                o.items.forEach(i => {
                    productFreq[i.product.name] = (productFreq[i.product.name] || 0) + i.quantity;
                });
            });
            const favoriteProduct = Object.entries(productFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

            // Last activity
            const lastActivity = allOrders.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]?.createdAt || c.createdAt;

            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                ltv,
                orderCount,
                favoriteProduct,
                lastActivity,
                isVIP: ltv > 1000000 || orderCount > 10 // VIP if > 1M UGX or > 10 orders
            };
        }).sort((a, b) => b.ltv - a.ltv);

        return NextResponse.json(insights);
    } catch (error) {
        console.error("CRM Insights Error:", error);
        return NextResponse.json({ error: "Failed to fetch CRM insights" }, { status: 500 });
    }
}

