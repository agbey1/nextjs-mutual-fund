
import prisma from '../lib/prisma';
import { mockTransactions } from '../lib/mockData';

async function main() {
    console.log("Testing Mock Prisma Date Filtering...");

    // Check Date Formats
    console.log("Sample Transaction Date:", mockTransactions[0]?.date);

    const filterDate = "2023-01-01";
    const isoDate = new Date(filterDate).toISOString();
    console.log("Filter Date ISO:", isoDate);

    // Test findMany
    console.log("\n--- Testing findMany with date filter ---");
    const results = await prisma.transaction.findMany({
        where: {
            date: { lte: isoDate }
        }
    });

    console.log(`Found ${results.length} transactions (expected 0 or low count)`);
    results.slice(0, 3).forEach((t: any) => console.log(` - ${t.date} (${t.amount})`));

    const badResults = results.filter((t: any) => new Date(t.date) > new Date(isoDate));
    if (badResults.length > 0) {
        console.error("FAIL: Found transactions after filter date:");
        badResults.forEach((t: any) => console.log(`   BAD: ${t.date}`));
    } else {
        console.log("PASS: No transactions after filter date.");
    }

    // Test Aggregate
    console.log("\n--- Testing aggregate with date filter ---");
    const agg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            type: 'DEPOSIT',
            date: { lte: isoDate }
        }
    });
    console.log("Aggregate Sum:", agg._sum.amount);
}

main();
