import { PrismaClient } from "@prisma/client";
import { postSale } from "@/lib/accounting";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
    try {
        const { orderId, action } = await request.json(); // action: APPROVE | CANCEL

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // 1. Fetch order and include payments
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                paymentLinks: {
                    include: {
                        payment: {
                            include: { paymentMethod: true }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (action === "APPROVE") {
            if (order.status !== "Waiting Approval") {
                return NextResponse.json({ error: "Order is already processed or approved" }, { status: 400 });
            }

            // 2. Update order status to Completed
            await prisma.order.update({
                where: { id: orderId },
                data: { status: "Completed" }
            });

            // 3. Post accounting entries for all payments
            let successCount = 0;
            for (const link of order.paymentLinks) {
                if (link.payment) {
                    try {
                        // Default to BOTTLE for daily retail orders as per system logic
                        await postSale(
                            order.id,
                            link.payment.amountPaid,
                            "BOTTLE",
                            link.payment.paymentMethod.code,
                            "admin"
                        );
                        successCount++;
                    } catch (accError) {
                        console.error(`Accounting error for order ${orderId}, payment ${link.payment.id}:`, accError);
                    }
                }
            }

            return NextResponse.json({
                message: "Order approved and accounting entries posted",
                accountingPosted: successCount > 0
            });
        } else if (action === "CANCEL") {
            const oldStatus = order.status;

            // 2. Update status to Cancelled
            await prisma.order.update({
                where: { id: orderId },
                data: { status: "Cancelled" }
            });

            // 3. If it was already Completed (Approved), we need the accounting reversal!
            if (oldStatus === "Completed") {
                // Find all ledger entries for this sale and reverse them
                const entries = await prisma.ledgerEntry.findMany({
                    where: { source_type: "SALE", source_id: orderId },
                    include: { account: true }
                });

                for (const e of entries) {
                    await prisma.ledgerEntry.create({
                        data: {
                            entry_date: new Date(),
                            account_id: e.account_id,
                            debit_amount: e.credit_amount, // Swap credit to debit
                            credit_amount: e.debit_amount, // Swap debit to credit
                            source_type: "REVERSAL",
                            source_id: orderId,
                            department: e.department,
                            description: `Reversal of sale entry #${e.id} due to order cancellation`,
                            period_id: e.period_id
                        }
                    });
                }
            }

            return NextResponse.json({ message: "Order cancelled successfully" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Order processing error:", error);
        return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
    }
}
