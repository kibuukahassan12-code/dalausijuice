export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


const PRICE_PER_LITER = 10000;

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);

        const [
            todayPlans,
            todayBatches,
            qcChecks,
            weeklyBatches,
            weeklyPlans
        ] = await Promise.all([
            prisma.productionPlan.findMany({ where: { plan_date: { gte: today, lt: tomorrow } } }),
            prisma.productionBatch.findMany({
                where: { created_at: { gte: today, lt: tomorrow } },
                include: { raw_materials: true, quality_check: true }
            }),
            prisma.qualityCheck.findMany({ where: { checked_at: { gte: today, lt: tomorrow } } }),
            prisma.productionBatch.findMany({ where: { created_at: { gte: weekStart, lt: tomorrow } } }),
            prisma.productionPlan.findMany({ where: { plan_date: { gte: weekStart, lt: tomorrow } } })
        ]);

        const targetLiters = todayPlans.reduce((sum, p) => sum + p.target_liters, 0);
        const actualOutput = todayBatches.reduce((sum, b) => sum + b.output_liters, 0);
        const totalWastage = todayBatches.reduce((sum, b) => sum + b.wastage_liters, 0);
        const totalInput = actualOutput + totalWastage;
        const wastagePercent = totalInput > 0 ? (totalWastage / totalInput) * 100 : 0;

        const qcApproved = qcChecks.filter(q => q.status === "APPROVED").length;
        const qcRejected = qcChecks.filter(q => q.status === "REJECTED").length;
        const qcRejectionRate = qcChecks.length > 0 ? (qcRejected / qcChecks.length) * 100 : 0;
        const hygienePassed = qcChecks.filter(q => q.hygiene_ok).length;
        const hygieneScore = qcChecks.length > 0 ? (hygienePassed / qcChecks.length) * 100 : 0;

        const totalCost = todayBatches.reduce((sum, b) => sum + b.raw_materials.reduce((c, rm) => c + rm.cost_ugx, 0), 0);
        const costPerLiter = actualOutput > 0 ? totalCost / actualOutput : 0;
        const revenuePotential = actualOutput * PRICE_PER_LITER;

        // 7-day trend
        const outputTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const output = weeklyBatches
                .filter(b => b.created_at.toISOString().split("T")[0] === dateStr)
                .reduce((s, b) => s + b.output_liters, 0);
            const target = weeklyPlans
                .filter(p => p.plan_date.toISOString().split("T")[0] === dateStr)
                .reduce((s, p) => s + p.target_liters, 0);
            outputTrend.push({ date: dateStr, output, target });
        }

        // Juice type distribution
        const juiceTypeMap: Record<string, number> = {};
        todayBatches.forEach(b => {
            juiceTypeMap[b.juice_type] = (juiceTypeMap[b.juice_type] || 0) + b.output_liters;
        });
        const juiceTypeDistribution = Object.entries(juiceTypeMap).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            dailyOutput: actualOutput,
            targetLiters,
            wastagePercent,
            hygieneScore,
            costPerLiter,
            revenuePotential,
            qcRejectionRate,
            batchesToday: todayBatches.length,
            qcApproved,
            qcRejected,
            outputTrend,
            juiceTypeDistribution
        });
    } catch (error) {
        console.error("Error fetching production dashboard:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}

