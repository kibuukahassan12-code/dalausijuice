export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


// Inventory Reservation & Fulfillment Logic
export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Step 1: Check inventory availability
        const inventoryCheck = await checkInventoryAvailability(order.items);

        if (inventoryCheck.available) {
            // Reserve inventory
            await reserveInventory(order.items);

            // Update order stage
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    fulfillmentStage: "INVENTORY_RESERVED",
                    trackingNotes: "Inventory reserved. Preparing your order."
                }
            });

            return NextResponse.json({
                success: true,
                stage: "INVENTORY_RESERVED",
                message: "Inventory reserved successfully"
            });
        } else {
            // Trigger production alert
            const productionNeeded = inventoryCheck.shortages;

            // Update order stage
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    fulfillmentStage: "AWAITING_PRODUCTION",
                    trackingNotes: `Awaiting production: ${productionNeeded.map(p => p.productName).join(", ")}`
                }
            });

            // Auto-create production recommendation
            await createProductionRecommendation(productionNeeded);

            return NextResponse.json({
                success: true,
                stage: "AWAITING_PRODUCTION",
                message: "Production triggered for out-of-stock items",
                productionNeeded
            });
        }

    } catch (error) {
        console.error("Fulfillment Error:", error);
        return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
}

async function checkInventoryAvailability(orderItems: any[]) {
    const shortages = [];
    let allAvailable = true;

    for (const item of orderItems) {
        // Get finished goods inventory for this product
        const finishedGoods = await prisma.finishedGood.findMany({
            where: {
                batch: {
                    juice_type: item.product.name,
                    status: "APPROVED"
                }
            }
        });

        const totalAvailable = finishedGoods.reduce((sum, fg) => sum + fg.liters, 0);
        const required = item.quantity;

        if (totalAvailable < required) {
            allAvailable = false;
            shortages.push({
                productId: item.productId,
                productName: item.product.name,
                required,
                available: totalAvailable,
                shortage: required - totalAvailable
            });
        }
    }

    return { available: allAvailable, shortages };
}

async function reserveInventory(orderItems: any[]) {
    // In a real system, you'd create a "reservation" record
    // For now, we'll just log the reservation
    // This prevents overselling by tracking reserved vs available inventory

    for (const item of orderItems) {
        // Create a tracking note in the system
        console.log(`Reserved ${item.quantity}L of ${item.product.name}`);

        // Future enhancement: Create InventoryReservation model
        // await prisma.inventoryReservation.create({
        //     data: {
        //         productId: item.productId,
        //         quantity: item.quantity,
        //         orderId: item.orderId,
        //         status: "RESERVED"
        //     }
        // });
    }
}

async function createProductionRecommendation(shortages: any[]) {
    // Auto-trigger production planning
    for (const shortage of shortages) {
        console.log(`Production Alert: Need ${shortage.shortage}L of ${shortage.productName}`);

        // Future enhancement: Auto-create production batch
        // await prisma.productionBatch.create({
        //     data: {
        //         juice_type: shortage.productName,
        //         target_liters: Math.ceil(shortage.shortage * 1.2), // 20% buffer
        //         status: "PLANNED",
        //         priority: "HIGH",
        //         reason: `Order fulfillment - ${shortage.shortage}L shortage`
        //     }
        // });
    }
}

// Update order fulfillment stage
export async function PATCH(request: Request) {
    try {
        const { orderId, stage, notes } = await request.json();

        const validStages = [
            "ORDER_RECEIVED",
            "INVENTORY_RESERVED",
            "AWAITING_PRODUCTION",
            "IN_PRODUCTION",
            "QUALITY_CHECK",
            "READY",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "READY_FOR_PICKUP",
            "PICKED_UP"
        ];

        if (!validStages.includes(stage)) {
            return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
        }

        // Generate pickup code for pickup orders
        let pickupCode = null;
        if (stage === "READY_FOR_PICKUP") {
            pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        // Auto-complete order when delivered/picked up
        let status = undefined;
        if (stage === "DELIVERED" || stage === "PICKED_UP") {
            status = "Completed";
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                fulfillmentStage: stage,
                trackingNotes: notes || getDefaultNoteForStage(stage),
                pickupCode: pickupCode || undefined,
                status: status || undefined,
                estimatedDelivery: stage === "OUT_FOR_DELIVERY"
                    ? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
                    : undefined
            },
            include: {
                customer: true,
                items: {
                    include: { product: true }
                }
            }
        });

        // Send notification to customer
        await sendCustomerNotification(order, stage);

        return NextResponse.json({
            success: true,
            order,
            message: `Order moved to ${stage}`
        });

    } catch (error) {
        console.error("Stage Update Error:", error);
        return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
    }
}

function getDefaultNoteForStage(stage: string): string {
    const notes: Record<string, string> = {
        ORDER_RECEIVED: "Your order has been received and is being processed.",
        INVENTORY_RESERVED: "Inventory reserved. Preparing your order.",
        AWAITING_PRODUCTION: "Your juice is being freshly made!",
        IN_PRODUCTION: "Production in progress. Fresh juice coming soon!",
        QUALITY_CHECK: "Quality control check in progress.",
        READY: "Your order is ready!",
        OUT_FOR_DELIVERY: "Your order is on the way!",
        DELIVERED: "Order delivered. Enjoy your fresh juice!",
        READY_FOR_PICKUP: "Your order is ready for pickup!",
        PICKED_UP: "Order picked up. Thank you!"
    };
    return notes[stage] || "Order status updated.";
}

async function sendCustomerNotification(order: any, stage: string) {
    // Future enhancement: Integrate with SMS/WhatsApp API
    console.log(`Notification to ${order.customer.phone}: ${getDefaultNoteForStage(stage)}`);

    // Example WhatsApp integration:
    // const message = `Hello ${order.customer.name}, ${getDefaultNoteForStage(stage)}`;
    // if (stage === "READY_FOR_PICKUP" && order.pickupCode) {
    //     message += ` Your pickup code is: ${order.pickupCode}`;
    // }
    // await sendWhatsApp(order.customer.phone, message);
}

