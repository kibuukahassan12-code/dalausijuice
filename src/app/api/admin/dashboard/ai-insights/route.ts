import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        const [
            orders,
            inventory,
            batches,
            customers,
            expenses
        ] = await Promise.all([
            prisma.order.findMany({
                where: { orderDate: { gte: weekStart }, status: { not: "Cancelled" } },
                include: { items: { include: { product: true } } }
            }),
            prisma.inventoryItem.findMany({ where: { isActive: true } }),
            prisma.productionBatch.findMany({
                where: { created_at: { gte: weekStart } },
                include: { raw_materials: true }
            }),
            prisma.customer.findMany({
                include: {
                    orders: { where: { status: { not: "Cancelled" } } },
                    events: { where: { status: { not: "Cancelled" } } }
                }
            }),
            prisma.expense.findMany({ where: { expenseDate: { gte: weekStart } } })
        ]);

        const insights: string[] = [];
        let primaryAction = "View Analytics";
        let title = "Strategic Intelligence";

        // 1. Inventory Insights
        const lowStock = inventory.filter(i => i.currentStock <= (i.lowStockThreshold || 10));
        if (lowStock.length > 0) {
            const items = lowStock.map(i => i.name).slice(0, 2).join(" & ");
            insights.push(`Supply alert: ${items} ${lowStock.length > 2 ? `and ${lowStock.length - 2} others` : ''} hit critical levels.`);
            primaryAction = "Reorder Supplies";
        }

        // 2. Sales Performance
        const totalSales = orders.reduce((s, o) => s + o.totalAmount, 0);
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevOrders = await prisma.order.findMany({
            where: { orderDate: { gte: prevWeekStart, lt: weekStart }, status: { not: "Cancelled" } }
        });
        const prevSales = prevOrders.reduce((s, o) => s + o.totalAmount, 0);

        if (totalSales > prevSales * 1.2) {
            insights.push(`Momentum detected! Weekly revenue is up ${(((totalSales / prevSales) - 1) * 100).toFixed(0)}%. Passion fruit is leading the trend.`);
        } else if (totalSales < prevSales * 0.8 && prevSales > 0) {
            insights.push(`Sales pulse has slowed by ${(((1 - totalSales / prevSales)) * 100).toFixed(0)}%. Consider a 'Flash Friday' promotion on slow-moving stock.`);
        }

        // 3. Customer Loyalty (VIP)
        const vips = customers.filter(c => {
            const ltv = [...c.orders, ...c.events].reduce((s, o: any) => s + o.totalAmount, 0);
            return ltv > 1000000;
        });
        const activeThisWeek = vips.filter(v => {
            const lastOp = [...v.orders, ...v.events].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return lastOp && new Date(lastOp.createdAt) >= weekStart;
        });

        if (vips.length > 0 && activeThisWeek.length < vips.length / 2) {
            insights.push(`Retention Opportunity: ${vips.length - activeThisWeek.length} of your Top VIPs units haven't pulsed this week. Personal outreach recommended.`);
            primaryAction = "Manage CRM";
        }

        // 4. Efficiency / Waste
        const totalWaste = batches.reduce((s, b) => s + b.wastage_liters, 0);
        const totalOutput = batches.reduce((s, b) => s + b.output_liters, 0);
        const wasteRatio = totalOutput > 0 ? (totalWaste / totalOutput) * 100 : 0;

        if (wasteRatio > 10) {
            insights.push(`Process Alert: Batch wastage reached ${wasteRatio.toFixed(1)}% this week. Review equipment seals and hygiene protocols.`);
        }

        // 5. Financial Health
        const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
        if (totalExp > totalSales * 0.5) {
            insights.push(`Burn Warning: OpEx is consuming ${((totalExp / totalSales) * 100).toFixed(0)}% of revenue. Audit logistics and utility costs.`);
        }

        // Default if no specific insights
        if (insights.length === 0) {
            insights.push("Dalausi operations are currently stable within baseline parameters. All supply chains are secure.");
        }

        const hour = now.getHours();
        const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

        return NextResponse.json({
            greeting: `${greeting}, Commander`,
            title,
            insights,
            primaryAction,
            actionPath: primaryAction === "Reorder Supplies" ? "/admin/inventory" : primaryAction === "Manage CRM" ? "/admin/crm" : "/admin/reports"
        });
    } catch (error) {
        console.error("AI Insights Error:", error);
        return NextResponse.json({ error: "Failed to generate strategies" }, { status: 500 });
    }
}

