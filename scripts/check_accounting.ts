import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAccountingConsistency() {
    console.log('--- Accounting Consistency Check ---');

    // 1. Check Events
    const events = await prisma.event.findMany({
        include: {
            paymentLinks: { include: { payment: true } }
        }
    });

    console.log(`Found ${events.length} events.`);

    for (const event of events) {
        const invoiceEntries = await prisma.ledgerEntry.findMany({
            where: { source_type: 'EVENT', source_id: event.id, description: { contains: 'invoice' } }
        });

        const paymentEntries = await prisma.ledgerEntry.findMany({
            where: { source_type: 'EVENT', source_id: event.id, description: { contains: 'payment' } }
        });

        const totalPaid = event.paymentLinks.reduce((sum, link) => sum + (link.payment?.amountPaid || 0), 0);

        console.log(`Event: ${event.eventName} (${event.id})`);
        console.log(`  Total Amount: ${event.totalAmount}`);
        console.log(`  Invoice Entries: ${invoiceEntries.length} (Sum Debit: ${invoiceEntries.reduce((s, e) => s + e.debit_amount, 0)})`);
        console.log(`  Payments Recorded: ${totalPaid}`);
        console.log(`  Payment Entries: ${paymentEntries.length} (Sum Credit AR: ${paymentEntries.reduce((s, e) => s + e.credit_amount, 0)})`);

        if (invoiceEntries.length === 0) {
            console.log('  [WARNING] Missing invoice ledger entry!');
        }
        if (totalPaid > 0 && paymentEntries.length === 0) {
            console.log('  [WARNING] Missing payment ledger entries!');
        }
    }

    // 2. Check Expenses
    const expenses = await prisma.expense.findMany();
    console.log(`\nFound ${expenses.length} expenses.`);
    for (const expense of expenses) {
        const entries = await prisma.ledgerEntry.findMany({
            where: { source_type: 'EXPENSE', source_id: expense.id }
        });
        console.log(`Expense: ${expense.description} (${expense.amount})`);
        console.log(`  Ledger Entries: ${entries.length}`);
        if (entries.length === 0) {
            console.log('  [WARNING] Missing ledger entry!');
        }
    }

    await prisma.$disconnect();
}

checkAccountingConsistency();
