export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");
        const type = searchParams.get("type") || "daily"; // daily, weekly, monthly

        const targetDate = date ? new Date(date) : new Date();
        let startDate: Date;
        let endDate: Date;

        if (type === "monthly") {
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (type === "weekly") {
            startDate = new Date(targetDate);
            startDate.setDate(targetDate.getDate() - targetDate.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date(targetDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetDate);
            endDate.setHours(23, 59, 59, 999);
        }

        // Fetch all ledger entries up to the end date for a snapshot balance sheet
        // Balance sheet is a snapshot in time.
        const entries = await prisma.ledgerEntry.findMany({
            where: { entry_date: { lte: endDate } },
            include: { account: true },
        });

        const assets: any = {
            cash: entries.filter(e => e.account.account_code === "1000").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            bank: entries.filter(e => e.account.account_code === "1010").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            mobileMoney: entries.filter(e => e.account.account_code === "1020").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            receivables: entries.filter(e => e.account.account_code === "1100").reduce((s, e) => s + e.debit_amount - e.credit_amount, 0),
            inventory: 0, // Simplified for now
        };
        assets.total = assets.cash + assets.bank + assets.mobileMoney + assets.receivables + assets.inventory;

        const liabilities: any = {
            payables: entries.filter(e => e.account.account_code === "2000").reduce((s, e) => s + e.credit_amount - e.debit_amount, 0),
        };
        liabilities.total = liabilities.payables;

        // Equity = Assets - Liabilities
        const equity = {
            retainedEarnings: assets.total - liabilities.total,
            total: assets.total - liabilities.total
        };

        const report = {
            brand: {
                name: "Dalausi Juice",
                department: "Accounting & Finance",
                generationDate: new Date().toISOString(),
            },
            period: {
                type,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            data: {
                assets,
                liabilities,
                equity,
            }
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error generating balance sheet:", error);
        return NextResponse.json({ error: "Failed to generate balance sheet" }, { status: 500 });
    }
}

