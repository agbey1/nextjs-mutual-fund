import { PrismaClient } from '@prisma/client';
import { mockMembers, mockExpenses, mockAuditLogs } from '../lib/mockData';
import { hashPassword } from '../lib/hash';

const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting migration from Mock Data to Database...');

    // 1. Migrate Users & Members
    console.log(`Migrating ${mockMembers.length} members...`);
    for (const m of mockMembers) {
        // Create User first
        // Default password is phone number
        const hashedPassword = await hashPassword(m.phone.toString());

        // Check if user exists (by username/accountNumber)
        let user = await prisma.user.findUnique({ where: { username: m.accountNumber } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: m.accountNumber,
                    password: hashedPassword,
                    role: m.id === '1' ? 'ADMIN' : 'MEMBER', // Make first member admin for now? Or keep separate admin?
                    name: `${m.firstName} ${m.lastName}`
                }
            });
            console.log(`Created User: ${user.username}`);
        }

        // Create Member
        const existingMember = await prisma.member.findUnique({ where: { accountNumber: m.accountNumber } });
        if (!existingMember) {
            await prisma.member.create({
                data: {
                    userId: user.id,
                    firstName: m.firstName,
                    lastName: m.lastName,
                    gender: m.gender as any,
                    dateOfBirth: new Date(m.dateOfBirth === "00:00.0" ? "1970-01-01" : m.dateOfBirth),
                    accountNumber: m.accountNumber,
                    phone: m.phone.toString(),
                    email: m.email,
                    address: m.address,
                    gps: m.gps,
                    beneficiaryName: m.beneficiaryName,
                    beneficiaryRelationship: m.beneficiaryRelationship,
                    beneficiaryAddress: m.beneficiaryAddress,
                    totalSavings: m.totalSavings,
                    totalShares: m.totalShares,
                    totalLoans: m.totalLoans
                }
            });
            console.log(`Created Member: ${m.accountNumber}`);
        }

        // Migrate Transactions for this member
        if (m.transactions && m.transactions.length > 0) {
            console.log(`  Migrating ${m.transactions.length} transactions for ${m.accountNumber}...`);
            // We need the REAL member ID from DB, not the mock ID '1'
            const dbMember = await prisma.member.findUnique({ where: { accountNumber: m.accountNumber } });
            if (!dbMember) continue;

            for (const tx of m.transactions) {
                // Check if tx exists
                const existingTx = await prisma.transaction.findFirst({
                    where: {
                        receiptNumber: tx.receiptNo || tx.receiptNumber, // Handle legacy property name
                        memberId: dbMember.id
                    }
                });

                if (!existingTx) {
                    await prisma.transaction.create({
                        data: {
                            memberId: dbMember.id,
                            type: tx.type as any,
                            amount: tx.amount,
                            interestAmount: tx.interestAmount || 0,
                            principalAmount: tx.principalAmount || 0,
                            date: new Date(tx.date),
                            description: tx.description,
                            receiptNumber: tx.receiptNo || tx.receiptNumber,
                            isReversal: tx.isReversal || false
                        }
                    });
                }
            }
        }
    }

    // 2. Migrate Expenses
    console.log(`Migrating ${mockExpenses.length} expenses...`);
    for (const exp of mockExpenses) {
        await prisma.expense.create({
            data: {
                description: exp.description,
                amount: exp.amount,
                date: new Date(exp.date),
                category: exp.category
            }
        });
    }

    // 3. Migrate Audit Logs
    console.log(`Migrating ${mockAuditLogs?.length || 0} audit logs...`);
    if (mockAuditLogs) {
        for (const log of mockAuditLogs) {
            await prisma.auditLog.create({
                data: {
                    action: log.action,
                    entityType: log.entityType,
                    entityId: log.entityId,
                    userId: log.userId || 'system',
                    details: log.details,
                    createdAt: new Date(log.timestamp || new Date())
                }
            });
        }
    }

    console.log('Migration Complete!');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
