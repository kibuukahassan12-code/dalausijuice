import { PrismaClient } from "@prisma/client";
import { postPayroll } from "@/lib/accounting";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month");
        const employeeId = searchParams.get("employeeId");

        const where: Record<string, unknown> = {};
        if (month) where.month = month;
        if (employeeId) where.employeeId = employeeId;

        const payrolls = await prisma.payroll.findMany({
            where,
            include: { employee: { include: { department: true, role: true } } },
            orderBy: { month: "desc" },
        });
        return NextResponse.json(payrolls);
    } catch (error) {
        console.error("Error fetching payroll:", error);
        return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { employeeId, month, grossPay, deductions, paymentMethod } = data;

        if (!employeeId || !month || grossPay == null) {
            return NextResponse.json({ error: "employeeId, month, and grossPay are required" }, { status: 400 });
        }

        const gross = parseInt(String(grossPay), 10);
        const ded = parseInt(String(deductions || 0), 10);
        const netPay = Math.max(0, gross - ded);

        const existing = await prisma.payroll.findFirst({
            where: { employeeId, month },
        });
        if (existing) {
            return NextResponse.json({ error: `Payroll already exists for this employee for ${month}` }, { status: 400 });
        }

        const payroll = await prisma.payroll.create({
            data: {
                employeeId,
                month,
                grossPay: gross,
                deductions: ded,
                netPay,
                status: "PENDING",
            },
            include: { employee: { include: { department: true, role: true } } },
        });

        const paid = await prisma.payroll.update({
            where: { id: payroll.id },
            data: { status: "PAID", processedAt: new Date() },
            include: { employee: true },
        });

        try {
            await postPayroll(paid.id, netPay, paymentMethod || "CASH", "system");
        } catch (err) {
            console.error("Accounting post failed, reverting status:", err);
            await prisma.payroll.update({
                where: { id: payroll.id },
                data: { status: "PENDING", processedAt: null },
            });
            return NextResponse.json({ error: "Failed to post payroll to accounting" }, { status: 500 });
        }

        return NextResponse.json(paid);
    } catch (error) {
        console.error("Error processing payroll:", error);
        return NextResponse.json({ error: "Failed to process payroll" }, { status: 500 });
    }
}
