import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const items = await prisma.inventoryItem.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const item = await prisma.inventoryItem.create({
            data: {
                name: body.name,
                category: body.category,
                unit: body.unit,
                currentStock: parseFloat(body.currentStock) || 0,
                unitCost: parseFloat(body.unitCost) || 0,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
                supplier: body.supplier,
                isActive: true
            }
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating inventory item:", error);
        return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
        if (data.currentStock) data.currentStock = parseFloat(data.currentStock);
        if (data.unitCost) data.unitCost = parseFloat(data.unitCost);

        const item = await prisma.inventoryItem.update({
            where: { id },
            data
        });
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
    }
}
