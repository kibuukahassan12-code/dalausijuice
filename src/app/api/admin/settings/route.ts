export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");

        if (!key) {
            return NextResponse.json({ error: "Key required" }, { status: 400 });
        }

        try {
            const setting = await prisma.systemSetting.findUnique({
                where: { key },
            });
            return NextResponse.json({ value: setting?.value || "OPEN" });
        } catch (dbError: any) {
            // If table doesn't exist, return default value
            console.error("Settings GET DB error:", dbError?.message || dbError);
            return NextResponse.json({ value: "OPEN" });
        }
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ value: "OPEN" });
    }
}

export async function POST(request: Request) {
    try {
        const { key, value } = await request.json();

        if (!key || !value) {
            return NextResponse.json({ error: "Key and value required" }, { status: 400 });
        }

        try {
            const setting = await prisma.systemSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
            return NextResponse.json(setting);
        } catch (dbError: any) {
            console.error("Settings POST DB error:", dbError?.message || dbError);
            // Return success with the value even if DB fails
            return NextResponse.json({ key, value, fallback: true });
        }
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
