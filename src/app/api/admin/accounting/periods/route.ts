import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const periods = await prisma.accountingPeriod.findMany({
            orderBy: { period_month: "desc" },
        });
        return NextResponse.json(periods);
    } catch (error) {
        console.error("Error fetching accounting periods:", error);
        return NextResponse.json({ error: "Failed to fetch accounting periods" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { periodMonth, closedBy } = data;

        if (!periodMonth) {
            return NextResponse.json({ error: "Period month (YYYY-MM) is required" }, { status: 400 });
        }

        const period = await prisma.accountingPeriod.findUnique({
            where: { period_month: periodMonth },
        });

        if (!period) {
            return NextResponse.json({ error: "Period not found" }, { status: 404 });
        }

        if (period.status === "CLOSED") {
            return NextResponse.json({ error: "Period is already closed" }, { status: 400 });
        }

        // Validate: Check for unposted items
        const unpostedBatches = await prisma.productionBatch.findMany({
            where: {
                created_at: { gte: period.start_date, lte: period.end_date },
                status: { not: "APPROVED" },
            },
        });

        const unpostedPOs = await prisma.purchaseOrder.findMany({
            where: {
                created_at: { gte: period.start_date, lte: period.end_date },
                status: "OPEN",
            },
        });

        const unpostedSales = await prisma.order.findMany({
            where: {
                orderDate: { gte: period.start_date, lte: period.end_date },
                status: "Pending",
            },
        });

        const unpostedEvents = await prisma.event.findMany({
            where: {
                createdAt: { gte: period.start_date, lte: period.end_date },
                status: "Upcoming",
            },
        });

        const exceptions = {
            unpostedBatches: unpostedBatches.length,
            unpostedPOs: unpostedPOs.length,
            unpostedSales: unpostedSales.length,
            unpostedEvents: unpostedEvents.length,
        };

        // Compute net profit from ledger only (reports aggregate ledger_entries)
        const entries = await prisma.ledgerEntry.findMany({
            where: { entry_date: { gte: period.start_date, lte: period.end_date } },
            include: { account: true },
        });
        const revenue = entries.filter((e) => e.account.account_type === "REVENUE").reduce((s, e) => s + e.credit_amount, 0);
        const cogs = entries.filter((e) => e.account.account_type === "COGS").reduce((s, e) => s + e.debit_amount, 0);
        const expenses = entries.filter((e) => e.account.account_type === "EXPENSE").reduce((s, e) => s + e.debit_amount, 0);
        const netProfit = revenue - cogs - expenses;

        // Post retained earnings closing entry BEFORE closing (writes blocked into CLOSED periods)
        const { createLedgerEntry } = await import("@/lib/accounting");
        const retainedEarningsAccount = await prisma.chartOfAccount.findUnique({ where: { account_code: "3100" } });
        if (retainedEarningsAccount && netProfit !== 0) {
            await createLedgerEntry({
                entry_date: period.end_date,
                account_code: "3100",
                debit_amount: netProfit < 0 ? Math.abs(netProfit) : 0,
                credit_amount: netProfit > 0 ? netProfit : 0,
                source_type: "ADJUSTMENT",
                source_id: period.id,
                department: "GENERAL",
                description: `Month-end closing – ${periodMonth}`,
            });
        }

        // Then close the period
        const closedPeriod = await prisma.accountingPeriod.update({
            where: { period_month: periodMonth },
            data: { status: "CLOSED", closed_by: closedBy || "system", closed_at: new Date() },
        });

        return NextResponse.json({ period: closedPeriod, exceptions, netProfit });
    } catch (error) {
        console.error("Error closing accounting period:", error);
        return NextResponse.json({ error: "Failed to close accounting period" }, { status: 500 });
    }
}
