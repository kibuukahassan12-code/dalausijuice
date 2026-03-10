import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


const emptyDaily = (dateStr: string) => ({
    date: dateStr,
    sales: { bottles: 0, jerrycans: 0, events: 0, total: 0 },
    cashPosition: { cash: 0, bank: 0, mobileMoney: 0 },
    profitEstimate: 0,
});

/** Daily sales summary – aggregates ledger_entries only (audit-ready). */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const dateStr = targetDate.toISOString().split("T")[0];

        let entries: { account: { account_code: string; account_type: string }; debit_amount: number; credit_amount: number }[] = [];
        try {
            entries = await prisma.ledgerEntry.findMany({
                where: { entry_date: { gte: startOfDay, lte: endOfDay } },
                include: { account: true },
            });
        } catch (e) {
            console.error("Daily report ledger query:", e);
            return NextResponse.json(emptyDaily(dateStr));
        }

        const bottles = entries.filter(e => e.account.account_code === "4000").reduce((s, e) => s + e.credit_amount, 0);
        const jerrycans = entries.filter(e => e.account.account_code === "4010").reduce((s, e) => s + e.credit_amount, 0);
        const events = entries.filter(e => e.account.account_code === "4100").reduce((s, e) => s + e.credit_amount, 0);
        const revenue = entries.filter(e => e.account.account_type === "REVENUE").reduce((s, e) => s + e.credit_amount, 0);
        const cogs = entries.filter(e => e.account.account_type === "COGS").reduce((s, e) => s + e.debit_amount, 0);
        const expenses = entries.filter(e => e.account.account_type === "EXPENSE").reduce((s, e) => s + e.debit_amount, 0);
        const profitEstimate = revenue - cogs - expenses;
        const cashPosition = {
            cash: entries.filter(e => e.account.account_code === "1000").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            bank: entries.filter(e => e.account.account_code === "1010").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            mobileMoney: entries.filter(e => e.account.account_code === "1020").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
        };

        return NextResponse.json({
            date: dateStr,
            sales: { bottles, jerrycans, events, total: bottles + jerrycans + events },
            cashPosition,
            profitEstimate,
        });
    } catch (error) {
        console.error("Error generating daily report:", error);
        const dateStr = new Date().toISOString().split("T")[0];
        return NextResponse.json(emptyDaily(dateStr));
    }
}

