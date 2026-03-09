import { PrismaClient } from '@prisma/client';
import { postEventInvoice, postEventPayment } from '../src/lib/accounting';

const prisma = new PrismaClient();

async function postMissingEntries() {
    console.log('--- Accounting Data Correction ---');

    // 1. Process Events
    const events = await prisma.event.findMany({
        include: {
            paymentLinks: {
                include: {
                    payment: {
                        include: { paymentMethod: true }
                    }
                }
            }
        }
    });

    console.log(`Checking ${events.length} events...`);

    for (const event of events) {
        // Check for invoice entry
        const invoiceEntries = await prisma.ledgerEntry.findMany({
            where: { source_type: 'EVENT', source_id: event.id, description: { contains: 'invoice' } }
        });

        if (invoiceEntries.length === 0) {
            console.log(`Posting missing invoice for event: ${event.eventName} (${event.id})`);
            try {
                await postEventInvoice(event.id, event.totalAmount, 'correction-script');
                console.log('  Success.');
            } catch (e) {
                console.error(`  Failed to post invoice: ${(e as Error).message}`);
            }
        }

        // Check for payment entries
        for (const link of event.paymentLinks) {
            if (!link.payment) continue;

            // Payment entries in postEventPayment use source_type EVENT and source_id eventId
            // And descriptions like `Event payment – ${paymentMethod}`
            const paymentEntries = await prisma.ledgerEntry.findMany({
                where: {
                    source_type: 'EVENT',
                    source_id: event.id,
                    description: { contains: 'payment' },
                    // Try to match the amount to be sure it's THIS specific payment if there are multiple
                    OR: [
                        { debit_amount: link.payment.amountPaid },
                        { credit_amount: link.payment.amountPaid }
                    ]
                }
            });

            if (paymentEntries.length === 0) {
                console.log(`Posting missing payment entry for event ${event.eventName}: UGX ${link.payment.amountPaid}`);
                try {
                    const methodCode = link.payment.paymentMethod?.code || 'CASH';
                    await postEventPayment(event.id, link.payment.amountPaid, methodCode, 'correction-script');
                    console.log('  Success.');
                } catch (e) {
                    console.error(`  Failed to post payment: ${(e as Error).message}`);
                }
            }
        }
    }

    console.log('\n--- Checking Expenses ---');
    const expenses = await prisma.expense.findMany();
    for (const expense of expenses) {
        const entries = await prisma.ledgerEntry.findMany({
            where: { source_type: 'EXPENSE', source_id: expense.id }
        });
        if (entries.length === 0) {
            console.log(`Posting missing entry for expense: ${expense.description} (${expense.id})`);
            // postOperatingExpense(expenseId, amount, paymentMethod, category, description, createdBy)
            // We need the accounting library for this. 
            // Note: postOperatingExpense is exported from accounting.ts
            const { postOperatingExpense } = await import('../src/lib/accounting');
            try {
                // We'll use a default payment method name if not easily available
                await postOperatingExpense(expense.id, expense.amount, 'CASH', expense.category, expense.description, 'correction-script');
                console.log('  Success.');
            } catch (e) {
                console.error(`  Failed to post expense: ${(e as Error).message}`);
            }
        }
    }

    await prisma.$disconnect();
    console.log('Correction complete.');
}

postMissingEntries();
