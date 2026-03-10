import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const procurements = await prisma.procurement.findMany({
            orderBy: { purchaseDate: "desc" },
        });
        return NextResponse.json(procurements);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch procurements" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { itemName, supplier, quantity, unitCost, purchaseDate } = await request.json();
        const procurement = await prisma.procurement.create({
            data: {
                itemName,
                supplier,
                quantity: parseFloat(quantity),
                unitCost: parseFloat(unitCost),
                totalCost: parseFloat(quantity) * parseFloat(unitCost),
                purchaseDate: new Date(purchaseDate),
            },
        });
        return NextResponse.json(procurement);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create procurement" }, { status: 500 });
    }
}

