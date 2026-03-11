export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const methods = await prisma.paymentMethod.findMany({
            where: { isActive: true },
        });
        return NextResponse.json(methods);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
    }
}

