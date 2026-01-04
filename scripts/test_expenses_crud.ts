
import prisma from '../lib/prisma';

async function main() {
    console.log("UNIT TEST: Mock Prisma Expense Client");

    // 1. CREATE
    console.log("\n--- TEST: CREATE ---");
    const created = await prisma.expense.create({
        data: {
            amount: 100,
            description: "Test Expense",
            category: "Operational",
            recordedBy: "tester"
        }
    });
    console.log("Created:", created);
    if (!created.id || created.amount !== 100) console.error("FAIL: Create returned invalid object");

    // 2. READ (Verify list update)
    const list = await prisma.expense.findMany({});
    const found = list.find((e: any) => e.id === created.id);
    if (found) console.log("PASS: Expense found in findMany.");
    else console.error("FAIL: Expense not in list.");

    // 3. UPDATE
    console.log("\n--- TEST: UPDATE ---");
    const updated = await prisma.expense.update({
        where: { id: created.id },
        data: {
            amount: 150,
            description: "Updated Expense",
            category: "Capital"
        }
    });
    console.log("Updated:", updated);

    // Verify Persistence
    const verifyUpdate = ((await prisma.expense.findMany({})) as any[]).find(e => e.id === created.id);
    if (verifyUpdate.amount === 150 && verifyUpdate.category === "Capital") {
        console.log("PASS: Update persisted in memory.");
    } else {
        console.error("FAIL: Update reflected in return but not in memory?");
    }

    // 4. DELETE
    console.log("\n--- TEST: DELETE ---");
    const deleted = await prisma.expense.delete({
        where: { id: created.id }
    });
    console.log("Deleted:", deleted);

    // Verify Removal
    const verifyDelete = await prisma.expense.findMany({});
    if (!verifyDelete.find((e: any) => e.id === created.id)) {
        console.log("PASS: Expense removed from memory.");
    } else {
        console.error("FAIL: Expense still exists.");
    }
}

main();
