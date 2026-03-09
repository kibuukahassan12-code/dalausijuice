import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Customer Registration
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, password } = body;

        // Validate required fields
        if (!name || !phone || !password) {
            return NextResponse.json(
                { error: "Name, phone, and password are required" },
                { status: 400 }
            );
        }

        // Check if customer already exists
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { phone },
                    email ? { email } : { phone: "IMPOSSIBLE_MATCH" }
                ]
            }
        });

        if (existingCustomer) {
            return NextResponse.json(
                { error: "Customer with this phone or email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer with auth credentials
        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                email: email || null,
                passwordHash: hashedPassword,
                loyaltyPoints: 0,
                loyaltyTier: "REGULAR"
            }
        });

        return NextResponse.json({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            loyaltyTier: customer.loyaltyTier,
            loyaltyPoints: customer.loyaltyPoints
        });

    } catch (error) {
        console.error("Customer Registration Error:", error);
        return NextResponse.json(
            { error: "Failed to register customer" },
            { status: 500 }
        );
    }
}
