import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const [items, totalValueRaw] = await Promise.all([
            prisma.inventoryItem.findMany({
                where: { isActive: true },
                orderBy: { name: "asc" }
            }),
            prisma.inventoryItem.aggregate({
                where: { isActive: true },
                _sum: { currentStock: true }
            })
        ]);

        // Calculate total inventory value
        const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

        // Low stock items (stock < 50 units/kg/liters)
        const lowStockItems = items.filter(i => i.currentStock < 10).length;

        // Categories distribution
        const categoryMap: Record<string, number> = {};
        items.forEach(item => {
            categoryMap[item.category] = (categoryMap[item.category] || 0) + (item.currentStock * item.unitCost);
        });
        const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

        // Recent stock changes (mock or based on updatedAt if we had logs, but let's use the actual items for now)
        const topItems = [...items].sort((a, b) => (b.currentStock * b.unitCost) - (a.currentStock * a.unitCost)).slice(0, 5);

        return NextResponse.json({
            totalItems: items.length,
            totalValue,
            lowStockItems,
            categoryDistribution,
            topItems: topItems.map(i => ({ name: i.name, value: i.currentStock * i.unitCost, stock: i.currentStock, unit: i.unit })),
            items
        });
    } catch (error) {
        console.error("Error fetching inventory dashboard:", error);
        return NextResponse.json({ error: "Failed to fetch inventory data" }, { status: 500 });
    }
}

