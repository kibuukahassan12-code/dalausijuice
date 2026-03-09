import { PrismaClient } from "@prisma/client";
import { postProductionQCApproval } from "@/lib/accounting";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const PRICE_PER_LITER = 10000;

export async function GET() {
    try {
        const qcChecks = await prisma.qualityCheck.findMany({
            include: {
                batch: {
                    include: {
                        plan: true,
                    },
                },
            },
            orderBy: { checked_at: "desc" },
        });
        return NextResponse.json(qcChecks);
    } catch (error) {
        console.error("Error fetching QC checks:", error);
        return NextResponse.json({ error: "Failed to fetch QC checks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { batch_id, temperature_ok, hygiene_ok, taste_ok, status, remarks, checked_by } = data;

        if (!batch_id || !checked_by || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify batch exists and is in QC_PENDING status
        const batch = await prisma.productionBatch.findUnique({
            where: { id: batch_id },
            include: { plan: true },
        });
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }
        if (batch.status !== "QC_PENDING") {
            return NextResponse.json({ error: `Batch is not in QC_PENDING status. Current: ${batch.status}` }, { status: 400 });
        }

        const qcStatus = status.toUpperCase();
        if (qcStatus !== "APPROVED" && qcStatus !== "REJECTED") {
            return NextResponse.json({ error: "Status must be APPROVED or REJECTED" }, { status: 400 });
        }

        // All checks must pass for approval
        if (qcStatus === "APPROVED" && (!temperature_ok || !hygiene_ok || !taste_ok)) {
            return NextResponse.json({ error: "All checks (temperature, hygiene, taste) must pass for approval" }, { status: 400 });
        }

        const qcCheck = await prisma.qualityCheck.create({
            data: {
                batch_id,
                temperature_ok: Boolean(temperature_ok),
                hygiene_ok: Boolean(hygiene_ok),
                taste_ok: Boolean(taste_ok),
                status: qcStatus,
                remarks: remarks || null,
                checked_by,
            },
        });

        // Update batch status
        await prisma.productionBatch.update({
            where: { id: batch_id },
            data: { status: qcStatus },
        });

        // AUTOMATIC ACCOUNTING: Post to Finished Goods Inventory on approval
        if (qcStatus === "APPROVED") {
            try {
                await postProductionQCApproval(batch_id, batch.output_liters, checked_by);
            } catch (error) {
                console.error("Error posting accounting entry:", error);
                // Don't fail the QC check if accounting fails - log and continue
            }
        }

        return NextResponse.json(qcCheck);
    } catch (error) {
        console.error("Error creating QC check:", error);
        return NextResponse.json({ error: "Failed to create QC check" }, { status: 500 });
    }
}
