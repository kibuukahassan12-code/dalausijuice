import { prisma } from "@/lib/prisma";
import { postWastage } from "@/lib/accounting";
import { NextResponse } from "next/server";

const PRICE_PER_LITER = 10000;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const batch = await prisma.productionBatch.findUnique({
            where: { id },
            include: {
                plan: {
                    include: {
                        event: true,
                    },
                },
                raw_materials: true,
                quality_check: true,
                packaging_records: true,
                finished_goods: true,
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Error fetching batch:", error);
        return NextResponse.json({ error: "Failed to fetch batch" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const { end_time, output_liters, wastage_liters } = data;

        const batch = await prisma.productionBatch.findUnique({ where: { id } });
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        if (batch.status !== "PROCESSING") {
            return NextResponse.json({ error: `Batch is not in PROCESSING status. Current: ${batch.status}` }, { status: 400 });
        }

        // Calculate metrics
        const totalRawMaterialsCost = await prisma.batchRawMaterial.aggregate({
            where: { batch_id: id },
            _sum: { cost_ugx: true },
        });

        const totalCost = totalRawMaterialsCost._sum.cost_ugx || 0;
        const output = Number(output_liters) || 0;
        const wastage = Number(wastage_liters) || 0;
        const inputLiters = output + wastage;
        const yield_percentage = inputLiters > 0 ? (output / inputLiters) * 100 : 0;
        const batch_value_ugx = output * PRICE_PER_LITER;

        const updated = await prisma.productionBatch.update({
            where: { id },
            data: {
                end_time: end_time ? new Date(end_time) : null,
                output_liters: output,
                wastage_liters: wastage,
                yield_percentage,
                batch_value_ugx,
                status: "QC_PENDING", // Move to QC after completion
            },
        });

        // AUTOMATIC ACCOUNTING: Post wastage entry
        if (wastage > 0) {
            try {
                await postWastage(id, wastage, "system"); // TODO: Get actual user ID
            } catch (error) {
                console.error("Error posting wastage accounting entry:", error);
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating batch:", error);
        return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
    }
}
