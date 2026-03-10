import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const date = searchParams.get("date");

        const where: Record<string, unknown> = {};
        if (employeeId) where.employeeId = employeeId;
        if (date) {
            const d = new Date(date);
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            where.date = { gte: start, lte: end };
        }

        const records = await prisma.attendance.findMany({
            where,
            include: { employee: true },
            orderBy: { date: "desc" },
        });
        return NextResponse.json(records);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { employeeId, date, checkIn, checkOut, action } = data;

        if (!employeeId || !date) {
            return NextResponse.json({ error: "employeeId and date are required" }, { status: 400 });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        let record = await prisma.attendance.findFirst({
            where: {
                employeeId,
                date: { gte: targetDate, lte: endOfDay },
            },
        });

        const now = new Date();
        const hoursWorked = (checkIn: Date | null, checkOut: Date | null) => {
            if (!checkIn || !checkOut) return 0;
            return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        };

        if (action === "check_in") {
            if (record?.checkIn) {
                return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
            }
            if (record) {
                record = await prisma.attendance.update({
                    where: { id: record.id },
                    data: { checkIn: checkIn ? new Date(checkIn) : now },
                    include: { employee: true },
                });
            } else {
                record = await prisma.attendance.create({
                    data: {
                        employeeId,
                        date: targetDate,
                        checkIn: checkIn ? new Date(checkIn) : now,
                        hoursWorked: 0,
                    },
                    include: { employee: true },
                });
            }
            return NextResponse.json(record);
        }

        if (action === "check_out") {
            if (!record) {
                return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
            }
            const checkoutTime = checkOut ? new Date(checkOut) : now;
            const hrs = hoursWorked(record.checkIn, checkoutTime);
            record = await prisma.attendance.update({
                where: { id: record.id },
                data: { checkOut: checkoutTime, hoursWorked: hrs },
                include: { employee: true },
            });
            return NextResponse.json(record);
        }

        if (checkIn !== undefined && checkOut !== undefined) {
            const hrs = hoursWorked(new Date(checkIn), new Date(checkOut));
            if (record) {
                record = await prisma.attendance.update({
                    where: { id: record.id },
                    data: {
                        checkIn: new Date(checkIn),
                        checkOut: new Date(checkOut),
                        hoursWorked: hrs,
                    },
                    include: { employee: true },
                });
            } else {
                record = await prisma.attendance.create({
                    data: {
                        employeeId,
                        date: targetDate,
                        checkIn: new Date(checkIn),
                        checkOut: new Date(checkOut),
                        hoursWorked: hrs,
                    },
                    include: { employee: true },
                });
            }
            return NextResponse.json(record);
        }

        return NextResponse.json({ error: "Provide action (check_in/check_out) or checkIn and checkOut" }, { status: 400 });
    } catch (error) {
        console.error("Error saving attendance:", error);
        return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
    }
}

