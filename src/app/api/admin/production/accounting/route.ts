export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const referenceType = searchParams.get("reference_type");
        const referenceId = searchParams.get("reference_id");

        const where: Record<string, string> = {};
        if (referenceType) where.source_type = referenceType;
        if (referenceId) where.source_id = referenceId;

        const entries = await prisma.ledgerEntry.findMany({
            where,
            include: { account: true },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Error fetching accounting entries:", error);
        return NextResponse.json({ error: "Failed to fetch accounting entries" }, { status: 500 });
    }
}

