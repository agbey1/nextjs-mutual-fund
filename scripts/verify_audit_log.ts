
import prisma from '../lib/prisma';
import { mockAuditLogs } from '../lib/mockData';

async function main() {
    console.log("Testing Mock Audit Log...");

    // 1. Create a log
    console.log("Creating log...");
    const log = await prisma.auditLog.create({
        data: {
            userId: 'test-admin',
            action: 'TEST_ACTION',
            entityType: 'TEST',
            entityId: '123',
            details: JSON.stringify({ foo: 'bar' })
        }
    });
    console.log("Created Log:", log);

    // 2. Fetch logs
    console.log("Fetching logs...");
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${logs.length} logs.`);

    const found = logs.find((l: any) => l.id === log.id);
    if (found) {
        console.log("PASS: Found created log.");
    } else {
        console.error("FAIL: Created log not found.");
    }

    // Verify properties
    if (found.action === 'TEST_ACTION' && found.userId === 'test-admin') {
        console.log("PASS: Log properties match.");
    } else {
        console.error("FAIL: Log properties mismatch:", found);
    }
}

main();
