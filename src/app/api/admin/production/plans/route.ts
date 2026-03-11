export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


const PRICE_PER_LITER = 10000; // Business rule: 1L = 10,000 UGX

export async function GET() {
    try {
        const plans = await prisma.productionPlan.findMany({
            include: {
                event: true,
                batches: {
                    include: {
                        quality_check: true,
                        packaging_records: true,
                    },
                },
            },
            orderBy: { plan_date: "desc" },
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching production plans:", error);
        return NextResponse.json({ error: "Failed to fetch production plans" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { plan_date, juice_type, production_type, event_id, target_liters, created_by } = data;

        if (!plan_date || !juice_type || !target_liters || !production_type || !created_by) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate event_id if production_type is EVENT
        if (production_type === "EVENT" && !event_id) {
            return NextResponse.json({ error: "event_id is required for EVENT production type" }, { status: 400 });
        }

        // Calculate expected revenue
        const expected_revenue_ugx = Number(target_liters) * PRICE_PER_LITER;

        const plan = await prisma.productionPlan.create({
            data: {
                plan_date: new Date(plan_date),
                juice_type,
                production_type: production_type.toUpperCase(),
                event_id: event_id || null,
                target_liters: Number(target_liters),
                expected_revenue_ugx,
                created_by,
            },
            include: {
                event: true,
            },
        });

        // If EVENT type, update event production_status to PLANNED
        if (production_type === "EVENT" && event_id) {
            await prisma.event.update({
                where: { id: event_id },
                data: { production_status: "PLANNED" },
            });
        }

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Error creating production plan:", error);
        return NextResponse.json({ error: "Failed to create production plan" }, { status: 500 });
    }
}

