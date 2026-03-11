export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const revenues = await prisma.dailyRevenue.findMany({
            orderBy: { date: "desc" },
        });
        return NextResponse.json(revenues);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { date, amount, description } = await request.json();

        const revenue = await prisma.dailyRevenue.upsert({
            where: { date: new Date(date) },
            update: { amount: parseFloat(amount), description },
            create: {
                date: new Date(date),
                amount: parseFloat(amount),
                description,
            },
        });

        return NextResponse.json(revenue);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save revenue" }, { status: 500 });
    }
}

