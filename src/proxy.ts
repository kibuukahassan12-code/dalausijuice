import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default_auth_secret_dalausi_juice_2024"
);

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect admin routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const session = request.cookies.get("session")?.value;

        if (!session) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        try {
            await jwtVerify(session, SECRET);
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
