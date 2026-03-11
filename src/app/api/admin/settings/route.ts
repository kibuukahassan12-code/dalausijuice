export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");

        if (!key) {
            return NextResponse.json({ error: "Key required" }, { status: 400 });
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key },
        });

        // Default to "OPEN" if setting not found
        return NextResponse.json({ value: setting?.value || "OPEN" });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { key, value } = await request.json();

        if (!key || !value) {
            return NextResponse.json({ error: "Key and value required" }, { status: 400 });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        return NextResponse.json(setting);
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}

