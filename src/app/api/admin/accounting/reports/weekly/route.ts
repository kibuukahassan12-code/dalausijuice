import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

function emptyWeekly(weekStartStr: string, weekEndStr: string) {
    const days: { date: string; sales: number }[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartStr);
        d.setDate(d.getDate() + i);
        days.push({ date: d.toISOString().split("T")[0], sales: 0 });
    }
    return {
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        salesTrend: days,
        costPerLiterTrend: { average: 0, totalCost: 0, totalLiters: 0 },
        wastageCost: 0,
        supplierSpend: 0,
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const weekStart = searchParams.get("weekStart");
        const startDate = weekStart ? new Date(weekStart) : new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        const weekStartStr = startDate.toISOString().split("T")[0];
        const weekEndStr = endDate.toISOString().split("T")[0];

        let entries: { account: { account_code: string; account_type: string }; entry_date: Date; debit_amount: number; credit_amount: number; source_type: string }[] = [];
        try {
            entries = await prisma.ledgerEntry.findMany({
                where: { entry_date: { gte: startDate, lte: endDate } },
                include: { account: true },
            });
        } catch (e) {
            console.error("Weekly report ledger query:", e);
            return NextResponse.json(emptyWeekly(weekStartStr, weekEndStr));
        }

        // Sales by day from ledger revenue (4000, 4010, 4100)
        const revenueByDay: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            revenueByDay[d.toISOString().split("T")[0]] = 0;
        }
        entries.filter(e => e.account.account_type === "REVENUE").forEach(e => {
            const dayKey = e.entry_date.toISOString().split("T")[0];
            if (revenueByDay[dayKey] !== undefined) revenueByDay[dayKey] += e.credit_amount;
        });
        const salesByDay = Object.entries(revenueByDay).map(([date, sales]) => ({ date, sales }));

        // All from ledger only – no operational tables
        const totalProductionCost = entries.filter(e => e.account.account_type === "COGS").reduce((s, e) => s + e.debit_amount, 0);
        const wastageCost = entries.filter(e => e.account.account_code === "6000").reduce((s, e) => s + e.debit_amount, 0);
        // Supplier spend: credits to cash/bank/mobile from PAYMENT source
        const supplierSpend = entries
            .filter(e => ["1000", "1010", "1020"].includes(e.account.account_code) && e.source_type === "PAYMENT")
            .reduce((s, e) => s + e.credit_amount, 0);

        return NextResponse.json({
            weekStart: startDate.toISOString().split("T")[0],
            weekEnd: endDate.toISOString().split("T")[0],
            salesTrend: salesByDay,
            costPerLiterTrend: {
                average: 0,
                totalCost: totalProductionCost,
                totalLiters: 0,
            },
            wastageCost,
            supplierSpend,
        });
    } catch (error) {
        console.error("Error generating weekly report:", error);
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return NextResponse.json(emptyWeekly(start.toISOString().split("T")[0], end.toISOString().split("T")[0]));
    }
}
