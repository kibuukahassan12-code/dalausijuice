import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { postEventInvoice, postEventPayment } from "@/lib/accounting";
import { NextResponse } from "next/server";


const PRICE_PER_LITER = 10000;

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            where: {
                production_status: { not: null },
            },
            include: {
                customer: true,
                production_plans: {
                    include: {
                        batches: {
                            include: {
                                quality_check: true,
                            },
                        },
                    },
                },
            },
            orderBy: { eventDate: "desc" },
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { customer_id, client_name, event_date, location, ordered_liters } = data;

        if (!customer_id || !client_name || !event_date || !location || !ordered_liters) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Calculate jerrycans required (round up)
        const jerrycans_required = Math.ceil(Number(ordered_liters) / 20);
        const total_value_ugx = Number(ordered_liters) * PRICE_PER_LITER;

        const event = await prisma.event.create({
            data: {
                customerId: customer_id,
                eventName: `${client_name} Event`,
                eventDate: new Date(event_date),
                location,
                client_name,
                ordered_liters: Number(ordered_liters),
                jerrycans_required,
                total_value_ugx,
                production_status: "PLANNED",
                subtotal: total_value_ugx,
                totalAmount: total_value_ugx,
                status: "Upcoming",
            },
            include: {
                customer: true,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("id");
        const data = await request.json();
        const { production_status } = data;

        if (!eventId) {
            return NextResponse.json({ error: "Event ID required" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                production_plans: {
                    include: {
                        batches: {
                            include: {
                                quality_check: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Validate status transition
        if (production_status === "DELIVERED") {
            // Check all batches are APPROVED
            const allBatchesApproved = event.production_plans.every(plan =>
                plan.batches.every(batch => batch.quality_check?.status === "APPROVED")
            );

            if (!allBatchesApproved) {
                return NextResponse.json({ error: "All batches must be QC APPROVED before delivery" }, { status: 400 });
            }

            // AUTOMATIC ACCOUNTING: Post EVENT REVENUE entry
            try {
                await postEventInvoice(eventId, event.total_value_ugx || 0, "system"); // TODO: Get actual user ID
            } catch (error) {
                console.error("Error posting accounting entry:", error);
            }
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { production_status },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

