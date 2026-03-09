import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true, showOnMenu: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
