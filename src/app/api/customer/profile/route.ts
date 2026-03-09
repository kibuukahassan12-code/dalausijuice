import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "dalausi-juice-secret-key-2026"
);

export async function GET(request: Request) {
    try {
        const token = request.headers.get("cookie")?.split("customer_token=")[1]?.split(";")[0];

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const customerId = payload.customerId as string;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                orders: {
                    orderBy: { orderDate: "desc" },
                    take: 10,
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Calculate loyalty stats
        const completedOrders = customer.orders.filter(o => o.status === "Completed");
        const lifetimeSpend = customer.orders
            .filter(o => o.status !== "Cancelled")
            .reduce((sum, o) => sum + o.totalAmount, 0);

        // Tier benefits
        const tierBenefits = {
            REGULAR: { discount: 0, pointsMultiplier: 1, perks: ["Standard delivery"] },
            VIP: { discount: 5, pointsMultiplier: 1.5, perks: ["5% discount", "Priority support", "Birthday gift"] },
            GOLD: { discount: 10, pointsMultiplier: 2, perks: ["10% discount", "Free delivery", "Exclusive flavors", "Event invites"] },
            PLATINUM: { discount: 15, pointsMultiplier: 3, perks: ["15% discount", "VIP concierge", "Custom blends", "First access to new products"] }
        };

        const currentTierBenefits = tierBenefits[customer.loyaltyTier as keyof typeof tierBenefits] || tierBenefits.REGULAR;

        // Next tier progress
        const tierThresholds = { REGULAR: 0, VIP: 500000, GOLD: 1000000, PLATINUM: 2000000 };
        const currentThreshold = tierThresholds[customer.loyaltyTier as keyof typeof tierThresholds];
        const nextTier = customer.loyaltyTier === "PLATINUM" ? null :
            customer.loyaltyTier === "GOLD" ? "PLATINUM" :
                customer.loyaltyTier === "VIP" ? "GOLD" : "VIP";
        const nextThreshold = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : 0;
        const progressToNext = nextTier ? ((lifetimeSpend - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;

        return NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                loyaltyTier: customer.loyaltyTier,
                loyaltyPoints: customer.loyaltyPoints,
                referralCode: customer.referralCode,
                memberSince: customer.createdAt
            },
            stats: {
                lifetimeSpend,
                totalOrders: customer.orders.length,
                completedOrders: completedOrders.length,
                pendingOrders: customer.orders.filter(o => o.status === "Pending").length
            },
            loyalty: {
                tier: customer.loyaltyTier,
                points: customer.loyaltyPoints,
                benefits: currentTierBenefits,
                nextTier,
                progressToNext: Math.min(progressToNext, 100),
                spendToNextTier: nextTier ? Math.max(0, nextThreshold - lifetimeSpend) : 0
            },
            recentOrders: customer.orders.slice(0, 5).map(o => ({
                id: o.id,
                orderDate: o.orderDate,
                totalAmount: o.totalAmount,
                status: o.status,
                itemCount: o.items.length,
                items: o.items.map(i => ({
                    product: i.product.name,
                    quantity: i.quantity,
                    price: i.totalPrice
                }))
            }))
        });

    } catch (error) {
        console.error("Customer Profile Error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
