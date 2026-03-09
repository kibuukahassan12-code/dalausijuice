import { PrismaClient } from "@prisma/client";
import { postEventPayment } from "@/lib/accounting";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const eventId = params.id;
        const data = await request.json();
        const { amount, paymentMethodId, paymentDate, reference } = data;

        if (!amount || !paymentMethodId) {
            return NextResponse.json({ error: "Amount and Payment Method are required" }, { status: 400 });
        }

        // 1. Verify event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Resolve payment method code
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: paymentMethodId },
        });

        if (!paymentMethod) {
            return NextResponse.json({ error: "Payment Method not found" }, { status: 400 });
        }

        const paymentMethodCode = paymentMethod.code || "CASH";

        // 3. Create the payment record
        const payment = await prisma.payment.create({
            data: {
                paymentMethodId,
                amountPaid: parseFloat(String(amount)),
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                reference: reference || null,
                paymentStatus: "Paid", // For single payment records, usually marked as Paid
                links: {
                    create: {
                        entityType: "Event",
                        entityId: eventId,
                    },
                },
            },
        });

        // 4. Update Event status if balance is cleared
        // First get all payments for this event
        const allPayments = await prisma.paymentLink.findMany({
            where: { entityType: "Event", entityId: eventId },
            include: { payment: true },
        });

        const totalPaid = allPayments.reduce((sum, link) => sum + (link.payment?.amountPaid || 0), 0);

        if (totalPaid >= event.totalAmount) {
            await prisma.event.update({
                where: { id: eventId },
                data: { status: "Completed" }, // Or whatever status represents paid-in-full
            });
        }

        // 5. AUTOMATIC ACCOUNTING: Post event payment
        try {
            await postEventPayment(eventId, parseFloat(String(amount)), paymentMethodCode, "system-api");
        } catch (error) {
            console.error("Error posting accounting entry for event payment:", error);
            // We don't fail the request if accounting fails, but ideally we should have a retry or mark as pending
        }

        return NextResponse.json({ success: true, paymentId: payment.id });
    } catch (error) {
        console.error("Event payment creation error:", error);
        return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }
}
