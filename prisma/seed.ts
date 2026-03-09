import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
    postGRNAcceptance,
    postSupplierPayment,
    postProductionQCApproval,
    postWastage,
    postSale,
    postEventInvoice,
    postEventPayment,
    postOperatingExpense,
} from "../src/lib/accounting";

const prisma = new PrismaClient();

async function safeAccounting<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
    try {
        return await fn();
    } catch (e) {
        console.warn(`[Accounting] ${label} skipped:`, (e as Error).message);
        return null;
    }
}

async function main() {
    // 1. Initial Admin User (standard User table from previous session)
    const adminPassword = "DalausiAdmin2024!";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: hashedPassword,
            name: "Dalausi Administrator",
        },
    });

    // 2. New AdminUser for the expanded system
    await prisma.adminUser.upsert({
        where: { email: "admin@dalausijuice.com" },
        update: {},
        create: {
            name: "Dalausi Admin",
            email: "admin@dalausijuice.com",
            passwordHash: hashedPassword,
            role: "Admin",
        },
    });

    // 3. Payment Methods
    const paymentMethods = [
        { code: "CASH", name: "Cash", category: "cash" },
        { code: "MTN", name: "MTN Mobile Money", category: "mobile_money" },
        { code: "AIRTEL", name: "Airtel Money", category: "mobile_money" },
        { code: "AFRICELL", name: "Africell Money", category: "mobile_money" },
        { code: "BANK", name: "Bank Transfer", category: "bank" },
        { code: "VISA", name: "Visa Card", category: "card" },
        { code: "MC", name: "Mastercard", category: "card" },
        { code: "AMEX", name: "American Express", category: "card" },
        { code: "PESAPAL", name: "Pesapal", category: "gateway" },
        { code: "FLUTTERWAVE", name: "Flutterwave", category: "gateway" },
        { code: "OTHER", name: "Other (Manual)", category: "other" },
    ];

    for (const pm of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: { code: pm.code },
            update: { name: pm.name, category: pm.category },
            create: pm,
        });
    }

    // 4. Products (Juice Flavors)
    const products = [
        "Mango cocktail", "Mango", "Coconut cocktail", "Avocado mix",
        "Milk meld", "Orange", "Citrus combo", "Sugarcane and ginger",
        "Guava", "Beetroot cocktail", "Mulondo coffee mix", "Passion",
        "Mango passion", "Passion cocktail", "Pineapple and mint",
        "Soursop", "Watermelon"
    ];

    for (const productName of products) {
        await prisma.product.upsert({
            where: { name: productName },
            update: { unitPrice: 10000 },
            create: {
                name: productName,
                unitPrice: 10000,
                costPerUnit: 4000, // Estimated cost for margin calculations
            },
        });
    }

    // 5. Chart of Accounts - Juice-manufacturing-specific (audit-ready, source-driven)
    // Spec: Cash, Bank, Mobile Money, AR, RM Inventory, Packaging Inventory, FG Inventory,
    // AP, Bottle/Jerrycan/Event Revenue, COGS (Fruit, Packaging, Labor, Utilities),
    // Wastage Expense, Operating Expenses
    const chartOfAccounts = [
        // ASSETS
        { account_code: "1000", account_name: "Cash", account_type: "ASSET", parent_account_id: null },
        { account_code: "1010", account_name: "Bank", account_type: "ASSET", parent_account_id: null },
        { account_code: "1020", account_name: "Mobile Money", account_type: "ASSET", parent_account_id: null },
        { account_code: "1100", account_name: "Accounts Receivable", account_type: "ASSET", parent_account_id: null },
        { account_code: "1200", account_name: "Raw Materials Inventory", account_type: "ASSET", parent_account_id: null },
        { account_code: "1210", account_name: "Packaging Inventory", account_type: "ASSET", parent_account_id: null },
        { account_code: "1220", account_name: "Finished Goods Inventory", account_type: "ASSET", parent_account_id: null },
        { account_code: "1500", account_name: "Production Clearing", account_type: "ASSET", parent_account_id: null },
        // LIABILITIES
        { account_code: "2000", account_name: "Accounts Payable", account_type: "LIABILITY", parent_account_id: null },
        // EQUITY
        { account_code: "3000", account_name: "Owner's Capital", account_type: "EQUITY", parent_account_id: null },
        { account_code: "3100", account_name: "Retained Earnings", account_type: "EQUITY", parent_account_id: null },
        // REVENUE
        { account_code: "4000", account_name: "Bottle Sales Revenue", account_type: "REVENUE", parent_account_id: null },
        { account_code: "4010", account_name: "Jerrycan Sales Revenue", account_type: "REVENUE", parent_account_id: null },
        { account_code: "4100", account_name: "Event Catering Revenue", account_type: "REVENUE", parent_account_id: null },
        { account_code: "4200", account_name: "Miscellaneous Income", account_type: "REVENUE", parent_account_id: null },
        // COGS
        { account_code: "5000", account_name: "COGS – Fruit", account_type: "COGS", parent_account_id: null },
        { account_code: "5010", account_name: "COGS – Packaging", account_type: "COGS", parent_account_id: null },
        { account_code: "5020", account_name: "COGS – Labor", account_type: "COGS", parent_account_id: null },
        { account_code: "5030", account_name: "COGS – Utilities", account_type: "COGS", parent_account_id: null },
        // EXPENSES
        { account_code: "6000", account_name: "Wastage Expense", account_type: "EXPENSE", parent_account_id: null },
        { account_code: "6500", account_name: "Operating Expenses", account_type: "EXPENSE", parent_account_id: null },
        { account_code: "6600", account_name: "Staff Salaries", account_type: "EXPENSE", parent_account_id: null },
    ];

    for (const account of chartOfAccounts) {
        await prisma.chartOfAccount.upsert({
            where: { account_code: account.account_code },
            update: {
                account_name: account.account_name,
                account_type: account.account_type,
                active: true,
            },
            create: {
                ...account,
                active: true,
            },
        });
    }

    // 6. Accounting periods for current year (OPEN by default)
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let m = 1; m <= 12; m++) {
        const periodMonth = `${currentYear}-${m.toString().padStart(2, "0")}`;
        const startDate = new Date(currentYear, m - 1, 1);
        const endDate = new Date(currentYear, m, 0, 23, 59, 59);
        await prisma.accountingPeriod.upsert({
            where: { period_month: periodMonth },
            update: {},
            create: {
                period_month: periodMonth,
                start_date: startDate,
                end_date: endDate,
                status: "OPEN",
            },
        });
    }

    // 7. Sample data – reflects across all modules (skip if already seeded)
    const existingPo = await prisma.purchaseOrder.findFirst({ where: { po_number: { contains: "PO-" } } });
    if (existingPo) {
        console.log("Sample data already exists, skipping.");
    } else {
    const cashPm = await prisma.paymentMethod.findFirst({ where: { code: "CASH" } });
    const bankPm = await prisma.paymentMethod.findFirst({ where: { code: "BANK" } });
    const mtnPm = await prisma.paymentMethod.findFirst({ where: { code: "MTN" } });
    if (!cashPm) throw new Error("CASH payment method not found. Ensure base seed ran.");
    const paymentMethodId = cashPm.id;
    const bankPmId = bankPm?.id ?? cashPm.id;
    const mtnPmId = mtnPm?.id ?? cashPm.id;

    // Customers
    const customers = [
        { name: "Kampala Central Hotel", phone: "+256700111222", email: "orders@kampalacentral.ug" },
        { name: "Nakasero Market Stall", phone: "+256700333444", email: null },
        { name: "Corporate Events Uganda", phone: "+256700555666", email: "events@corpuganda.ug" },
        { name: "Garden City Mall Kiosk", phone: "+256700777888", email: null },
        { name: "Jinja Road Restaurant", phone: "+256700999000", email: "supply@jinjafood.ug" },
    ];
    const createdCustomers: { id: string; name: string; phone: string }[] = [];
    for (const c of customers) {
        let cust = await prisma.customer.findFirst({ where: { phone: c.phone } });
        if (!cust) {
            cust = await prisma.customer.create({
                data: { name: c.name, phone: c.phone, email: c.email ?? undefined },
            });
        }
        createdCustomers.push(cust);
    }

    // Suppliers
    const suppliers = [
        { name: "Kawanda Fruits Ltd", supplier_type: "FRUIT", contact_person: "John Mukasa", phone: "+256701111111", payment_terms: "Net 7", default_unit_price: 3000 },
        { name: "Uganda Packaging Co", supplier_type: "PACKAGING", contact_person: "Sarah Nabukenya", phone: "+256702222222", payment_terms: "Net 14", default_unit_price: 800 },
        { name: "Ntinda Produce Market", supplier_type: "FRUIT", contact_person: "David Ssebunya", phone: "+256703333333", payment_terms: "COD", default_unit_price: 2500 },
    ];
    const createdSuppliers: { id: string; name: string }[] = [];
    for (const s of suppliers) {
        const sup = await prisma.supplier.upsert({
            where: { name: s.name },
            update: {},
            create: { ...s, status: "ACTIVE" },
        });
        createdSuppliers.push(sup);
    }

    const mangoProd = await prisma.product.findFirst({ where: { name: "Mango" } });
    const orangeProd = await prisma.product.findFirst({ where: { name: "Orange" } });
    const passionProd = await prisma.product.findFirst({ where: { name: "Passion" } });
    const productIds = { mango: mangoProd?.id ?? "", orange: orangeProd?.id ?? "", passion: passionProd?.id ?? "" };

    // Purchase Orders + GRN + Supplier Payment (Procurement)
    const fruitSupplier = createdSuppliers.find(s => s.name.includes("Kawanda")) ?? createdSuppliers[0];
    const packSupplier = createdSuppliers.find(s => s.name.includes("Packaging")) ?? createdSuppliers[1];
    const po1 = await prisma.purchaseOrder.create({
        data: {
            po_number: `PO-${currentYear}-001`,
            supplier_id: fruitSupplier.id,
            order_date: new Date(currentYear, 0, 5),
            expected_delivery_date: new Date(currentYear, 0, 12),
            approved_by: "admin",
            total_value_ugx: 450000,
            status: "RECEIVED",
            items: {
                create: [
                    { item_name: "Mangoes", quantity_ordered: 100, unit_price_ugx: 3000, total_price_ugx: 300000 },
                    { item_name: "Oranges", quantity_ordered: 50, unit_price_ugx: 3000, total_price_ugx: 150000 },
                ],
            },
        },
    });
    const grn1 = await prisma.goodsReceipt.create({
        data: {
            po_id: po1.id,
            received_date: new Date(currentYear, 0, 12),
            received_by: "admin",
            status: "ACCEPTED",
            items: {
                create: [
                    { item_name: "Mangoes", quantity_received: 100, accepted: true },
                    { item_name: "Oranges", quantity_received: 50, accepted: true },
                ],
            },
        },
    });
    await safeAccounting(() => postGRNAcceptance(grn1.id, po1.id, [
        { item_name: "Mangoes", quantity: 100, unit_price: 3000 },
        { item_name: "Oranges", quantity: 50, unit_price: 3000 },
    ], "seed"), "GRN acceptance");

    const sp1 = await prisma.supplierPayment.create({
        data: {
            supplier_id: fruitSupplier.id,
            po_id: po1.id,
            payment_date: new Date(currentYear, 0, 15),
            amount_ugx: 200000,
            payment_method: "BANK",
            status: "PARTIAL",
        },
    });
    await safeAccounting(() => postSupplierPayment(sp1.id, 200000, "BANK", "seed"), "Supplier payment");

    const po2 = await prisma.purchaseOrder.create({
        data: {
            po_number: `PO-${currentYear}-002`,
            supplier_id: packSupplier.id,
            order_date: new Date(currentYear, 0, 10),
            expected_delivery_date: new Date(currentYear, 0, 17),
            approved_by: "admin",
            total_value_ugx: 160000,
            status: "RECEIVED",
            items: {
                create: [
                    { item_name: "Plastic Bottles 1L", quantity_ordered: 200, unit_price_ugx: 800, total_price_ugx: 160000 },
                ],
            },
        },
    });
    const grn2 = await prisma.goodsReceipt.create({
        data: {
            po_id: po2.id,
            received_date: new Date(currentYear, 0, 17),
            received_by: "admin",
            status: "ACCEPTED",
            items: {
                create: [{ item_name: "Plastic Bottles 1L", quantity_received: 200, accepted: true }],
            },
        },
    });
    await safeAccounting(() => postGRNAcceptance(grn2.id, po2.id, [
        { item_name: "Plastic Bottles 1L", quantity: 200, unit_price: 800 },
    ], "seed"), "GRN acceptance");

    // Events (Sales/Events)
    const event1 = await prisma.event.create({
        data: {
            customerId: createdCustomers[2].id,
            eventName: "Corporate Gala 2025",
            eventDate: new Date(currentYear, 1, 15),
            location: "Speke Resort Munyonyo",
            setupFee: 50000,
            serviceFee: 100000,
            transportFee: 30000,
            subtotal: 450000,
            totalAmount: 480000,
            status: "Completed",
            client_name: "Corporate Events Uganda",
            ordered_liters: 150,
            jerrycans_required: 15,
            total_value_ugx: 480000,
            production_status: "DELIVERED",
            items: {
                create: [
                    { productId: productIds.mango, quantity: 25, unitPrice: 10000, totalPrice: 250000 },
                    { productId: productIds.passion, quantity: 20, unitPrice: 10000, totalPrice: 200000 },
                ],
            },
        },
    });
    await safeAccounting(() => postEventInvoice(event1.id, 480000, "seed"), "Event invoice");
    await prisma.payment.create({
        data: {
            paymentMethodId: bankPmId,
            amountPaid: 480000,
            paymentStatus: "Paid",
            links: { create: { entityType: "Event", entityId: event1.id } },
        },
    });
    await safeAccounting(() => postEventPayment(event1.id, 480000, "BANK", "seed"), "Event payment");

    // Production Plans + Batches + QC + Packaging + Wastage
    const plan1 = await prisma.productionPlan.create({
        data: {
            plan_date: new Date(currentYear, 1, 10),
            juice_type: "Mango",
            target_liters: 100,
            production_type: "DAILY",
            expected_revenue_ugx: 1000000,
            created_by: "admin",
        },
    });
    const batch1 = await prisma.productionBatch.create({
        data: {
            batch_code: `B-${currentYear}-001`,
            plan_id: plan1.id,
            juice_type: "Mango",
            start_time: new Date(currentYear, 1, 10, 8, 0),
            end_time: new Date(currentYear, 1, 10, 14, 0),
            output_liters: 95,
            wastage_liters: 5,
            yield_percentage: 95,
            batch_value_ugx: 950000,
            status: "APPROVED",
            raw_materials: {
                create: [
                    { material_name: "Mangoes", quantity_used: 80, unit: "kg", cost_ugx: 240000 },
                    { material_name: "Sugar", quantity_used: 5, unit: "kg", cost_ugx: 25000 },
                ],
            },
        },
    });
    await prisma.qualityCheck.create({
        data: {
            batch_id: batch1.id,
            temperature_ok: true,
            hygiene_ok: true,
            taste_ok: true,
            status: "APPROVED",
            checked_by: "admin",
        },
    });
    await safeAccounting(() => postProductionQCApproval(batch1.id, 95, "seed"), "Production QC approval");
    await safeAccounting(() => postWastage(batch1.id, 5, "seed"), "Wastage");
    await prisma.packagingRecord.create({
        data: {
            batch_id: batch1.id,
            package_type: "BOTTLE",
            package_size_liters: 1,
            quantity: 90,
            total_liters: 90,
            total_value_ugx: 900000,
        },
    });
    await prisma.finishedGoodsInventory.createMany({
        data: [
            { batch_id: batch1.id, storage_type: "BOTTLE", quantity: 90, liters: 90, available: true },
        ],
    });

    // Orders (Sales)
    const order1 = await prisma.order.create({
        data: {
            customerId: createdCustomers[0].id,
            orderDate: new Date(currentYear, 1, 5),
            orderType: "delivery",
            transportFee: 5000,
            subtotal: 50000,
            totalAmount: 55000,
            status: "Completed",
            items: {
                create: [
                    { productId: productIds.mango, quantity: 3, unitPrice: 10000, totalPrice: 30000 },
                    { productId: productIds.orange, quantity: 2, unitPrice: 10000, totalPrice: 20000 },
                ],
            },
        },
    });
    await prisma.payment.create({
        data: {
            paymentMethodId,
            amountPaid: 55000,
            paymentStatus: "Paid",
            links: { create: { entityType: "Order", entityId: order1.id } },
        },
    });
    await safeAccounting(() => postSale(order1.id, 55000, "BOTTLE", "CASH", "seed"), "Sale");

    const order2 = await prisma.order.create({
        data: {
            customerId: createdCustomers[1].id,
            orderDate: new Date(currentYear, 1, 8),
            orderType: "pickup",
            transportFee: 0,
            subtotal: 100000,
            totalAmount: 100000,
            status: "Completed",
            items: {
                create: [
                    { productId: productIds.passion, quantity: 10, unitPrice: 10000, totalPrice: 100000 },
                ],
            },
        },
    });
    await prisma.payment.create({
        data: {
            paymentMethodId: mtnPmId,
            amountPaid: 100000,
            paymentStatus: "Paid",
            links: { create: { entityType: "Order", entityId: order2.id } },
        },
    });
    await safeAccounting(() => postSale(order2.id, 100000, "BOTTLE", "MTN", "seed"), "Sale");

    // Expenses
    const exp1 = await prisma.expense.create({
        data: {
            category: "utilities",
            description: "Monthly electricity bill",
            amount: 150000,
            expenseDate: new Date(currentYear, 1, 1),
            paymentMethodId: bankPmId,
        },
    });
    await safeAccounting(() => postOperatingExpense(exp1.id, 150000, "BANK", "utilities", "Monthly electricity bill", "seed"), "Expense");

    const exp2 = await prisma.expense.create({
        data: {
            category: "transport",
            description: "Delivery fuel",
            amount: 45000,
            expenseDate: new Date(currentYear, 1, 5),
            paymentMethodId,
        },
    });
    await safeAccounting(() => postOperatingExpense(exp2.id, 45000, "CASH", "transport", "Delivery fuel", "seed"), "Expense");

    // Inventory Items
    for (const inv of [
        { name: "Mangoes", category: "Fruit", unit: "kg", currentStock: 100, unitCost: 3000 },
        { name: "Oranges", category: "Fruit", unit: "kg", currentStock: 50, unitCost: 3000 },
        { name: "Plastic Bottles 1L", category: "Packaging", unit: "pieces", currentStock: 200, unitCost: 800 },
    ]) {
        const existing = await prisma.inventoryItem.findFirst({ where: { name: inv.name } });
        if (existing) {
            await prisma.inventoryItem.update({
                where: { id: existing.id },
                data: { currentStock: inv.currentStock, unitCost: inv.unitCost, lastRestocked: new Date() },
            });
        } else {
            await prisma.inventoryItem.create({
                data: { ...inv, lastRestocked: new Date() },
            });
        }
    }

    // Purchase Requisitions
    await prisma.purchaseRequisition.create({
        data: {
            requisition_date: new Date(currentYear, 1, 1),
            requested_by: "Production Manager",
            item_name: "Passion Fruit",
            category: "Fruit",
            quantity_requested: 50,
            required_date: new Date(currentYear, 1, 10),
            reason: "Event catering order",
            status: "APPROVED",
        },
    });

    console.log("Sample data added successfully.");
    }

    // 8. HR module seed
    try {
        const { seedHR } = await import("./seed/hr");
        await seedHR();
    } catch (e) {
        console.warn("HR seed skipped (HR tables may not exist yet):", (e as Error).message);
    }

    console.log("Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
