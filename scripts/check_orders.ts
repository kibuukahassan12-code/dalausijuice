import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderConsistency() {
    console.log('--- Order Consistency Check ---');

    const orders = await prisma.order.findMany();
    console.log(`Found ${orders.length} orders.`);

    for (const order of orders) {
        const entries = await prisma.ledgerEntry.findMany({
            where: { source_type: 'ORDER', source_id: order.id }
        });

        console.log(`Order: ${order.id} (Total: ${order.totalAmount})`);
        console.log(`  Ledger Entries: ${entries.length}`);

        if (entries.length === 0) {
            console.log('  [WARNING] Missing ledger entry!');
        }
    }

    await prisma.$disconnect();
}

checkOrderConsistency();
