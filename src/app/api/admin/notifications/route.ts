export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const [
            inventory,
            pendingOrders,
            upcomingBirthdays
        ] = await Promise.all([
            prisma.inventoryItem.findMany({
                where: { isActive: true },
                select: { name: true, currentStock: true, lowStockThreshold: true }
            }),
            prisma.order.findMany({
                where: { status: "Pending", createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } }, // > 2 hours old
                select: { id: true, totalAmount: true }
            }),
            prisma.employee.findMany({
                where: { status: "ACTIVE" },
                select: { name: true, dateOfBirth: true }
            })
        ]);

        const notifications = [];

        // 1. Stock ALerts
        inventory.forEach(item => {
            if (item.currentStock <= (item.lowStockThreshold || 10)) {
                notifications.push({
                    type: 'alert',
                    title: 'Low Stock',
                    message: `${item.name} is at critical level (${item.currentStock}).`,
                    path: '/admin/inventory'
                });
            }
        });

        // 2. Stale Orders
        if (pendingOrders.length > 0) {
            notifications.push({
                type: 'warning',
                title: 'Stale Orders',
                message: `You have ${pendingOrders.length} pending orders waiting for approval over 2 hours.`,
                path: '/admin/orders'
            });
        }

        // 3. Birthdays
        const today = new Date();
        upcomingBirthdays.forEach(emp => {
            if (emp.dateOfBirth) {
                const dob = new Date(emp.dateOfBirth);
                if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
                    notifications.push({
                        type: 'info',
                        title: 'Team Celebration',
                        message: `Today is ${emp.name}'s birthday! Wish them well.`,
                        path: '/admin/hr'
                    });
                }
            }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("[NOTIFICATIONS API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch notifications", details: String(error) }, { status: 500 });
    }
}

