export const dynamic = "force-dynamic"
import { getDb } from '@/lib/db';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, orderType, transportFee, deliveryAddress, paymentMethod, phoneNumber, provider } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
        }

        const db = await getDb();

        // Find or create a guest customer for this phone number
        let guestCustomer = null;
        if (phoneNumber) {
            guestCustomer = await db.get('SELECT * FROM customers WHERE phone = ?', phoneNumber);

            if (!guestCustomer) {
                // Create a new guest customer
                const result = await db.run(
                    'INSERT INTO customers (name, phone) VALUES (?, ?)',
                    "Guest Customer", phoneNumber
                );
                guestCustomer = { id: result.lastID, name: "Guest Customer", phone: phoneNumber };
            }
        }

        // Calculate subtotal from items
        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of items) {
            if (!item.productId || !item.quantity) continue;

            const product = await db.get('SELECT * FROM products WHERE id = ?', item.productId);

            if (!product) continue;

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
                totalPrice: itemTotal
            });
        }

        if (orderItems.length === 0) {
            return NextResponse.json({ success: false, error: "No valid items in cart" }, { status: 400 });
        }

        const totalAmount = subtotal + (transportFee || 0);
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create order with customer reference
        await db.run(
            'INSERT INTO orders (id, customer_phone, customer_name, total_amount, status, delivery_address, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            orderId,
            phoneNumber || '',
            guestCustomer?.name || 'Guest',
            totalAmount,
            'PENDING',
            deliveryAddress || ''
        );

        // Insert order items
        for (const item of orderItems) {
            await db.run(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                orderId, item.productId, item.quantity, item.unitPrice, item.totalPrice
            );
        }

        return NextResponse.json({
            success: true,
            order: {
                id: orderId,
                orderNumber: orderId,
                orderDate: new Date().toISOString(),
                totalAmount: totalAmount,
                subtotal: subtotal,
                transportFee: transportFee || 0,
                status: "PENDING",
                items: orderItems
            },
            payment: {
                method: paymentMethod || "mobile_money",
                status: "pending" as const,
                phoneNumber: phoneNumber,
                provider: provider,
                message: "Order created, awaiting payment verification"
            }
        });

    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process order",
            details: String(error)
        }, { status: 500 });
    }
}
