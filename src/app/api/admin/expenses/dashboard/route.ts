import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 30); // Last 30 days for trend

        const [expenses, paymentMethods] = await Promise.all([
            prisma.operatingExpense.findMany({
                where: { expenseDate: { gte: weekStart } },
                include: { paymentMethod: true },
                orderBy: { expenseDate: "desc" }
            }),
            prisma.paymentMethod.findMany()
        ]);

        // Process category distribution
        const categoryMap: Record<string, number> = {};
        expenses.forEach(ex => {
            categoryMap[ex.category] = (categoryMap[ex.category] || 0) + Number(ex.amount);
        });
        const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

        // Process 7-day trend
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const amount = expenses
                .filter(ex => ex.expenseDate.toISOString().split("T")[0] === dateStr)
                .reduce((s, ex) => s + Number(ex.amount), 0);
            trend.push({ date: dateStr, amount });
        }

        const stats = {
            totalMonth: expenses.reduce((s, ex) => s + Number(ex.amount), 0),
            topCategory: categoryDistribution.sort((a, b) => b.value - a.value)[0]?.name || "None",
            methodBreakdown: paymentMethods.map(pm => ({
                name: pm.name,
                total: expenses.filter(ex => ex.paymentMethodId === pm.id).reduce((s, ex) => s + Number(ex.amount), 0)
            })).filter(m => m.total > 0)
        };

        return NextResponse.json({
            expenses,
            paymentMethods,
            categoryDistribution,
            trend,
            stats
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch expense dashboard" }, { status: 500 });
    }
}
