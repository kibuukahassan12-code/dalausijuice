export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


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

        console.log("[Orders Dashboard] Fetching orders from:", startDate);

        let orders: any[] = [];
        let products: any[] = [];

        try {
            [orders, products] = await Promise.all([
                prisma.order.findMany({
                    where: { orderDate: { gte: startDate } },
                    include: { 
                        customer: true, 
                        items: { include: { product: true } },
                        paymentLinks: { include: { payment: true } }
                    },
                    orderBy: { orderDate: "desc" }
                }),
                prisma.product.findMany()
            ]);
            console.log("[Orders Dashboard] Found orders:", orders.length);
        } catch (dbError: any) {
            console.error("[Orders Dashboard] DB Error:", dbError?.message || dbError);
            // Return empty data if DB fails
            orders = [];
            products = [];
        }

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
            o.items.forEach((item: any) => {
                const name = item.product?.name || "Unknown";
                productStats[name] = (productStats[name] || 0) + item.quantity;
            });
        });
        const productDistribution = Object.entries(productStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const response = {
            orders,
            trend,
            productDistribution,
            stats: {
                totalOrders: orders.length,
                totalRevenue: orders.filter((o: any) => o.status !== "Cancelled").reduce((s: number, o: any) => s + o.totalAmount, 0),
                pendingApproval: orders.filter((o: any) => o.status === "Waiting Approval").length,
                cancelledCount: orders.filter((o: any) => o.status === "Cancelled").length
            }
        };

        console.log("[Orders Dashboard] Response stats:", response.stats);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("[Orders Dashboard] Error:", error?.message || error);
        return NextResponse.json({ 
            orders: [],
            trend: [],
            productDistribution: [],
            stats: { totalOrders: 0, totalRevenue: 0, pendingApproval: 0, cancelledCount: 0 }
        }, { status: 200 }); // Return 200 with empty data instead of 500
    }
}
