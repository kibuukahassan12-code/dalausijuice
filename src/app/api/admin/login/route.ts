import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        
        console.log("[LOGIN API] Attempt for user:", username);

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.log("[LOGIN API] User not found:", username);
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }
        
        console.log("[LOGIN API] User found:", user.username, "ID:", user.id);
        
        const passwordValid = await verifyPassword(password, user.password);
        console.log("[LOGIN API] Password valid:", passwordValid);

        if (!passwordValid) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Create session
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const session = await encrypt({ id: user.id, username: user.username, expiresAt });

        const cookieStore = await cookies();
        cookieStore.set("session", session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            expires: expiresAt,
            sameSite: "lax",
            path: "/",
        });

        console.log("[LOGIN API] Success:", username);
        return NextResponse.json({ success: true, user: { name: user.name, username: user.username } });
    } catch (error) {
        console.error("[LOGIN API] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

