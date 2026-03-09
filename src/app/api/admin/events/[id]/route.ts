import { PrismaClient } from "@prisma/client";
import { postEventReversal, postEventAmountAdjustment, postEventPayment } from "@/lib/accounting";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                customer: true,
                items: { include: { product: true } },
                paymentLinks: {
                    include: { payment: { include: { paymentMethod: true } } }
                }
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const data = await request.json();
        const event = await prisma.event.findUnique({
            where: { id },
            include: { items: true, paymentLinks: { include: { payment: true } } },
        });
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const oldTotal = event.totalAmount;
        const {
            eventName,
            eventDate,
            location,
            setupFee,
            serviceFee,
            transportFee,
            status,
            items: newItems,
        } = data;

        let subtotal = event.subtotal;
        let totalAmount = event.totalAmount;

        if (Array.isArray(newItems) && newItems.length > 0) {
            subtotal = newItems.reduce((acc: number, item: any) =>
                acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                0
            ) + (Number(setupFee ?? event.setupFee) || 0) + (Number(serviceFee ?? event.serviceFee) || 0);
            totalAmount = subtotal + (Number(transportFee ?? event.transportFee) || 0);
        } else if (setupFee !== undefined || serviceFee !== undefined || transportFee !== undefined) {
            const itemsSubtotal = event.items.reduce((acc, i) => acc + i.totalPrice, 0);
            subtotal = itemsSubtotal + (Number(setupFee ?? event.setupFee) || 0) + (Number(serviceFee ?? event.serviceFee) || 0);
            totalAmount = subtotal + (Number(transportFee ?? event.transportFee) || 0);
        }

        const updated = await prisma.event.update({
            where: { id },
            data: {
                ...(eventName !== undefined && { eventName }),
                ...(eventDate !== undefined && { eventDate: new Date(eventDate) }),
                ...(location !== undefined && { location }),
                ...(setupFee !== undefined && { setupFee: parseFloat(String(setupFee)) }),
                ...(serviceFee !== undefined && { serviceFee: parseFloat(String(serviceFee)) }),
                ...(transportFee !== undefined && { transportFee: parseFloat(String(transportFee)) }),
                ...(status !== undefined && { status }),
                ...(subtotal !== event.subtotal && { subtotal }),
                ...(totalAmount !== event.totalAmount && { totalAmount }),
                ...(Array.isArray(newItems) && newItems.length > 0 && {
                    items: {
                        deleteMany: {},
                        create: newItems.map((item: any) => ({
                            productId: item.productId,
                            quantity: Number(item.quantity) || 0,
                            unitPrice: Number(item.unitPrice) || 0,
                            totalPrice: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                        })),
                    },
                }),
            },
            include: {
                customer: true,
                items: { include: { product: true } },
                paymentLinks: { include: { payment: { include: { paymentMethod: true } } } },
            },
        });

        if (Math.abs(totalAmount - oldTotal) > 0.01) {
            try {
                await postEventAmountAdjustment(id, oldTotal, totalAmount, "system");
            } catch (err) {
                console.error("Error posting event amount adjustment:", err);
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const event = await prisma.event.findUnique({
            where: { id },
            include: { paymentLinks: { include: { payment: true } } },
        });
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        try {
            await postEventReversal(id, "system");
        } catch (err) {
            console.error("Error posting event reversal:", err);
        }

        const paymentIds = event.paymentLinks.map((pl) => pl.paymentId);
        await prisma.paymentLink.deleteMany({ where: { entityType: "Event", entityId: id } });
        for (const pid of paymentIds) {
            await prisma.payment.delete({ where: { id: pid } });
        }
        await prisma.eventItem.deleteMany({ where: { eventId: id } });
        await prisma.event.delete({ where: { id } });

        return NextResponse.json({ success: true, deleted: id });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
