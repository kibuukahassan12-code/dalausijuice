import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


const BASE_PRICE_PER_LITER = 10000;

export async function GET() {
    try {
        const wastage = await prisma.wastage.findMany({
            include: {
                batch: true,
                recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { recordedAt: "desc" },
        });
        return NextResponse.json(wastage);
    } catch (error) {
        console.error("Error fetching wastage:", error);
        return NextResponse.json({ error: "Failed to fetch wastage" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { batchId, recordedById, quantityLiters, cause, correctiveAction } = data;

        if (!recordedById || !quantityLiters || !cause) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const costImpact = Number(quantityLiters) * BASE_PRICE_PER_LITER;

        const wastage = await prisma.wastage.create({
            data: {
                batchId: batchId || null,
                recordedById,
                quantityLiters: Number(quantityLiters),
                cause,
                correctiveAction: correctiveAction || null,
                costImpact,
            },
            include: {
                batch: true,
                recordedBy: { select: { id: true, name: true } },
            },
        });

        // If batchId provided, update batch wastage totals
        if (batchId) {
            const batchWastage = await prisma.wastage.aggregate({
                where: { batchId },
                _sum: { quantityLiters: true },
            });
            await prisma.batch.update({
                where: { id: batchId },
                data: { wastageLiters: batchWastage._sum.quantityLiters || 0 },
            });
        }

        return NextResponse.json(wastage);
    } catch (error) {
        console.error("Error creating wastage record:", error);
        return NextResponse.json({ error: "Failed to create wastage record" }, { status: 500 });
    }
}

