import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transaction_id } = body;

        if (!transaction_id) {
            return NextResponse.json(
                { error: 'Missing transaction_id' },
                { status: 400 }
            );
        }

        const authId = process.env.MONEYUNIFY_AUTH_ID;
        if (!authId) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Verify payment with MoneyUnify
        const verifyUrl = `https://api.moneyunify.one/payments/verify?auth_id=${authId}&transaction_id=${transaction_id}`;

        const response = await fetch(verifyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('MoneyUnify Verify Error:', result);
            return NextResponse.json(
                { error: result.message || 'Verification failed' },
                { status: response.status }
            );
        }

        const db = await getDb();
        const { status, amount, phone, reference } = result;

        // Check if payment record already exists to avoid duplicates
        const existingPayment = await db.get('SELECT * FROM payments WHERE transaction_id = ?', transaction_id);

        if (existingPayment) {
            return NextResponse.json({
                status: existingPayment.status,
                order_id: existingPayment.order_id,
                message: 'Payment status retrieved'
            });
        }

        if (status === 'successful') {
            // Update existing order if it exists, or create a new one
            const existingOrder = await db.get('SELECT * FROM orders WHERE id = ?', reference);

            if (existingOrder) {
                // Update order status to PAID
                await db.run(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    ['PAID', reference]
                );
            } else {
                // Create order if it doesn't exist (fallback)
                await db.run(
                    'INSERT INTO orders (id, customer_phone, total_amount, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                    [reference, phone, amount, 'PAID']
                );
            }

            // Record payment
            await db.run(
                'INSERT INTO payments (order_id, transaction_id, amount, phone, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [reference, transaction_id, amount, phone, status]
            );

            return NextResponse.json({
                status: 'successful',
                order_id: reference,
                message: 'Payment verified and order updated'
            });
        } else {
            // Record failed payment attempt as well for history
            await db.run(
                'INSERT INTO payments (order_id, transaction_id, amount, phone, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [reference || 'UNKNOWN', transaction_id, amount || 0, phone || 'UNKNOWN', status]
            );

            // Update order status to FAILED if order exists
            if (reference) {
                await db.run(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    ['FAILED', reference]
                );
            }

            return NextResponse.json({
                status: status,
                message: 'Payment verification pending or failed'
            });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
