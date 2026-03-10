import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const accounts = await prisma.chartOfAccount.findMany({
            where: { active: true },
            orderBy: { account_code: "asc" },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching chart of accounts:", error);
        return NextResponse.json({ error: "Failed to fetch chart of accounts" }, { status: 500 });
    }
}
