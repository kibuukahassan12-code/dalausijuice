export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server';
import { URL } from 'url';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, amount, orderId } = body;

        if (!phone || !amount || !orderId) {
            return NextResponse.json(
                { error: 'Missing required fields: phone, amount, orderId' },
                { status: 400 }
            );
        }

        const authId = process.env.MONEYUNIFY_AUTH_ID;
        if (!authId) {
            console.error('MoneyUnify Auth ID is missing');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Construct the payment request
        const paymentUrl = 'https://api.moneyunify.one/payments/request';

        // We use URLSearchParams to encode the body as x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('auth_id', authId);
        params.append('phone', phone);
        params.append('amount', amount.toString());
        params.append('reference', orderId);

        const response = await fetch(paymentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('MoneyUnify API Error:', responseData);
            return NextResponse.json(
                { error: responseData.message || 'Payment initiation failed' },
                { status: response.status }
            );
        }

        // MoneyUnify returns transaction_id on success
        return NextResponse.json({
            transaction_id: responseData.transaction_id,
            status: 'initiated',
            message: 'Payment initiated successfully. Please approve on your phone.'
        });

    } catch (error) {
        console.error('Payment initiation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
