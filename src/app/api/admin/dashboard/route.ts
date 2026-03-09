import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const [
            orders,
            ledgerEntries,
            inventoryItems,
            employees,
            batches,
            upcomingEvents
        ] = await Promise.all([
            prisma.order.findMany({
                where: { orderDate: { gte: weekStart }, status: { not: "Cancelled" } },
                select: { orderDate: true, totalAmount: true }
            }),
            prisma.ledgerEntry.findMany({
                where: { entry_date: { gte: weekStart } },
                include: { account: true }
            }),
            prisma.inventoryItem.findMany({ where: { isActive: true } }),
            prisma.employee.count({ where: { status: "ACTIVE" } }),
            prisma.productionBatch.findMany({
                where: { created_at: { gte: weekStart } },
                select: { created_at: true, output_liters: true }
            }),
            prisma.event.findMany({
                where: { eventDate: { gte: new Date() } },
                include: { customer: true },
                orderBy: { eventDate: "asc" },
                take: 5
            })
        ]);

        // Process 7-day trend (Revenue vs Expenses)
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];

            const revenue = ledgerEntries
                .filter(e => e.account.account_type === "REVENUE" && e.entry_date.toISOString().split("T")[0] === dateStr)
                .reduce((s, e) => s + Number(e.credit_amount), 0);

            const expenses = ledgerEntries
                .filter(e => (e.account.account_type === "EXPENSE" || e.account.account_type === "COGS") && e.entry_date.toISOString().split("T")[0] === dateStr)
                .reduce((s, e) => s + Number(e.debit_amount), 0);

            const production = batches
                .filter(b => b.created_at.toISOString().split("T")[0] === dateStr)
                .reduce((s, b) => s + b.output_liters, 0);

            weeklyTrend.push({ date: dateStr, revenue, expenses, production });
        }

        // Summary Stats
        const totalInventoryValue = inventoryItems.reduce((s, i) => s + (i.currentStock * i.unitCost), 0);
        const lowStockCount = inventoryItems.filter(i => i.currentStock <= (i.lowStockThreshold || 10)).length;

        const monthRev = ledgerEntries
            .filter(e => e.account.account_type === "REVENUE")
            .reduce((s, e) => s + Number(e.credit_amount), 0);

        const monthExp = ledgerEntries
            .filter(e => (e.account.account_type === "EXPENSE" || e.account.account_type === "COGS"))
            .reduce((s, e) => s + Number(e.debit_amount), 0);

        return NextResponse.json({
            weeklyTrend,
            upcomingEvents: upcomingEvents.map(e => ({
                id: e.id,
                name: e.eventName,
                client: e.customer.name,
                date: e.eventDate
            })),
            stats: {
                monthlyRevenue: monthRev,
                monthlyProfit: monthRev - monthExp,
                inventoryValue: totalInventoryValue,
                lowStockAlerts: lowStockCount,
                activeEmployees: employees
            }
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
    }
}
