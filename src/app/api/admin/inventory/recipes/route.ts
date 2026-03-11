export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { postSale } from "@/lib/accounting";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const recipes = await prisma.recipe.findMany({
            include: {
                product: true,
                ingredients: {
                    include: {
                        inventoryItem: true
                    }
                }
            }
        });
        return NextResponse.json(recipes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { productId, baseQuantity, ingredients } = await request.json();

        // ingredients: { inventoryItemId: string, quantity: number }[]

        const recipe = await prisma.recipe.upsert({
            where: { productId },
            create: {
                productId,
                baseQuantity: Number(baseQuantity) || 1,
                ingredients: {
                    create: ingredients.map((i: any) => ({
                        inventoryItemId: i.inventoryItemId,
                        quantity: Number(i.quantity)
                    }))
                }
            },
            update: {
                baseQuantity: Number(baseQuantity) || 1,
                ingredients: {
                    deleteMany: {},
                    create: ingredients.map((i: any) => ({
                        inventoryItemId: i.inventoryItemId,
                        quantity: Number(i.quantity)
                    }))
                }
            },
            include: {
                ingredients: true
            }
        });

        return NextResponse.json(recipe);
    } catch (error) {
        console.error("Recipe POST error:", error);
        return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
    }
}

