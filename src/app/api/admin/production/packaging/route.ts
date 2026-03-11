export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


const PRICE_PER_LITER = 10000;

export async function GET() {
    try {
        const packaging = await prisma.packagingRecord.findMany({
            include: {
                batch: {
                    include: {
                        plan: true,
                    },
                },
            },
            orderBy: { packaged_at: "desc" },
        });
        return NextResponse.json(packaging);
    } catch (error) {
        console.error("Error fetching packaging:", error);
        return NextResponse.json({ error: "Failed to fetch packaging" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { batch_id, package_type, package_size_liters, quantity } = data;

        if (!batch_id || !package_type || !package_size_liters || !quantity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify batch is APPROVED
        const batch = await prisma.productionBatch.findUnique({
            where: { id: batch_id },
            include: { plan: true },
        });
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }
        if (batch.status !== "APPROVED") {
            return NextResponse.json({ error: `Batch must be APPROVED to package. Current: ${batch.status}` }, { status: 400 });
        }

        // Event production logic: Only JERRYCAN allowed
        if (batch.plan?.production_type === "EVENT") {
            if (package_type !== "JERRYCAN") {
                return NextResponse.json({ error: "Event production must use JERRYCAN packaging only" }, { status: 400 });
            }
            if (package_size_liters < 10 || package_size_liters > 20) {
                return NextResponse.json({ error: "Event jerrycans must be 10L, 15L, or 20L" }, { status: 400 });
            }
        }

        const sizeLiters = Number(package_size_liters);
        const qty = Number(quantity);
        const total_liters = sizeLiters * qty;
        const total_value_ugx = total_liters * PRICE_PER_LITER;

        // Check if packaging exceeds batch output
        const existingPackaging = await prisma.packagingRecord.aggregate({
            where: { batch_id },
            _sum: { total_liters: true },
        });
        const alreadyPackaged = existingPackaging._sum.total_liters || 0;
        if (alreadyPackaged + total_liters > batch.output_liters) {
            return NextResponse.json({ error: `Packaging exceeds batch output. Available: ${batch.output_liters - alreadyPackaged}L` }, { status: 400 });
        }

        const packaging = await prisma.packagingRecord.create({
            data: {
                batch_id,
                package_type: package_type.toUpperCase(),
                package_size_liters: sizeLiters,
                quantity: qty,
                total_liters,
                total_value_ugx,
            },
        });

        // Create finished goods inventory entry
        await prisma.finishedGoodsInventory.create({
            data: {
                batch_id,
                storage_type: package_type.toUpperCase(),
                quantity: qty,
                liters: total_liters,
                available: true,
            },
        });

        return NextResponse.json(packaging);
    } catch (error) {
        console.error("Error creating packaging record:", error);
        return NextResponse.json({ error: "Failed to create packaging record" }, { status: 500 });
    }
}

