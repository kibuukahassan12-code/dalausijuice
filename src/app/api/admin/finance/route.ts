import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = endDateParam ? new Date(endDateParam) : new Date();

        const dateRange = { gte: startDate, lte: endDate };

        // 1. Gross Revenue (Orders + Events)
        const orderRevenue = await prisma.order.aggregate({
            where: { orderDate: dateRange },
            _sum: { totalAmount: true }
        });

        const eventRevenue = await prisma.event.aggregate({
            where: { eventDate: dateRange },
            _sum: { totalAmount: true }
        });

        const grossRevenue = (orderRevenue._sum.totalAmount || 0) + (eventRevenue._sum.totalAmount || 0);

        // 2. Total Procurement Cost
        const procurementCost = await prisma.procurement.aggregate({
            where: { purchaseDate: dateRange },
            _sum: { totalCost: true }
        });

        // 3. Total Operating Expenses
        const expenses = await prisma.expense.aggregate({
            where: { expenseDate: dateRange },
            _sum: { amount: true }
        });

        const totalProcurement = procurementCost._sum.totalCost || 0;
        const totalExpenses = expenses._sum.amount || 0;
        const netRevenue = grossRevenue - (totalProcurement + totalExpenses);

        // 4. Outstanding Balances
        const payments = await prisma.payment.aggregate({
            where: { paymentDate: dateRange },
            _sum: { amountPaid: true }
        });

        const amountPaid = payments._sum.amountPaid || 0;
        const outstanding = grossRevenue - amountPaid;

        return NextResponse.json({
            grossRevenue,
            totalProcurement,
            totalExpenses,
            netRevenue,
            outstanding,
            startDate,
            endDate
        });
    } catch (error) {
        console.error("Finance API error:", error);
        return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
    }
}

