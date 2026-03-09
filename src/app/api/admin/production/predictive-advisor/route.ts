import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // 1. Fetch Sales Demand (Last 30 Days)
        const salesData = await prisma.orderItem.findMany({
            where: {
                order: {
                    orderDate: { gte: thirtyDaysAgo },
                    status: { not: "Cancelled" }
                }
            },
            include: { product: true }
        });

        // 2. Fetch Event Demand (Upcoming 7 Days)
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        const eventData = await prisma.eventItem.findMany({
            where: {
                event: {
                    eventDate: { gte: now, lte: nextWeek },
                    status: { not: "Cancelled" }
                }
            },
            include: { product: true }
        });

        // 3. Fetch Current Finished Goods Inventory
        const finishedGoods = await prisma.finishedGoodsInventory.findMany({
            where: { available: true },
            include: { batch: true }
        });

        // Calculate Average Daily Demand from Sales
        const productStats: Record<string, {
            name: string,
            avgDaily: number,
            eventNeeds: number,
            currentStock: number,
            productId: string
        }> = {};

        salesData.forEach(item => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = {
                    name: item.product.name,
                    avgDaily: 0,
                    eventNeeds: 0,
                    currentStock: 0,
                    productId: item.productId
                };
            }
            // Simple average: total quantity / 30 days
            productStats[item.productId].avgDaily += item.quantity / 30;
        });

        eventData.forEach(item => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = {
                    name: item.product.name,
                    avgDaily: 0,
                    eventNeeds: 0,
                    currentStock: 0,
                    productId: item.productId
                };
            }
            productStats[item.productId].eventNeeds += item.quantity;
        });

        finishedGoods.forEach(item => {
            const pName = item.batch.juice_type;
            const stats = Object.values(productStats).find(s => s.name === pName);
            if (stats) {
                stats.currentStock += item.liters;
            }
        });

        // 4. Generate Predictions for "Tomorrow"
        const predictions = Object.values(productStats).map(stats => {
            // Recommendation = (Avg Daily * 1.2 Safety) + Event Needs - Current Stock
            const baseRecommendation = (stats.avgDaily * 1.2) + stats.eventNeeds;
            const deficit = Math.max(0, baseRecommendation - stats.currentStock);

            return {
                productId: stats.productId,
                productName: stats.name,
                avgDailyDemand: stats.avgDaily.toFixed(1),
                upcomingEventDemand: stats.eventNeeds,
                currentStock: stats.currentStock.toFixed(1),
                recommendedProduction: Math.ceil(deficit),
                priority: deficit > stats.avgDaily ? "HIGH" : "NORMAL"
            };
        }).filter(p => p.recommendedProduction > 0)
            .sort((a, b) => b.recommendedProduction - a.recommendedProduction);

        return NextResponse.json({
            date: now.toISOString().split('T')[0],
            advisorMessage: predictions.length > 0
                ? `I recommend focusing on ${predictions[0].productName} production tomorrow to meet projected demand.`
                : "Current finished goods inventory is sufficient for projected demand.",
            predictions
        });

    } catch (error) {
        console.error("Predictive Advisor Error:", error);
        return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 });
    }
}
