import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            include: {
                department: true,
                role: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            employeeNo,
            firstName,
            lastName,
            phone,
            email,
            departmentId,
            roleId,
            employmentType,
            hireDate,
            baseSalary,
        } = data;

        if (!firstName || !lastName || !phone || !departmentId || !roleId || !employmentType || !hireDate || baseSalary == null) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const nextNo = employeeNo || `EMP-${Date.now().toString(36).toUpperCase().slice(-8)}`;
        const existing = await prisma.employee.findFirst({
            where: { employeeNo: nextNo },
        });
        const finalNo = existing ? `EMP-${Date.now().toString(36).toUpperCase().slice(-8)}` : nextNo;

        const employee = await prisma.employee.create({
            data: {
                employeeNo: finalNo,
                firstName,
                lastName,
                phone,
                email: email || null,
                departmentId,
                roleId,
                employmentType: String(employmentType).toUpperCase().replace(/ /g, "_") || "FULL_TIME",
                hireDate: new Date(hireDate),
                baseSalary: parseInt(String(baseSalary), 10),
                status: "ACTIVE",
            },
            include: {
                department: true,
                role: true,
            },
        });
        return NextResponse.json(employee);
    } catch (error) {
        console.error("Error creating employee:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
