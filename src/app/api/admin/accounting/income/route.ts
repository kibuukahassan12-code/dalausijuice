import { PrismaClient } from "@prisma/client";
import { createLedgerEntry } from "@/lib/accounting";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: Record<string, unknown> = {
            source_type: "MANUAL_INCOME",
        };

        if (startDate && endDate) {
            where.entry_date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const entries = await prisma.ledgerEntry.findMany({
            where,
            include: { account: true },
            orderBy: { entry_date: "desc" },
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Error fetching income records:", error);
        return NextResponse.json({ error: "Failed to fetch income records" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { description, amount, paymentMethod, date, category } = data;

        if (!description || !amount || !paymentMethod || !date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const method = paymentMethod.toUpperCase();
        let cashCode = "1000";
        if (method === "BANK" || method === "BANK TRANSFER") cashCode = "1010";
        else if (["MTN", "AIRTEL", "AFRICELL", "MOBILE", "MOBILE_MONEY"].some((m) => method.includes(m))) cashCode = "1020";

        // Use Miscellaneous Income account (4200) or create a generic income account
        // For now, we'll use Event Catering Revenue (4100) as a catch-all, but ideally we should add 4200
        const incomeAccountCode = category === "EVENT" ? "4100" : "4200"; // Will use 4200 if it exists, fallback to 4100
        let incomeAccount = await prisma.chartOfAccount.findFirst({
            where: { account_code: incomeAccountCode, active: true },
        });

        // If 4200 doesn't exist, use 4100 as fallback
        if (!incomeAccount && incomeAccountCode === "4200") {
            incomeAccount = await prisma.chartOfAccount.findFirst({
                where: { account_code: "4100", active: true },
            });
        }

        if (!incomeAccount) {
            return NextResponse.json({ error: "Income account not found" }, { status: 500 });
        }

        const cashAccount = await prisma.chartOfAccount.findFirst({
            where: { account_code: cashCode, active: true },
        });

        if (!cashAccount) {
            return NextResponse.json({ error: `Payment account ${cashCode} not found` }, { status: 500 });
        }

        const entryDate = new Date(date);
        const sourceId = `INC-${Date.now()}`;

        // Debit Cash/Bank/Mobile Money
        await createLedgerEntry({
            entry_date: entryDate,
            account_code: cashAccount.account_code,
            debit_amount: parseFloat(String(amount)),
            credit_amount: 0,
            source_type: "MANUAL_INCOME",
            source_id: sourceId,
            department: "GENERAL",
            description: `Income: ${description}`,
        });

        // Credit Revenue
        await createLedgerEntry({
            entry_date: entryDate,
            account_code: incomeAccount.account_code,
            debit_amount: 0,
            credit_amount: parseFloat(String(amount)),
            source_type: "MANUAL_INCOME",
            source_id: sourceId,
            department: "GENERAL",
            description: `Income: ${description}`,
        });

        return NextResponse.json({ success: true, sourceId });
    } catch (error) {
        console.error("Error recording income:", error);
        return NextResponse.json({ error: "Failed to record income" }, { status: 500 });
    }
}
