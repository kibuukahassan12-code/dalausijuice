export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function buildEmptyDashboard(currentPeriod: string | null = null, periodStatus: string = "OPEN") {
    return {
        currentPeriod,
        periodStatus,
        accountantView: {
            openPayables: 0,
            receivablesAging: { total: 0, current: 0 },
            dailyCashPosition: { cash: 0, bank: 0, mobileMoney: 0 },
        },
        financeManagerView: {
            profitability: { revenue: 0, cogs: 0, expenses: 0, netProfit: 0 },
            costPerLiter: 0,
            expenseTrends: {} as Record<string, number>,
        },
        mdView: {
            dailySales: { bottles: 0, jerrycans: 0, events: 0, total: 0 },
            netProfit: 0,
            eventVsRetail: { event: 0, retail: 0 },
            wastageImpact: 0,
            analysis: {
                dailyProfit: 0,
                dailyExpenditures: 0,
                netDailyProfit: 0,
                weeklyRevenue: 0,
                weeklySales: 0,
            }
        },
    };
}

export async function GET() {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(todayStart.getDate() - todayStart.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let currentPeriod: { period_month: string; status: string } | null = null;
        try {
            currentPeriod = await prisma.accountingPeriod.findFirst({
                where: { start_date: { lte: now }, end_date: { gte: now } },
            });
        } catch {
            return NextResponse.json(buildEmptyDashboard(null, "OPEN"));
        }

        let results: any[] = [];
        try {
            results = await Promise.all([
                prisma.ledgerEntry.findMany({
                    where: { account: { account_code: "2000" } },
                    include: { account: true },
                }),
                prisma.ledgerEntry.findMany({
                    where: { account: { account_code: "1100" } },
                    include: { account: true },
                }),
                prisma.ledgerEntry.findMany({
                    where: {
                        entry_date: { gte: todayStart },
                        account: { account_code: { in: ["1000", "1010", "1020"] } },
                    },
                    include: { account: true },
                }),
                prisma.ledgerEntry.findMany({
                    where: { entry_date: { gte: monthStart } },
                    include: { account: true },
                }),
                prisma.ledgerEntry.findMany({
                    where: { entry_date: { gte: weekStart } },
                    include: { account: true },
                }),
                prisma.ledgerEntry.findMany({
                    where: {
                        entry_date: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) },
                        account: { account_type: "EXPENSE" },
                    },
                    include: { account: true, period: true },
                }),
            ]);
        } catch (e) {
            console.error("Accounting dashboard query error (run migrations?):", e);
            return NextResponse.json(buildEmptyDashboard(currentPeriod?.period_month ?? null, currentPeriod?.status ?? "OPEN"));
        }

        const [payableEntries, arEntries, cashEntries, monthlyEntries, weeklyEntries, expenseEntries] = results;

        const openPayables = payableEntries.reduce((sum, e) => sum + e.credit_amount - e.debit_amount, 0);
        const totalReceivables = arEntries.reduce((sum, e) => sum + e.debit_amount - e.credit_amount, 0);
        const cashPosition = {
            cash: cashEntries.filter((e) => e.account.account_code === "1000").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            bank: cashEntries.filter((e) => e.account.account_code === "1010").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            mobileMoney: cashEntries.filter((e) => e.account.account_code === "1020").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
        };
        const monthlyRevenue = monthlyEntries.filter((e) => e.account.account_type === "REVENUE").reduce((s, e) => s + e.credit_amount, 0);
        const monthlyCOGS = monthlyEntries.filter((e) => e.account.account_type === "COGS").reduce((s, e) => s + e.debit_amount, 0);
        const monthlyExpenses = monthlyEntries.filter((e) => e.account.account_type === "EXPENSE").reduce((s, e) => s + e.debit_amount, 0);
        const monthlyProfit = monthlyRevenue - monthlyCOGS - monthlyExpenses;
        const costPerLiter = 0; // Ledger-only: no operational liters; COGS available for profitability
        const expenseTrends = expenseEntries.reduce((acc: Record<string, number>, e) => {
            const p = e.period?.period_month ?? "unknown";
            acc[p] = (acc[p] ?? 0) + e.debit_amount;
            return acc;
        }, {});

        const todayStartTime = todayStart.getTime();
        const todayEntries = monthlyEntries.filter((e) => new Date(e.entry_date).getTime() >= todayStartTime);
        const dailySales = {
            bottles: todayEntries.filter((e) => e.account.account_code === "4000").reduce((s, e) => s + e.credit_amount, 0),
            jerrycans: todayEntries.filter((e) => e.account.account_code === "4010").reduce((s, e) => s + e.credit_amount, 0),
            events: todayEntries.filter((e) => e.account.account_code === "4100").reduce((s, e) => s + e.credit_amount, 0),
        };
        dailySales.total = dailySales.bottles + dailySales.jerrycans + dailySales.events;

        const dailyRevenue = todayEntries.filter(e => e.account.account_type === "REVENUE").reduce((s, e) => s + e.credit_amount, 0);
        const dailyCOGS = todayEntries.filter(e => e.account.account_type === "COGS").reduce((s, e) => s + e.debit_amount, 0);
        const dailyExpenditures = todayEntries.filter(e => e.account.account_type === "EXPENSE").reduce((s, e) => s + e.debit_amount, 0);
        const dailyProfit = dailyRevenue - dailyCOGS - dailyExpenditures;

        const weeklyRevenue = weeklyEntries.filter(e => e.account.account_type === "REVENUE").reduce((s, e) => s + e.credit_amount, 0);
        const weeklySalesCount = weeklyEntries.filter(e => ["4000", "4010", "4100"].includes(e.account.account_code)).reduce((s, e) => s + e.credit_amount, 0);

        // Calculate 7-day daily trend
        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayStart);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const dailyRev = weeklyEntries
                .filter(e => e.account.account_type === "REVENUE" && new Date(e.entry_date).toISOString().split("T")[0] === dateStr)
                .reduce((s, e) => s + e.credit_amount, 0);
            dailyTrend.push({ date: dateStr, revenue: dailyRev });
        }

        return NextResponse.json({
            currentPeriod: currentPeriod?.period_month ?? null,
            periodStatus: currentPeriod?.status ?? "OPEN",
            accountantView: {
                openPayables,
                receivablesAging: { total: totalReceivables, current: totalReceivables },
                dailyCashPosition: cashPosition,
            },
            financeManagerView: {
                profitability: { revenue: monthlyRevenue, cogs: monthlyCOGS, expenses: monthlyExpenses, netProfit: monthlyProfit },
                costPerLiter,
                expenseTrends,
            },
            mdView: {
                dailySales,
                netProfit: monthlyProfit,
                eventVsRetail: {
                    event: monthlyEntries.filter((e) => e.account.account_code === "4100").reduce((s, e) => s + e.credit_amount, 0),
                    retail: monthlyEntries.filter((e) => ["4000", "4010"].includes(e.account.account_code)).reduce((s, e) => s + e.credit_amount, 0),
                },
                wastageImpact: monthlyEntries.filter((e) => e.account.account_code === "6000").reduce((s, e) => s + e.debit_amount, 0),
                analysis: {
                    dailyProfit,
                    dailyExpenditures,
                    netDailyProfit: dailyProfit, // Same as dailyProfit in this simplified model
                    weeklyRevenue,
                    weeklySales: weeklySalesCount,
                    dailyTrend,
                }
            },
        });
    } catch (error) {
        console.error("Error fetching accounting dashboard:", error);
        return NextResponse.json(buildEmptyDashboard(null, "OPEN"));
    }
}
