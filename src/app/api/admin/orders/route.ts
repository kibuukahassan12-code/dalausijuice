export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { postSale } from "@/lib/accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period"); // today, week, month, all
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let whereClause: any = {};

    if (period === "today") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        whereClause.orderDate = { gte: start };
    } else if (period === "week") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        whereClause.orderDate = { gte: start };
    } else if (period === "month") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.orderDate = { gte: start };
    } else if (startDate && endDate) {
        whereClause.orderDate = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }

    try {
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                customer: true,
                items: { include: { product: true } },
                paymentLinks: { include: { payment: true } }
            },
            orderBy: { orderDate: "desc" },
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            customerName,
            customerPhone,
            orderDate,
            orderType,
            transportFee,
            items,
            paymentMethodId,
            amountPaid,
            force // Skip duplicate check if true
        } = data;

        console.log("[Orders API] Creating order for:", customerName, customerPhone);
        console.log("[Orders API] Items:", items?.length, "items");

        // Validate required fields
        if (!customerName || !customerPhone || !items || items.length === 0) {
            console.error("[Orders API] Missing required fields");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Find or create customer
        let customer = await prisma.customer.findFirst({
            where: { phone: customerPhone },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: { name: customerName, phone: customerPhone },
            });
        }

        // 2. Calculate totals
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        const totalAmount = subtotal + parseFloat(transportFee || "0");
        console.log("[Orders API] Calculated total:", totalAmount);

        // 2b. Duplicate Check (Unless forced)
        if (!force) {
            const date = new Date(orderDate);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

            const duplicate = await prisma.order.findFirst({
                where: {
                    customerId: customer.id,
                    totalAmount: totalAmount,
                    orderDate: {
                        gte: dayStart,
                        lt: dayEnd
                    },
                    status: { not: "Cancelled" }
                }
            });

            if (duplicate) {
                console.log("[Orders API] Duplicate detected:", duplicate.id);
                return NextResponse.json({
                    error: "Duplicate detected",
                    message: `An order for UGX ${totalAmount.toLocaleString()} already exists for this customer on this date.`
                }, { status: 409 });
            }
        }

        console.log("[Orders API] Creating order for customer:", customer.id);

        // 3. Create the order with included relations
        const order = await prisma.order.create({
            data: {
                customerId: customer.id,
                orderDate: new Date(orderDate),
                orderType,
                transportFee: parseFloat(transportFee || "0"),
                subtotal,
                totalAmount,
                status: "Waiting Approval",
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                customer: true,
                items: { include: { product: true } },
                paymentLinks: { include: { payment: true } }
            }
        });

        console.log("[Orders API] Order created:", order.id);

        // 4. Create payment if any amount was paid
        const paidAmount = parseFloat(amountPaid || "0");
        if (paidAmount > 0 && paymentMethodId) {
            try {
                await prisma.payment.create({
                    data: {
                        paymentMethodId,
                        amountPaid: paidAmount,
                        paymentDate: new Date(),
                        paymentStatus: paidAmount >= totalAmount ? "Paid" : "Partial",
                        links: {
                            create: {
                                entityType: "Order",
                                entityId: order.id,
                            },
                        },
                    },
                });
                console.log("[Orders API] Payment created for order:", order.id);
            } catch (paymentError) {
                console.error("[Orders API] Payment creation error:", paymentError);
                // Don't fail the order if payment creation fails
            }
        }

        console.log("[Orders API] Order complete, returning:", order.id);
        return NextResponse.json(order);
    } catch (error: any) {
        console.error("[Orders API] Order creation error:", error?.message || error);
        return NextResponse.json({ error: "Failed to create order: " + (error?.message || "Unknown error") }, { status: 500 });
    }
}
