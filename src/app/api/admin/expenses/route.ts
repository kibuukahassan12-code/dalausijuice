import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { postOperatingExpense } from "@/lib/accounting";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            include: { paymentMethod: true },
            orderBy: { expenseDate: "desc" },
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { category, description, amount, expenseDate, paymentMethodId } = await request.json();
        const expense = await prisma.expense.create({
            data: {
                category,
                description,
                amount: parseFloat(amount),
                expenseDate: new Date(expenseDate),
                paymentMethodId,
            },
            include: { paymentMethod: true },
        });

        // AUTOMATIC ACCOUNTING: Post Operating Expense
        try {
            const paymentMethodCode = expense.paymentMethod?.code || "CASH";
            await postOperatingExpense(
                expense.id,
                expense.amount,
                paymentMethodCode,
                expense.category,
                expense.description,
                "system"
            );
        } catch (error) {
            console.error("Error posting expense accounting entry:", error);
            // Don't fail expense creation
        }

        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}

