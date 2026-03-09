import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const PRICE_PER_LITER = 10000;

function generateBatchCode(): string {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `BATCH-${dateStr}-${random}`;
}

export async function GET() {
    try {
        const batches = await prisma.productionBatch.findMany({
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
            orderBy: { created_at: "desc" },
        });
        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { plan_id, juice_type, start_time, raw_materials_used, target_liters: custom_liters } = data;

        if (!juice_type || !start_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let final_materials = raw_materials_used || [];
        let plan = null;
        if (plan_id) {
            plan = await prisma.productionPlan.findUnique({
                where: { id: plan_id },
            });
        }

        const liters_to_produce = custom_liters || plan?.target_liters || 0;

        // AUTOMATION: If no materials provided, fetch the recipe for the juice type
        if (final_materials.length === 0 && juice_type) {
            const recipe = await prisma.recipe.findFirst({
                where: { product: { name: juice_type } },
                include: { ingredients: { include: { inventoryItem: true } } }
            });

            if (recipe && liters_to_produce > 0) {
                final_materials = recipe.ingredients.map(ing => ({
                    inventory_item_id: ing.inventoryItemId,
                    material_name: ing.inventoryItem.name,
                    quantity_used: ing.quantity * (liters_to_produce / recipe.baseQuantity),
                    unit: ing.inventoryItem.unit,
                    cost_ugx: ing.inventoryItem.unitCost * ing.quantity * (liters_to_produce / recipe.baseQuantity)
                }));
            }
        }

        // VALIDATION: Ensure enough stock for all materials if inventory_item_id is present
        for (const rm of final_materials) {
            if (rm.inventory_item_id) {
                const stock = await prisma.inventoryItem.findUnique({
                    where: { id: rm.inventory_item_id }
                });
                if (stock && stock.currentStock < rm.quantity_used) {
                    return NextResponse.json({
                        error: `Insufficient stock for ${rm.material_name}. Available: ${stock.currentStock}, Needed: ${rm.quantity_used}`
                    }, { status: 400 });
                }
            }
        }

        const batch_code = generateBatchCode();

        const batch = await prisma.$transaction(async (tx) => {
            // Create Batch
            const newBatch = await tx.productionBatch.create({
                data: {
                    batch_code,
                    plan_id: plan_id || null,
                    juice_type,
                    start_time: new Date(start_time),
                    status: liters_to_produce > 0 ? "PROCESSING" : "PROCESSING", // Can refine
                    raw_materials: {
                        create: final_materials.map((rm: any) => ({
                            inventory_item_id: rm.inventory_item_id,
                            material_name: rm.material_name,
                            quantity_used: Number(rm.quantity_used),
                            unit: rm.unit,
                            cost_ugx: Number(rm.cost_ugx),
                        })),
                    },
                },
                include: {
                    raw_materials: true,
                },
            });

            // AUTOMATION: Deduct from Inventory
            for (const rm of final_materials) {
                if (rm.inventory_item_id) {
                    await tx.inventoryItem.update({
                        where: { id: rm.inventory_item_id },
                        data: {
                            currentStock: { decrement: Number(rm.quantity_used) }
                        }
                    });
                }
            }

            return newBatch;
        });

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Error creating batch:", error);
        return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
    }
}
