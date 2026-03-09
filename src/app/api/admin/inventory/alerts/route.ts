import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const lowStockItems = await prisma.inventoryItem.findMany({
            where: {
                currentStock: {
                    lte: prisma.inventoryItem.fields.lowStockThreshold
                },
                isActive: true
            },
            orderBy: {
                currentStock: "asc"
            }
        });

        // Add additional info like pending orders for these items
        const alerts = lowStockItems.map(item => ({
            id: item.id,
            name: item.name,
            currentStock: item.currentStock,
            threshold: item.lowStockThreshold,
            unit: item.unit,
            status: item.currentStock === 0 ? "CRITICAL" : "LOW",
            supplier: item.supplier
        }));

        return NextResponse.json(alerts);
    } catch (error) {
        console.error("Alerts API Error:", error);
        // Fallback calculation if prisma fields filter fails in some versions
        try {
            const all = await prisma.inventoryItem.findMany({ where: { isActive: true } });
            const filtered = all.filter(i => i.currentStock <= i.lowStockThreshold);
            return NextResponse.json(filtered.map(item => ({
                id: item.id,
                name: item.name,
                currentStock: item.currentStock,
                threshold: item.lowStockThreshold,
                unit: item.unit,
                status: item.currentStock === 0 ? "CRITICAL" : "LOW",
                supplier: item.supplier
            })));
        } catch (e) {
            return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
        }
    }
}
