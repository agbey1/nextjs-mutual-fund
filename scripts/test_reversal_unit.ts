
import { POST } from '../app/api/transactions/reverse/route';
import prisma from '../lib/prisma';
import { mockTransactions, mockMembers } from '../lib/mockData';

// Mock Auth
jest.mock('../lib/auth', () => ({
    auth: async () => ({ user: { id: 'admin', role: 'ADMIN' } })
}));

async function main() {
    console.log("UNIT TEST: Reversal API Logic");

    // 1. Setup Data
    const member = await prisma.member.create({
        data: {
            userId: 'unit-test-user',
            firstName: 'Unit',
            lastName: 'Test',
            totalSavings: 500,
            accountNumber: 'UNIT001'
        }
    });

    const tx = await prisma.transaction.create({
        data: {
            memberId: member.id,
            type: 'DEPOSIT',
            amount: 100,
            reference: 'ORIG-UNIT'
        }
    });
    console.log("Original Tx Created:", tx.id);
    console.log("Initial Savings:", (await prisma.member.findUnique({ where: { id: member.id } })).totalSavings);

    // 2. Mock Request
    const req = new Request("http://localhost/api/transactions/reverse", {
        method: "POST",
        body: JSON.stringify({
            transactionId: tx.id,
            reason: "Unit Test Reversal"
        })
    });

    // 3. Call Handler
    // We need to intercept the response
    const res = await POST(req);

    if (res.status !== 200) {
        console.error("API Error:", res.status, await res.text());
        return;
    }

    const json = await res.json();
    console.log("API Response:", json); // Should be the reversal transaction

    // 4. Verify Side Effects
    const updatedMember = await prisma.member.findUnique({ where: { id: member.id } });
    console.log("Updated Savings:", updatedMember.totalSavings);

    if (updatedMember.totalSavings === 400) { // 500 + 100 (deposit) - 100 (reversal of deposit) = 500?? 
        // Wait:
        // Initial 500.
        // Created Deposit 100. Logic updates balance? 
        // prisma.transaction.create in mock does NOT update balance automatically unless it's via the route logic!
        // Ah! In this script, I called prisma.transaction.create directly.
        // BUT the API route calls `update` manually.
        // So:
        // Member created with 500.
        // Tx created with 100. (Balance still 500 because I didn't update it in setup).
        // Reversal API called. It sees Deposit 100. Reversal logic is WITHDRAWAL 100.
        // API updates balance by -100.
        // Result: 500 - 100 = 400.
        // So if result is 400, it works correctly (decrement applied).
        console.log("PASS: Balance updated correctly (decremented).");
    } else {
        console.error("FAIL: Balance mismatch. Expected 400 (500 start - 100 opposite). Got:", updatedMember.totalSavings);
    }

    // Verify Audit
    const audits = await prisma.auditLog.findMany();
    const reversalLog = audits.find((a: any) => a.action === 'REVERSE_TRANSACTION' && a.details.includes(tx.id));
    if (reversalLog) {
        console.log("PASS: Audit Log found.");
    } else {
        console.error("FAIL: Audit Log missing.");
    }
}

main();
