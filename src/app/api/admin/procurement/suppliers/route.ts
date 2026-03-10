import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { created_at: "desc" },
        });
        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { name, supplier_type, contact_person, phone, email, payment_terms, default_unit_price, status } = data;

        if (!name || !supplier_type || !contact_person || !phone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if supplier name already exists
        const existing = await prisma.supplier.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json({ error: "Supplier with this name already exists" }, { status: 400 });
        }

        const supplier = await prisma.supplier.create({
            data: {
                name,
                supplier_type: supplier_type.toUpperCase(),
                contact_person,
                phone,
                email: email || null,
                payment_terms: payment_terms || "",
                default_unit_price: default_unit_price ? Number(default_unit_price) : null,
                status: status?.toUpperCase() || "ACTIVE",
            },
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    }
}

