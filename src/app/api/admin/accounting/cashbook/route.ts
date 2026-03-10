import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period"); // daily, weekly, monthly
        const date = searchParams.get("date"); // YYYY-MM-DD for daily, YYYY-MM for monthly

        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        if (period === "daily") {
            const targetDate = date ? new Date(date) : now;
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === "weekly") {
            const targetDate = date ? new Date(date) : now;
            startDate = new Date(targetDate);
            startDate.setDate(targetDate.getDate() - targetDate.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // monthly
            const targetMonth = date ? date.substring(0, 7) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            const [year, month] = targetMonth.split("-").map(Number);
            startDate = new Date(year, month - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(year, month, 0, 23, 59, 59, 999);
        }

        // Get all cash-related transactions (Cash, Bank, Mobile Money accounts)
        const cashEntries = await prisma.ledgerEntry.findMany({
            where: {
                entry_date: { gte: startDate, lte: endDate },
                account: {
                    account_code: { in: ["1000", "1010", "1020"] }, // Cash, Bank, Mobile Money
                },
            },
            include: {
                account: true,
            },
            orderBy: { entry_date: "asc" },
        });

        // Get all revenue entries (incomes)
        const revenueEntries = await prisma.ledgerEntry.findMany({
            where: {
                entry_date: { gte: startDate, lte: endDate },
                account: {
                    account_type: "REVENUE",
                },
            },
            include: {
                account: true,
            },
            orderBy: { entry_date: "asc" },
        });

        // Get all expense entries
        const expenseEntries = await prisma.ledgerEntry.findMany({
            where: {
                entry_date: { gte: startDate, lte: endDate },
                account: {
                    account_type: "EXPENSE",
                },
            },
            include: {
                account: true,
            },
            orderBy: { entry_date: "asc" },
        });

        // Calculate totals
        const totalIncome = revenueEntries.reduce((sum, e) => sum + e.credit_amount, 0);
        const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.debit_amount, 0);
        const netCashFlow = totalIncome - totalExpenses;

        // Group by date for daily/weekly views
        const transactionsByDate: Record<string, {
            date: string;
            incomes: Array<{ description: string; amount: number; account: string }>;
            expenses: Array<{ description: string; amount: number; account: string }>;
            totalIncome: number;
            totalExpenses: number;
        }> = {};

        revenueEntries.forEach((entry) => {
            const dateStr = entry.entry_date.toISOString().split("T")[0];
            if (!transactionsByDate[dateStr]) {
                transactionsByDate[dateStr] = {
                    date: dateStr,
                    incomes: [],
                    expenses: [],
                    totalIncome: 0,
                    totalExpenses: 0,
                };
            }
            transactionsByDate[dateStr].incomes.push({
                description: entry.description || "Income",
                amount: entry.credit_amount,
                account: entry.account.account_name,
            });
            transactionsByDate[dateStr].totalIncome += entry.credit_amount;
        });

        expenseEntries.forEach((entry) => {
            const dateStr = entry.entry_date.toISOString().split("T")[0];
            if (!transactionsByDate[dateStr]) {
                transactionsByDate[dateStr] = {
                    date: dateStr,
                    incomes: [],
                    expenses: [],
                    totalIncome: 0,
                    totalExpenses: 0,
                };
            }
            transactionsByDate[dateStr].expenses.push({
                description: entry.description || "Expense",
                amount: entry.debit_amount,
                account: entry.account.account_name,
            });
            transactionsByDate[dateStr].totalExpenses += entry.debit_amount;
        });

        // Calculate cash balances
        const cashBalance = {
            opening: 0, // Would need to calculate from previous period
            closing: 0,
        };

        // Calculate closing balance from cash entries
        const cashDebits = cashEntries
            .filter((e) => e.account.account_code === "1000")
            .reduce((sum, e) => sum + e.debit_amount, 0);
        const cashCredits = cashEntries
            .filter((e) => e.account.account_code === "1000")
            .reduce((sum, e) => sum + e.credit_amount, 0);

        const bankDebits = cashEntries
            .filter((e) => e.account.account_code === "1010")
            .reduce((sum, e) => sum + e.debit_amount, 0);
        const bankCredits = cashEntries
            .filter((e) => e.account.account_code === "1010")
            .reduce((sum, e) => sum + e.credit_amount, 0);

        const mobileDebits = cashEntries
            .filter((e) => e.account.account_code === "1020")
            .reduce((sum, e) => sum + e.debit_amount, 0);
        const mobileCredits = cashEntries
            .filter((e) => e.account.account_code === "1020")
            .reduce((sum, e) => sum + e.credit_amount, 0);

        return NextResponse.json({
            period,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            summary: {
                totalIncome,
                totalExpenses,
                netCashFlow,
            },
            cashBalances: {
                cash: { opening: 0, closing: cashDebits - cashCredits },
                bank: { opening: 0, closing: bankDebits - bankCredits },
                mobileMoney: { opening: 0, closing: mobileDebits - mobileCredits },
            },
            transactionsByDate: Object.values(transactionsByDate).sort((a, b) => a.date.localeCompare(b.date)),
            allTransactions: {
                incomes: revenueEntries.map((e) => ({
                    date: e.entry_date.toISOString().split("T")[0],
                    description: e.description || "Income",
                    amount: e.credit_amount,
                    account: e.account.account_name,
                    source: e.source_type,
                })),
                expenses: expenseEntries.map((e) => ({
                    date: e.entry_date.toISOString().split("T")[0],
                    description: e.description || "Expense",
                    amount: e.debit_amount,
                    account: e.account.account_name,
                    source: e.source_type,
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching cash book:", error);
        return NextResponse.json({ error: "Failed to fetch cash book" }, { status: 500 });
    }
}
