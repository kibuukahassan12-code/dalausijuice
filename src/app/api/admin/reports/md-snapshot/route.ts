import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);

        // 1. REVENUE INTELLIGENCE
        const todayOrders = await prisma.order.findMany({
            where: {
                orderDate: { gte: today },
                status: { not: "Cancelled" }
            }
        });

        const yesterdayOrders = await prisma.order.findMany({
            where: {
                orderDate: { gte: yesterday, lt: today },
                status: { not: "Cancelled" }
            }
        });

        const weekOrders = await prisma.order.findMany({
            where: {
                orderDate: { gte: weekAgo },
                status: { not: "Cancelled" }
            }
        });

        const monthOrders = await prisma.order.findMany({
            where: {
                orderDate: { gte: monthAgo },
                status: { not: "Cancelled" }
            }
        });

        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const weekRevenue = weekOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        // 2. EXPENSE INTELLIGENCE
        const monthExpenses = await prisma.ledgerEntry.findMany({
            where: {
                entry_date: { gte: monthAgo },
                account: { account_type: { in: ["EXPENSE", "COGS"] } }
            }
        });

        const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.debit_amount, 0);

        // 3. PRODUCTION INTELLIGENCE
        const todayBatches = await prisma.productionBatch.findMany({
            where: { start_time: { gte: today } }
        });

        const weekBatches = await prisma.productionBatch.findMany({
            where: { start_time: { gte: weekAgo } }
        });

        const todayOutput = todayBatches.reduce((sum, b) => sum + b.output_liters, 0);
        const weekOutput = weekBatches.reduce((sum, b) => sum + b.output_liters, 0);
        const weekWastage = weekBatches.reduce((sum, b) => sum + b.wastage_liters, 0);
        const wastageRate = weekOutput > 0 ? (weekWastage / (weekOutput + weekWastage)) * 100 : 0;

        // 4. INVENTORY ALERTS
        const inventory = await prisma.inventoryItem.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                currentStock: true,
                lowStockThreshold: true
            }
        });

        const criticalStock = inventory.filter(i =>
            i.currentStock <= (i.lowStockThreshold || 10)
        );

        // 5. CUSTOMER INTELLIGENCE
        const customers = await prisma.customer.findMany({
            include: { orders: true }
        });

        const vipCustomers = customers.filter(c => {
            const totalSpend = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);
            return totalSpend > 500000;
        });

        // 6. UPCOMING EVENTS
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const upcomingEvents = await prisma.event.findMany({
            where: {
                eventDate: { gte: today, lte: nextWeek },
                status: { not: "Cancelled" }
            },
            include: { customer: true }
        });

        // 7. PENDING ORDERS
        const pendingOrders = await prisma.order.findMany({
            where: { status: "Pending" },
            include: { customer: true }
        });

        const stalePending = pendingOrders.filter(o => {
            const hoursSince = (now.getTime() - o.orderDate.getTime()) / (1000 * 60 * 60);
            return hoursSince > 2;
        });

        // 8. FINANCIAL HEALTH
        const profitMargin = monthRevenue > 0 ? ((monthRevenue - totalExpenses) / monthRevenue) * 100 : 0;
        const dailyBurnRate = totalExpenses / 30;

        // 9. TEAM STATUS
        const activeEmployees = await prisma.employee.count({
            where: { status: "ACTIVE" }
        });

        // 10. QUALITY METRICS
        const weekQC = await prisma.qualityCheck.findMany({
            where: { checked_at: { gte: weekAgo } }
        });

        const qcApprovalRate = weekQC.length > 0
            ? (weekQC.filter(q => q.status === "APPROVED").length / weekQC.length) * 100
            : 100;

        // STRATEGIC INSIGHTS
        const insights: string[] = [];

        if (todayRevenue > yesterdayRevenue * 1.2) {
            insights.push(`🚀 Revenue surge detected: Today's sales are ${((todayRevenue / yesterdayRevenue - 1) * 100).toFixed(0)}% above yesterday`);
        }

        if (criticalStock.length > 0) {
            insights.push(`⚠️ ${criticalStock.length} inventory items below reorder threshold`);
        }

        if (wastageRate > 5) {
            insights.push(`📊 Production wastage at ${wastageRate.toFixed(1)}% - review efficiency protocols`);
        }

        if (stalePending.length > 0) {
            insights.push(`🔔 ${stalePending.length} orders pending for over 2 hours - requires attention`);
        }

        if (profitMargin < 30) {
            insights.push(`💰 Profit margin at ${profitMargin.toFixed(1)}% - below 30% target`);
        }

        if (upcomingEvents.length > 0) {
            insights.push(`📅 ${upcomingEvents.length} events scheduled in next 7 days - production planning required`);
        }

        return NextResponse.json({
            generatedAt: now.toISOString(),
            period: "Last 30 Days",

            revenue: {
                today: todayRevenue,
                yesterday: yesterdayRevenue,
                week: weekRevenue,
                month: monthRevenue,
                dailyAverage: monthRevenue / 30,
                trend: todayRevenue > yesterdayRevenue ? "UP" : "DOWN"
            },

            financial: {
                monthlyExpenses: totalExpenses,
                profitMargin: profitMargin.toFixed(1),
                netProfit: monthRevenue - totalExpenses,
                dailyBurnRate: dailyBurnRate.toFixed(0),
                healthStatus: profitMargin > 30 ? "HEALTHY" : profitMargin > 15 ? "CAUTION" : "CRITICAL"
            },

            production: {
                todayOutput: todayOutput.toFixed(1),
                weekOutput: weekOutput.toFixed(1),
                wastageRate: wastageRate.toFixed(1),
                batchesToday: todayBatches.length,
                qcApprovalRate: qcApprovalRate.toFixed(1)
            },

            operations: {
                pendingOrders: pendingOrders.length,
                stalePending: stalePending.length,
                criticalStock: criticalStock.length,
                upcomingEvents: upcomingEvents.length,
                activeEmployees
            },

            customers: {
                total: customers.length,
                vipCount: vipCustomers.length,
                newThisMonth: customers.filter(c =>
                    c.createdAt >= monthAgo
                ).length
            },

            alerts: {
                critical: criticalStock.map(i => ({
                    item: i.name,
                    current: i.currentStock,
                    threshold: i.lowStockThreshold
                })),
                staleOrders: stalePending.map(o => ({
                    orderId: o.id,
                    customer: o.customer.name,
                    amount: o.totalAmount,
                    hoursPending: ((now.getTime() - o.orderDate.getTime()) / (1000 * 60 * 60)).toFixed(1)
                })),
                upcomingEvents: upcomingEvents.map(e => ({
                    eventName: e.eventName,
                    client: e.customer.name,
                    date: e.eventDate,
                    value: e.totalAmount
                }))
            },

            insights,

            executiveSummary: `Dalausi generated UGX ${monthRevenue.toLocaleString()} in the last 30 days with a ${profitMargin.toFixed(1)}% profit margin. Production output is ${weekOutput.toFixed(0)}L this week with ${wastageRate.toFixed(1)}% wastage. ${vipCustomers.length} VIP customers are active. ${insights.length} strategic items require MD attention.`
        });

    } catch (error) {
        console.error("MD Snapshot Error:", error);
        return NextResponse.json({ error: "Failed to generate snapshot" }, { status: 500 });
    }
}

