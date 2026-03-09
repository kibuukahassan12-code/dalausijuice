import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const requisitions = await prisma.purchaseRequisition.findMany({
            orderBy: { requisition_date: "desc" },
        });
        return NextResponse.json(requisitions);
    } catch (error) {
        console.error("Error fetching requisitions:", error);
        return NextResponse.json({ error: "Failed to fetch requisitions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { requisition_date, requested_by, item_name, category, quantity_requested, required_date, reason, linked_production_plan_id } = data;

        if (!requisition_date || !requested_by || !item_name || !category || !quantity_requested || !required_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const requisition = await prisma.purchaseRequisition.create({
            data: {
                requisition_date: new Date(requisition_date),
                requested_by,
                item_name,
                category,
                quantity_requested: Number(quantity_requested),
                required_date: new Date(required_date),
                reason: reason || null,
                linked_production_plan_id: linked_production_plan_id || null,
                status: "PENDING",
            },
        });

        return NextResponse.json(requisition);
    } catch (error) {
        console.error("Error creating requisition:", error);
        return NextResponse.json({ error: "Failed to create requisition" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const data = await request.json();
        const { id, status } = data;

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
        if (!validStatuses.includes(status.toUpperCase())) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const requisition = await prisma.purchaseRequisition.update({
            where: { id },
            data: { status: status.toUpperCase() },
        });

        return NextResponse.json(requisition);
    } catch (error) {
        console.error("Error updating requisition:", error);
        return NextResponse.json({ error: "Failed to update requisition" }, { status: 500 });
    }
}
