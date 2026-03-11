export const dynamic = "force-dynamic"
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "dalausi-juice-secret-key-2026"
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json(
                { error: "Phone and password are required" },
                { status: 400 }
            );
        }

        // Find customer
        const customer = await prisma.customer.findFirst({
            where: { phone },
            include: {
                orders: {
                    where: { status: { not: "Cancelled" } },
                    select: { totalAmount: true }
                }
            }
        });

        if (!customer || !customer.passwordHash) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, customer.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Calculate lifetime spend and update loyalty tier
        const lifetimeSpend = customer.orders.reduce((sum, o) => sum + o.totalAmount, 0);

        let newTier = "REGULAR";
        if (lifetimeSpend >= 2000000) newTier = "PLATINUM";
        else if (lifetimeSpend >= 1000000) newTier = "GOLD";
        else if (lifetimeSpend >= 500000) newTier = "VIP";

        // Update tier if changed
        if (newTier !== customer.loyaltyTier) {
            await prisma.customer.update({
                where: { id: customer.id },
                data: { loyaltyTier: newTier }
            });
        }

        // Generate JWT token
        const token = await new SignJWT({
            customerId: customer.id,
            phone: customer.phone,
            tier: newTier
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("30d")
            .sign(JWT_SECRET);

        const response = NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                loyaltyTier: newTier,
                loyaltyPoints: customer.loyaltyPoints || 0,
                lifetimeSpend
            }
        });

        // Set HTTP-only cookie
        response.cookies.set("customer_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 // 30 days
        });

        return response;

    } catch (error) {
        console.error("Customer Login Error:", error);
        return NextResponse.json(
            { error: "Failed to login" },
            { status: 500 }
        );
    }
}
