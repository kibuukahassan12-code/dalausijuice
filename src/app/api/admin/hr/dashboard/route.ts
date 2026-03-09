import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(dayStart);
        weekStart.setDate(dayStart.getDate() - dayStart.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalEmployees,
            casualThisMonth,
            payrollsThisMonth,
            payrollsThisWeek,
            payrollsToday,
            departments,
            recentAttendance
        ] = await Promise.all([
            prisma.employee.count({ where: { status: "ACTIVE" } }),
            prisma.employee.count({
                where: {
                    status: "ACTIVE",
                    employmentType: "CASUAL",
                    hireDate: { lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) },
                },
            }),
            prisma.payroll.findMany({
                where: {
                    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
                    status: "PAID",
                },
            }),
            prisma.payroll.findMany({
                where: {
                    processedAt: { gte: weekStart },
                    status: "PAID",
                },
            }),
            prisma.payroll.findMany({
                where: {
                    processedAt: { gte: dayStart },
                    status: "PAID",
                },
            }),
            prisma.department.findMany({
                include: { _count: { select: { employees: { where: { status: "ACTIVE" } } } } }
            }),
            prisma.attendance.findMany({
                where: { date: { gte: weekStart } },
                select: { date: true, id: true }
            })
        ]);

        const payrollCostThisMonth = payrollsThisMonth.reduce((s, p) => s + p.netPay, 0);
        const payrollCostThisWeek = payrollsThisWeek.reduce((s, p) => s + p.netPay, 0);
        const payrollCostToday = payrollsToday.reduce((s, p) => s + p.netPay, 0);

        // Process department distribution
        const departmentDistribution = departments.map(d => ({
            name: d.name,
            count: d._count.employees
        })).filter(d => d.count > 0);

        // Process 7-day attendance trend
        const attendanceTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(dayStart);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const count = recentAttendance.filter(a => new Date(a.date).toISOString().split("T")[0] === dateStr).length;
            attendanceTrend.push({ date: dateStr, count });
        }

        return NextResponse.json({
            totalEmployees,
            casualThisMonth,
            payrollCostToday,
            payrollCostThisWeek,
            payrollCostThisMonth,
            departmentDistribution,
            attendanceTrend
        });
    } catch (error) {
        console.error("Error fetching HR dashboard:", error);
        return NextResponse.json(
            {
                totalEmployees: 0,
                casualThisMonth: 0,
                payrollCostToday: 0,
                payrollCostThisWeek: 0,
                payrollCostThisMonth: 0,
                departmentDistribution: [],
                attendanceTrend: []
            },
            { status: 200 }
        );
    }
}
