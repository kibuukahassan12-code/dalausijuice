export const dynamic = "force-dynamic"
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name) || ".png";
        const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const fileName = `${baseName}${ext}`;
        const dir = path.join(process.cwd(), "public", "images", "products");
        await mkdir(dir, { recursive: true });
        const filePath = path.join(dir, fileName);
        await writeFile(filePath, buffer);
        const imageUrl = `/images/products/${fileName}`;
        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
