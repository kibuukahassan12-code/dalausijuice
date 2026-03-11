export const dynamic = "force-dynamic"
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Name, email, and message are required" },
                { status: 400 }
            );
        }

        // TODO: Integrate with email service (e.g. Resend, SendGrid, Nodemailer)
        // For now, log the contact for development
        console.log("Contact form submission:", { name, email, phone, message });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
