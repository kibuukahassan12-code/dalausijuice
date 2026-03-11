export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { postEventInvoice, postEventPayment } from "@/lib/accounting";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const events = await prisma.event.findMany({
            include: {
                customer: true,
                items: { include: { product: true } },
                paymentLinks: {
                    include: { payment: { include: { paymentMethod: true } } }
                }
            },
            orderBy: { eventDate: "asc" },
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            customerName,
            customerPhone,
            eventName,
            eventDate,
            location,
            setupFee,
            serviceFee,
            transportFee,
            items,
            paymentMethodId,
            amountPaid
        } = data;

        // 1. Find or create customer
        let customer = await prisma.customer.findFirst({
            where: { phone: customerPhone },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: { name: customerName, phone: customerPhone },
            });
        }

        // Check for duplicate event (same name, date, customer)
        const existingEvent = await prisma.event.findFirst({
            where: {
                eventName,
                eventDate: new Date(eventDate),
                customerId: customer.id,
            },
        });

        if (existingEvent) {
            return NextResponse.json(
                { error: "A similar event already exists for this customer on the specified date." },
                { status: 409 }
            );
        }

        // 2. Calculate totals
        const itemsSubtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        const subtotal = itemsSubtotal + parseFloat(setupFee || 0) + parseFloat(serviceFee || 0);
        const totalAmount = subtotal + parseFloat(transportFee || 0);

        // 3. Create the event
        const event = await prisma.event.create({
            data: {
                customerId: customer.id,
                eventName,
                eventDate: new Date(eventDate),
                location,
                setupFee: parseFloat(setupFee || 0),
                serviceFee: parseFloat(serviceFee || 0),
                transportFee: parseFloat(transportFee || 0),
                subtotal,
                totalAmount,
                status: "Upcoming",
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                    })),
                },
            },
        });

        // 4. AUTOMATIC ACCOUNTING: Post event invoice (always invoice the full amount)
        try {
            await postEventInvoice(event.id, totalAmount, "system");
        } catch (error) {
            console.error("Error posting accounting entry for event invoice:", error);
            // Don't fail event creation if accounting fails
        }

        // 5. Create payment if any amount was paid (e.g. deposit)
        let paymentMethodCode = "CASH";
        if (parseFloat(amountPaid) > 0) {
            const paymentMethod = await prisma.paymentMethod.findUnique({
                where: { id: paymentMethodId },
            });
            paymentMethodCode = paymentMethod?.code || "CASH";

            await prisma.payment.create({
                data: {
                    paymentMethodId,
                    amountPaid: parseFloat(amountPaid),
                    paymentDate: new Date(),
                    paymentStatus: amountPaid >= totalAmount ? "Paid" : "Partial",
                    links: {
                        create: {
                            entityType: "Event",
                            entityId: event.id,
                        },
                    },
                },
            });

            // AUTOMATIC ACCOUNTING: Post event payment
            try {
                await postEventPayment(event.id, parseFloat(amountPaid), paymentMethodCode, "system");
            } catch (error) {
                console.error("Error posting accounting entry for event payment:", error);
                // Don't fail event creation if accounting fails
            }
        }

        // 6. Return full event with relations (same shape as GET) so admin dashboard works for new and existing events
        const fullEvent = await prisma.event.findUnique({
            where: { id: event.id },
            include: {
                customer: true,
                items: { include: { product: true } },
                paymentLinks: {
                    include: { payment: { include: { paymentMethod: true } } },
                },
            },
        });
        return NextResponse.json(fullEvent ?? event);
    } catch (error) {
        console.error("Event creation error:", error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}

