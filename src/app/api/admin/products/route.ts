export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const menuOnly = searchParams.get("menu") === "true";
        // When menu=true: only return products with eye (showOnMenu === true). Crossed-eye are excluded.
        let products: { id: string; name: string; unitPrice: number; imageUrl?: string | null; showOnMenu?: boolean }[];
        try {
            products = await prisma.product.findMany({
                where: {
                    isActive: true,
                    ...(menuOnly ? { showOnMenu: true } : {}),
                },
                orderBy: { name: "asc" },
            });
        } catch (columnError: unknown) {
            // If showOnMenu/imageUrl columns don't exist yet (migration not run), use raw query so menu still loads
            const msg = columnError instanceof Error ? columnError.message : String(columnError);
            if (msg.includes("showOnMenu") || msg.includes("imageUrl") || msg.includes("no such column") || msg.includes("Unknown column")) {
                const raw = await prisma.$queryRaw<Array<{ id: string; name: string; unitPrice: number }>>`
                    SELECT id, name, unitPrice FROM Product WHERE isActive = 1 ORDER BY name
                `;
                products = raw.map((r) => ({ ...r, imageUrl: null, showOnMenu: true }));
            } else {
                throw columnError;
            }
        }
        // Normalize showOnMenu to boolean so admin UI eye icon state is correct (no 1/0 from SQLite)
        const normalized = products.map((p) => ({ ...p, showOnMenu: Boolean(p.showOnMenu) }));
        return NextResponse.json(normalized);
    } catch (error) {
        console.error("Products GET error:", error);
        // Return empty array instead of 500 so the daily menu can show the client-side fallback and never "Unable to load menu"
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const { name, unitPrice, costPerUnit, imageUrl, showOnMenu } = await request.json();
        const product = await prisma.product.create({
            data: {
                name,
                unitPrice: parseFloat(unitPrice),
                costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
                imageUrl: imageUrl || null,
                showOnMenu: showOnMenu !== false,
            },
        });
        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, showOnMenu, imageUrl } = body;
        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "Product id required" }, { status: 400 });
        }
        const data: { showOnMenu?: boolean; imageUrl?: string | null } = {};
        // Persist visibility: true = open eye (on menu), false = crossed eye (hidden). Explicit boolean so state stays until next click.
        if (showOnMenu !== undefined) {
            // true / "true" → show on menu (open eye). false / "false" / other → hide (crossed eye).
            data.showOnMenu = showOnMenu === true || showOnMenu === "true";
        }
        if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }
        const product = await prisma.product.update({
            where: { id },
            data,
        });
        return NextResponse.json({ ...product, showOnMenu: Boolean(product.showOnMenu) });
    } catch (error) {
        console.error("Products PATCH error:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}


