
import prisma from '../lib/prisma';

async function main() {
    console.log("DEBUG: Current Expense Totals");

    // 1. Get All Expenses
    const all = await prisma.expense.findMany({});
    console.log(`Count: ${all.length}`);

    // 2. Aggregate Total
    const total = all.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    console.log(`Total Expenses (All Categories): ${total}`);

    // 3. Aggregate By Category
    const byCat = all.reduce((acc: any, e: any) => {
        const cat = e.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + (e.amount || 0);
        return acc;
    }, {});
    console.table(byCat);

    // 4. Check what Dashboard Query does
    const dashboardQuery = await prisma.expense.aggregate({ _sum: { amount: true } });
    console.log(`Dashboard Query Result: ${dashboardQuery._sum.amount}`);
}

main();
