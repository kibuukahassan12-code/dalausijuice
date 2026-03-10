import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month"); // Format: YYYY-MM
        
        const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const [year, monthNum] = targetMonth.split("-").map(Number);
        
        const startDate = new Date(year, monthNum - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

        // Get period
        const period = await prisma.accountingPeriod.findUnique({
            where: { period_month: targetMonth },
        });

        let entries: { account: { account_code: string; account_type: string }; debit_amount: number; credit_amount: number }[] = [];
        try {
            entries = await prisma.ledgerEntry.findMany({
                where: { entry_date: { gte: startDate, lte: endDate } },
                include: { account: true },
            });
        } catch (e) {
            console.error("Monthly report ledger query:", e);
            const emptyRevenue = { bottles: 0, jerrycans: 0, events: 0, total: 0 };
            const emptyCogs = { fruit: 0, packaging: 0, labor: 0, utilities: 0, total: 0 };
            const emptyExpenses = { wastage: 0, operating: 0, total: 0 };
            return NextResponse.json({
                period: targetMonth,
                periodStatus: "OPEN",
                profitAndLoss: { revenue: emptyRevenue, cogs: emptyCogs, grossProfit: 0, expenses: emptyExpenses, netProfit: 0 },
                eventVsRetail: { eventRevenue: 0, retailRevenue: 0, eventProfitability: 0 },
                wastageImpact: 0,
            });
        }

        // Calculate Profit & Loss
        const revenueEntries = entries.filter(e => e.account.account_type === "REVENUE");
        const cogsEntries = entries.filter(e => e.account.account_type === "COGS");
        const expenseEntries = entries.filter(e => e.account.account_type === "EXPENSE");

        const revenue = {
            bottles: revenueEntries
                .filter(e => e.account.account_code === "4000")
                .reduce((sum, e) => sum + e.credit_amount, 0),
            jerrycans: revenueEntries
                .filter(e => e.account.account_code === "4010")
                .reduce((sum, e) => sum + e.credit_amount, 0),
            events: revenueEntries
                .filter(e => e.account.account_code === "4100")
                .reduce((sum, e) => sum + e.credit_amount, 0),
            total: revenueEntries.reduce((sum, e) => sum + e.credit_amount, 0),
        };

        const cogs = {
            fruit: cogsEntries
                .filter(e => e.account.account_code === "5000")
                .reduce((sum, e) => sum + e.debit_amount, 0),
            packaging: cogsEntries
                .filter(e => e.account.account_code === "5010")
                .reduce((sum, e) => sum + e.debit_amount, 0),
            labor: cogsEntries
                .filter(e => e.account.account_code === "5020")
                .reduce((sum, e) => sum + e.debit_amount, 0),
            utilities: cogsEntries
                .filter(e => e.account.account_code === "5030")
                .reduce((sum, e) => sum + e.debit_amount, 0),
            total: cogsEntries.reduce((sum, e) => sum + e.debit_amount, 0),
        };

        // Ledger-only: 6000 Wastage, 6500 Operating Expenses
        const expenses = {
            wastage: expenseEntries
                .filter(e => e.account.account_code === "6000")
                .reduce((sum, e) => sum + e.debit_amount, 0),
            operating: expenseEntries
                .filter(e => e.account.account_code === "6500")
                .reduce((sum, e) => sum + e.debit_amount, 0),
            total: expenseEntries.reduce((sum, e) => sum + e.debit_amount, 0),
        };

        const grossProfit = revenue.total - cogs.total;
        const netProfit = grossProfit - expenses.total;

        // Event vs retail performance
        const eventRevenue = revenue.events;
        const retailRevenue = revenue.bottles + revenue.jerrycans;
        const eventProfitability = eventRevenue - (cogs.total * (eventRevenue / revenue.total || 0));

        // Wastage impact
        const wastageImpact = expenses.wastage;

        return NextResponse.json({
            period: targetMonth,
            periodStatus: period?.status || "OPEN",
            profitAndLoss: {
                revenue,
                cogs,
                grossProfit,
                expenses,
                netProfit,
            },
            eventVsRetail: {
                eventRevenue,
                retailRevenue,
                eventProfitability,
            },
            wastageImpact,
        });
    } catch (error) {
        console.error("Error generating monthly report:", error);
        const targetMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const emptyRevenue = { bottles: 0, jerrycans: 0, events: 0, total: 0 };
        const emptyCogs = { fruit: 0, packaging: 0, labor: 0, utilities: 0, total: 0 };
        const emptyExpenses = { wastage: 0, operating: 0, total: 0 };
        return NextResponse.json({
            period: targetMonth,
            periodStatus: "OPEN",
            profitAndLoss: { revenue: emptyRevenue, cogs: emptyCogs, grossProfit: 0, expenses: emptyExpenses, netProfit: 0 },
            eventVsRetail: { eventRevenue: 0, retailRevenue: 0, eventProfitability: 0 },
            wastageImpact: 0,
        });
    }
}

