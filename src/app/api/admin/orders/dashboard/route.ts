import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "today";

        const now = new Date();
        let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (period === "week") {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "all") {
            startDate = new Date(2020, 0, 1);
        }

        const [orders, products] = await Promise.all([
            prisma.order.findMany({
                where: { orderDate: { gte: startDate } },
                include: { customer: true, items: { include: { product: true } } },
                orderBy: { orderDate: "desc" }
            }),
            prisma.product.findMany()
        ]);

        // Process 7-day trend (if period is week or all, otherwise just today)
        const trend = [];
        const daysToTrack = 7;
        for (let i = daysToTrack - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const amount = orders
                .filter(o => o.status !== "Cancelled" && o.orderDate.toISOString().split("T")[0] === dateStr)
                .reduce((s, o) => s + o.totalAmount, 0);
            trend.push({ date: dateStr, amount });
        }

        // Product distribution (top products)
        const productStats: Record<string, number> = {};
        orders.filter(o => o.status !== "Cancelled").forEach(o => {
            o.items.forEach(item => {
                const name = item.product.name;
                productStats[name] = (productStats[name] || 0) + item.quantity;
            });
        });
        const productDistribution = Object.entries(productStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return NextResponse.json({
            orders,
            trend,
            productDistribution,
            stats: {
                totalOrders: orders.length,
                totalRevenue: orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.totalAmount, 0),
                pendingApproval: orders.filter(o => o.status === "Waiting Approval").length,
                cancelledCount: orders.filter(o => o.status === "Cancelled").length
            }
        });
    } catch (error) {
        console.error("Orders Dashboard Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders data" }, { status: 500 });
    }
}
