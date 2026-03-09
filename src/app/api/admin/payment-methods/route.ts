import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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
