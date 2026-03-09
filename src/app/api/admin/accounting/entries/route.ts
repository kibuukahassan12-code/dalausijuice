import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/** Ledger entries: read-only list. No deletes – audit trail is immutable. */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get("accountId");
        const periodId = searchParams.get("periodId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const sourceType = searchParams.get("sourceType");
        const department = searchParams.get("department");

        const where: Record<string, unknown> = {};
        if (accountId) where.account_id = accountId;
        if (periodId) where.period_id = periodId;
        if (sourceType) where.source_type = sourceType;
        if (department) where.department = department;
        if (startDate || endDate) {
            where.entry_date = {};
            if (startDate) (where.entry_date as Record<string, Date>).gte = new Date(startDate);
            if (endDate) (where.entry_date as Record<string, Date>).lte = new Date(endDate);
        }

        const entries = await prisma.ledgerEntry.findMany({
            where,
            include: { account: true, period: true },
            orderBy: { entry_date: "desc" },
            take: 1000,
        });
        return NextResponse.json(entries);
    } catch (error) {
        console.error("Error fetching ledger entries:", error);
        return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
    }
}

/** Optional: manual adjustment entry. Requires source_type + source_id; period must be OPEN. */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { entry_date, account_code, debit_amount, credit_amount, source_type, source_id, department, description } = body;
        if (!source_type || !source_id) {
            return NextResponse.json({ error: "source_type and source_id are required" }, { status: 400 });
        }
        const { createLedgerEntry } = await import("@/lib/accounting");
        await createLedgerEntry({
            entry_date: entry_date ? new Date(entry_date) : new Date(),
            account_code: account_code || "",
            debit_amount: Number(debit_amount) || 0,
            credit_amount: Number(credit_amount) || 0,
            source_type,
            source_id,
            department: department || "GENERAL",
            description: description || "Manual adjustment",
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error creating ledger entry:", error);
        return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
    }
}

/** No deletes – audit trail is immutable. */
export async function DELETE() {
    return NextResponse.json(
        { error: "Ledger entries cannot be deleted. Audit trail is immutable." },
        { status: 405 }
    );
}
