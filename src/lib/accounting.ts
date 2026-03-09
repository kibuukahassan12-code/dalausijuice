import { prisma } from "./db";

/** Ledger: no deletes; every entry must reference a source (source_type + source_id). */

export async function getAccountByCode(accountCode: string) {
    const account = await prisma.chartOfAccount.findFirst({
        where: { account_code: accountCode, active: true },
    });
    return account;
}

export async function getOrCreatePeriod(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const periodMonth = `${year}-${month}`;
    const startDate = new Date(year, date.getMonth(), 1);
    const endDate = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

    const period = await prisma.accountingPeriod.upsert({
        where: { period_month: periodMonth },
        update: {},
        create: {
            period_month: periodMonth,
            start_date: startDate,
            end_date: endDate,
            status: "OPEN",
        },
    });
    return period.id;
}

/** Block all writes into CLOSED periods. */
export async function assertPeriodOpen(entryDate: Date) {
    const periodId = await getOrCreatePeriod(entryDate);
    const period = await prisma.accountingPeriod.findUnique({
        where: { id: periodId },
    });
    if (period?.status === "CLOSED") {
        throw new Error(`Cannot post to closed period ${period.period_month}`);
    }
    return periodId;
}

export type CreateLedgerEntryParams = {
    entry_date: Date;
    account_code: string;
    debit_amount: number;
    credit_amount: number;
    source_type: string;
    source_id: string;
    department: string;
    description: string;
};

/** Create a single ledger entry. Enforces: period open, source required, no deletes. */
export async function createLedgerEntry(params: CreateLedgerEntryParams) {
    if (!params.source_type?.trim() || !params.source_id?.trim()) {
        throw new Error("All entries must reference a source (source_type and source_id required)");
    }
    const account = await getAccountByCode(params.account_code);
    if (!account) {
        throw new Error(`Account ${params.account_code} not found`);
    }
    const periodId = await assertPeriodOpen(params.entry_date);

    return prisma.ledgerEntry.create({
        data: {
            entry_date: params.entry_date,
            account_id: account.id,
            debit_amount: params.debit_amount,
            credit_amount: params.credit_amount,
            source_type: params.source_type,
            source_id: params.source_id,
            department: params.department,
            description: params.description,
            period_id: periodId,
        },
    });
}

// —— Automatic posting engine (source-driven; no manual entries for operational data) ——

/** Procurement: GRN acceptance → Debit Inventory, Credit AP */
export async function postGRNAcceptance(
    grnId: string,
    poId: string,
    items: Array<{ item_name: string; quantity: number; unit_price: number }>,
    createdBy: string
) {
    const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const isPackaging = items.some(
        (item) =>
            /bottle|jerrycan|packaging|caps|labels/i.test(item.item_name)
    );
    const rawAccount = await getAccountByCode("1200");
    const packAccount = await getAccountByCode("1210");
    const apAccount = await getAccountByCode("2000");
    if (!rawAccount || !packAccount || !apAccount) throw new Error("Chart of accounts not found (1200/1210/2000)");

    const inventoryAccount = isPackaging ? packAccount : rawAccount;
    const desc = `GRN ${grnId} – ${items.map((i) => i.item_name).join(", ")}`;
    const date = new Date();

    await createLedgerEntry({
        entry_date: date,
        account_code: inventoryAccount.account_code,
        debit_amount: totalCost,
        credit_amount: 0,
        source_type: "GRN",
        source_id: grnId,
        department: "PROCUREMENT",
        description: desc,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: apAccount.account_code,
        debit_amount: 0,
        credit_amount: totalCost,
        source_type: "GRN",
        source_id: grnId,
        department: "PROCUREMENT",
        description: desc,
    });
}

/** Procurement: Supplier payment → Debit AP, Credit Cash/Bank/Mobile Money */
export async function postSupplierPayment(
    paymentId: string,
    amount: number,
    paymentMethod: string,
    _createdBy: string
) {
    const apAccount = await getAccountByCode("2000");
    if (!apAccount) throw new Error("Accounts Payable (2000) not found");

    const method = paymentMethod.toUpperCase();
    let cashCode = "1000"; // Cash
    if (method === "BANK" || method === "BANK TRANSFER") cashCode = "1010";
    else if (["MTN", "AIRTEL", "AFRICELL", "MOBILE_MONEY"].some((m) => method.includes(m))) cashCode = "1020";

    const cashAccount = await getAccountByCode(cashCode);
    if (!cashAccount) throw new Error(`Payment account ${cashCode} not found`);

    const date = new Date();
    await createLedgerEntry({
        entry_date: date,
        account_code: apAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "PAYMENT",
        source_id: paymentId,
        department: "PROCUREMENT",
        description: `Supplier payment – ${paymentMethod}`,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: cashAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "PAYMENT",
        source_id: paymentId,
        department: "PROCUREMENT",
        description: `Supplier payment – ${paymentMethod}`,
    });
}

/** Production: QC approval → Debit Finished Goods, Credit Production Clearing */
export async function postProductionQCApproval(
    batchId: string,
    outputLiters: number,
    _createdBy: string
) {
    const fgAccount = await getAccountByCode("1220");
    const clearingAccount = await getAccountByCode("1500");
    if (!fgAccount || !clearingAccount) throw new Error("Accounts 1220/1500 not found");
    const amount = outputLiters * 10000; // base value per liter
    const date = new Date();
    const desc = `Production QC – ${outputLiters}L`;

    await createLedgerEntry({
        entry_date: date,
        account_code: fgAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "BATCH",
        source_id: batchId,
        department: "PRODUCTION",
        description: desc,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: clearingAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "BATCH",
        source_id: batchId,
        department: "PRODUCTION",
        description: desc,
    });
}

/** Production: Wastage → Debit Wastage Expense, Credit Finished Goods */
export async function postWastage(batchId: string, wastageLiters: number, _createdBy: string) {
    const wastageAccount = await getAccountByCode("6000");
    const fgAccount = await getAccountByCode("1220");
    if (!wastageAccount || !fgAccount) throw new Error("Accounts 6000/1220 not found");
    const amount = wastageLiters * 10000;
    const date = new Date();
    const desc = `Wastage – ${wastageLiters}L`;

    await createLedgerEntry({
        entry_date: date,
        account_code: wastageAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "BATCH",
        source_id: batchId,
        department: "PRODUCTION",
        description: desc,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: fgAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "BATCH",
        source_id: batchId,
        department: "PRODUCTION",
        description: desc,
    });
}

/** Sales: Debit Cash/Bank/Mobile Money, Credit Revenue (Bottle or Jerrycan) */
export async function postSale(
    orderId: string,
    amount: number,
    packageType: string,
    paymentMethod: string,
    _createdBy: string
) {
    const isBottle = /BOTTLE|1L|bottle/i.test(packageType);
    const revenueCode = isBottle ? "4000" : "4010"; // Bottle Sales Revenue | Jerrycan Sales Revenue
    const revenueAccount = await getAccountByCode(revenueCode);
    if (!revenueAccount) throw new Error(`Revenue account ${revenueCode} not found`);

    const method = paymentMethod.toUpperCase();
    let cashCode = "1000";
    if (method === "BANK" || method === "BANK TRANSFER") cashCode = "1010";
    else if (["MTN", "AIRTEL", "AFRICELL", "MOBILE"].some((m) => method.includes(m))) cashCode = "1020";
    const cashAccount = await getAccountByCode(cashCode) ?? await getAccountByCode("1000");
    if (!cashAccount) throw new Error("Cash account not found");

    const date = new Date();
    await createLedgerEntry({
        entry_date: date,
        account_code: cashAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "SALE",
        source_id: orderId,
        department: "SALES",
        description: `Sale – ${packageType}`,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: revenueAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "SALE",
        source_id: orderId,
        department: "SALES",
        description: `Sale – ${packageType}`,
    });
}

/** Events: Invoice → Debit AR, Credit Event Catering Revenue */
export async function postEventInvoice(eventId: string, amount: number, _createdBy: string) {
    const arAccount = await getAccountByCode("1100");
    const eventRevenueAccount = await getAccountByCode("4100");
    if (!arAccount || !eventRevenueAccount) throw new Error("Accounts 1100/4100 not found");

    const date = new Date();
    await createLedgerEntry({
        entry_date: date,
        account_code: arAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "EVENT",
        source_id: eventId,
        department: "EVENTS",
        description: "Event invoice",
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: eventRevenueAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "EVENT",
        source_id: eventId,
        department: "EVENTS",
        description: "Event invoice",
    });
}

/** Operating expense: Debit Operating Expenses (6500), Credit Cash/Bank/Mobile Money */
export async function postOperatingExpense(
    expenseId: string,
    amount: number,
    paymentMethod: string,
    category: string,
    description: string,
    _createdBy: string
) {
    const opExAccount = await getAccountByCode("6500");
    if (!opExAccount) throw new Error("Operating Expenses (6500) not found");

    const method = paymentMethod.toUpperCase();
    let cashCode = "1000";
    if (method === "BANK" || method === "BANK TRANSFER") cashCode = "1010";
    else if (["MTN", "AIRTEL", "AFRICELL", "MOBILE_MONEY"].some((m) => method.includes(m))) cashCode = "1020";
    const cashAccount = await getAccountByCode(cashCode);
    if (!cashAccount) throw new Error(`Payment account ${cashCode} not found`);

    const date = new Date();
    const desc = `${category}: ${description}`;

    await createLedgerEntry({
        entry_date: date,
        account_code: opExAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "EXPENSE",
        source_id: expenseId,
        department: "GENERAL",
        description: desc,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: cashAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "EXPENSE",
        source_id: expenseId,
        department: "GENERAL",
        description: desc,
    });
}

/** Event amount adjustment: when event total changes, post difference to AR and Revenue */
export async function postEventAmountAdjustment(
    eventId: string,
    oldAmount: number,
    newAmount: number,
    _createdBy: string
) {
    const diff = newAmount - oldAmount;
    if (Math.abs(diff) < 0.01) return;

    const arAccount = await getAccountByCode("1100");
    const eventRevenueAccount = await getAccountByCode("4100");
    if (!arAccount || !eventRevenueAccount) throw new Error("Accounts 1100/4100 not found");

    const date = new Date();
    const desc = `Event amount adjustment (${oldAmount} → ${newAmount})`;
    if (diff > 0) {
        await createLedgerEntry({
            entry_date: date,
            account_code: arAccount.account_code,
            debit_amount: diff,
            credit_amount: 0,
            source_type: "EVENT",
            source_id: eventId,
            department: "EVENTS",
            description: desc,
        });
        await createLedgerEntry({
            entry_date: date,
            account_code: eventRevenueAccount.account_code,
            debit_amount: 0,
            credit_amount: diff,
            source_type: "EVENT",
            source_id: eventId,
            department: "EVENTS",
            description: desc,
        });
    } else {
        await createLedgerEntry({
            entry_date: date,
            account_code: arAccount.account_code,
            debit_amount: 0,
            credit_amount: Math.abs(diff),
            source_type: "EVENT",
            source_id: eventId,
            department: "EVENTS",
            description: desc,
        });
        await createLedgerEntry({
            entry_date: date,
            account_code: eventRevenueAccount.account_code,
            debit_amount: Math.abs(diff),
            credit_amount: 0,
            source_type: "EVENT",
            source_id: eventId,
            department: "EVENTS",
            description: desc,
        });
    }
}

/** Event reversal: when event is deleted, reverse all ledger entries for that event */
export async function postEventReversal(eventId: string, _createdBy: string) {
    const entries = await prisma.ledgerEntry.findMany({
        where: { source_type: "EVENT", source_id: eventId },
        include: { account: true },
    });
    const date = new Date();
    for (const e of entries) {
        await createLedgerEntry({
            entry_date: date,
            account_code: e.account.account_code,
            debit_amount: e.credit_amount,
            credit_amount: e.debit_amount,
            source_type: "ADJUSTMENT",
            source_id: eventId,
            department: "EVENTS",
            description: "Event reversal (deleted)",
        });
    }
}

/** Payroll: when PAID → Debit Staff Salaries (6600), Credit Cash (1000) */
export async function postPayroll(
    payrollId: string,
    netPay: number,
    paymentMethod: string,
    _createdBy: string
) {
    const salariesAccount = await getAccountByCode("6600");
    if (!salariesAccount) throw new Error("Staff Salaries (6600) not found");

    const method = paymentMethod.toUpperCase();
    let cashCode = "1000";
    if (method === "BANK" || method === "BANK TRANSFER") cashCode = "1010";
    else if (["MTN", "AIRTEL", "AFRICELL", "MOBILE"].some((m) => method.includes(m))) cashCode = "1020";
    const cashAccount = await getAccountByCode(cashCode) ?? await getAccountByCode("1000");
    if (!cashAccount) throw new Error("Cash account not found");

    const date = new Date();
    const desc = `Payroll – ${paymentMethod}`;

    await createLedgerEntry({
        entry_date: date,
        account_code: salariesAccount.account_code,
        debit_amount: netPay,
        credit_amount: 0,
        source_type: "HR_PAYROLL",
        source_id: payrollId,
        department: "GENERAL",
        description: desc,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: cashAccount.account_code,
        debit_amount: 0,
        credit_amount: netPay,
        source_type: "HR_PAYROLL",
        source_id: payrollId,
        department: "GENERAL",
        description: desc,
    });
}

/** Events: Payment → Debit Cash/Bank/Mobile Money, Credit AR */
export async function postEventPayment(
    eventId: string,
    amount: number,
    paymentMethod: string,
    _createdBy: string
) {
    const arAccount = await getAccountByCode("1100");
    if (!arAccount) throw new Error("Accounts Receivable (1100) not found");

    const method = paymentMethod.toUpperCase();
    let cashCode = "1000";
    if (method === "BANK" || method === "BANK TRANSFER") cashCode = "1010";
    else if (["MTN", "AIRTEL", "AFRICELL", "MOBILE"].some((m) => method.includes(m))) cashCode = "1020";
    const cashAccount = await getAccountByCode(cashCode) ?? await getAccountByCode("1000");
    if (!cashAccount) throw new Error("Cash account not found");

    const date = new Date();
    await createLedgerEntry({
        entry_date: date,
        account_code: cashAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "EVENT",
        source_id: eventId,
        department: "EVENTS",
        description: `Event payment – ${paymentMethod}`,
    });
    await createLedgerEntry({
        entry_date: date,
        account_code: arAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "EVENT",
        source_id: eventId,
        department: "EVENTS",
        description: `Event payment – ${paymentMethod}`,
    });
}

/** Orders: Invoice → Debit AR, Credit Revenue (Bottle/Jerrycan) */
export async function postOrderInvoice(
    orderId: string,
    amount: number,
    packageType: string,
    _createdBy: string
) {
    const arAccount = await getAccountByCode("1100");
    const isBottle = /BOTTLE|1L|bottle/i.test(packageType);
    const revenueCode = isBottle ? "4000" : "4010"; // Bottle Sales Revenue | Jerrycan Sales Revenue
    const revenueAccount = await getAccountByCode(revenueCode);

    if (!arAccount || !revenueAccount) throw new Error(`Accounts 1100/${revenueCode} not found`);

    const date = new Date();
    const desc = `Order Invoice – ${packageType}`;

    await createLedgerEntry({
        entry_date: date,
        account_code: arAccount.account_code,
        debit_amount: amount,
        credit_amount: 0,
        source_type: "SALE",
        source_id: orderId,
        department: "SALES",
        description: desc,
    });

    await createLedgerEntry({
        entry_date: date,
        account_code: revenueAccount.account_code,
        debit_amount: 0,
        credit_amount: amount,
        source_type: "SALE",
        source_id: orderId,
        department: "SALES",
        description: desc,
    });
}

/** Procurement: PO Approval (Optional Commitment Tracking) */
export async function postPOApproval(
    poId: string,
    amount: number,
    _createdBy: string
) {
    // Current accounting policy: PO approval does not create a GL entry.
    // Entries start at GRN (Inventory/AP).
    // This function exists to satisfy the API call structure.
    console.log(`PO ${poId} approved for UGX ${amount}`);
}
