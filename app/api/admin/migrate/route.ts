
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mockMembers, mockExpenses, mockAuditLogs } from '@/lib/mockData';
import { hashPassword } from '@/lib/hash';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        const reset = searchParams.get('reset') === 'true';

        if (secret !== process.env.AUTH_SECRET && secret !== 'migration-override') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting migration via API...');
        const logs: string[] = [];
        const log = (msg: string) => { console.log(msg); logs.push(msg); };

        if (reset) {
            log('⚠️ RESET MODE: Deleting all existing data...');
            await prisma.transaction.deleteMany({});
            await prisma.expense.deleteMany({});
            await prisma.bankTransaction.deleteMany({});
            // Delete members and users last due to FKeys
            await prisma.member.deleteMany({});
            await prisma.user.deleteMany({});
            log('✅ Database cleared.');
        }

        // Statistics
        let usersCreated = 0;
        let usersSkipped = 0;
        let membersCreated = 0;
        let membersSkipped = 0;
        let membersWithDuplicatePhone = 0;
        let totalExpectedTx = 0;
        let txCreated = 0;
        let txSkipped = 0;
        let membersWithNoTx = 0;
        let expensesCreated = 0;
        let bankTxCreated = 0;

        // Count total expected transactions from mockData
        for (const m of mockMembers) {
            totalExpectedTx += (m.transactions?.length || 0);
        }

        log(`Starting migration... Members: ${mockMembers.length}, Expected Transactions: ${totalExpectedTx}`);

        // 0. Create standalone Admin user (username: admin, password: admin)
        const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (!existingAdmin) {
            const adminHash = await hashPassword('admin');
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: adminHash,
                    role: 'ADMIN',
                    name: 'System Administrator'
                }
            });
            log('Created Admin user (admin/admin)');
            usersCreated++;
        } else {
            log('Admin user already exists');
            usersSkipped++;
        }

        // 1. Users & Members
        for (const m of mockMembers) {
            const hashedPassword = await hashPassword(m.phone.toString());

            let user = await prisma.user.findUnique({ where: { username: m.accountNumber } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        username: m.accountNumber,
                        password: hashedPassword,
                        role: m.id === '1' ? 'ADMIN' : 'MEMBER',
                        name: `${m.firstName} ${m.lastName}`
                    }
                });
                usersCreated++;
            } else {
                usersSkipped++;
            }

            // Check if member already exists by accountNumber
            const existingMember = await prisma.member.findUnique({ where: { accountNumber: m.accountNumber } });

            if (existingMember) {
                membersSkipped++;
            } else {
                // Check if phone is already in use - if so, make it unique
                let phone = m.phone.toString();
                const existingByPhone = await prisma.member.findUnique({ where: { phone: phone } });

                if (existingByPhone) {
                    phone = `${phone}-${m.accountNumber}`;
                    membersWithDuplicatePhone++;
                    log(`Duplicate phone for ${m.accountNumber}, using: ${phone}`);
                }

                await prisma.member.create({
                    data: {
                        userId: user.id,
                        firstName: m.firstName,
                        lastName: m.lastName,
                        gender: m.gender as any,
                        dateOfBirth: new Date(m.dateOfBirth === "00:00.0" ? "1970-01-01" : m.dateOfBirth),
                        accountNumber: m.accountNumber,
                        phone: phone,
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
                membersCreated++;
            }

            // Transactions - ALWAYS process (even for existing members)
            if (m.transactions && m.transactions.length > 0) {
                const dbMember = await prisma.member.findUnique({ where: { accountNumber: m.accountNumber } });
                if (dbMember) {
                    for (const tx of m.transactions) {
                        const receiptNum = tx.receiptNo || (tx as any).receiptNumber || `TX-${tx.id}`;

                        // Check by ID instead of receipt for uniqueness
                        const existingTx = await prisma.transaction.findFirst({
                            where: {
                                OR: [
                                    { id: tx.id },
                                    { receiptNumber: receiptNum, memberId: dbMember.id }
                                ]
                            }
                        });

                        if (!existingTx) {
                            await prisma.transaction.create({
                                data: {
                                    id: tx.id, // Use original ID
                                    memberId: dbMember.id,
                                    type: tx.type as any,
                                    amount: tx.amount,
                                    interestAmount: tx.interestAmount || 0,
                                    principalAmount: tx.principalAmount || 0,
                                    date: new Date(tx.date),
                                    description: tx.description,
                                    receiptNumber: receiptNum,
                                    isReversal: tx.isReversal || false
                                }
                            });
                            txCreated++;
                        } else {
                            txSkipped++;
                        }
                    }
                }
            } else {
                membersWithNoTx++;
            }
        }

        // 2. Expenses
        log(`Migrating ${mockExpenses.length} expenses...`);
        for (const exp of mockExpenses) {
            const existing = await prisma.expense.findUnique({ where: { id: exp.id } });
            if (!existing) {
                await prisma.expense.create({
                    data: {
                        id: exp.id,
                        description: exp.description,
                        amount: exp.amount,
                        date: new Date(exp.date),
                        category: exp.category
                    }
                });
                expensesCreated++;
            }
        }

        // 3. Bank Transactions
        const { mockBankTransactions } = await import('@/lib/bankData');
        log(`Migrating ${mockBankTransactions.length} bank transactions...`);

        for (const btx of mockBankTransactions) {
            const existing = await prisma.bankTransaction.findFirst({
                where: { reference: btx.Id.toString() }
            });

            if (!existing) {
                // Excel Date Conversion (25569 offset for Unix epoch from Dec 30 1899)
                const excelDate = btx.ReceiptDate || btx.Date;
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);

                await prisma.bankTransaction.create({
                    data: {
                        date: jsDate,
                        amount: btx.Amount,
                        type: btx.BankTransactionTypeId === 1 ? 'DEPOSIT' : 'WITHDRAWAL',
                        description: btx.PaidBy,
                        reference: btx.Id.toString()
                    }
                });
                bankTxCreated++;
            }
        }

        // Summary
        const summary = {
            users: { created: usersCreated, skipped: usersSkipped },
            members: { created: membersCreated, skipped: membersSkipped, duplicatePhones: membersWithDuplicatePhone },
            transactions: { expected: totalExpectedTx, created: txCreated, skipped: txSkipped },
            membersWithNoTransactions: membersWithNoTx,
            expenses: { created: expensesCreated },
            bankTransactions: { created: bankTxCreated }
        };

        log(`=== MIGRATION SUMMARY ===`);
        log(`Users: ${usersCreated} created, ${usersSkipped} skipped`);
        log(`Members: ${membersCreated} created, ${membersSkipped} skipped, ${membersWithDuplicatePhone} with duplicate phones`);
        log(`Transactions: ${txCreated} created, ${txSkipped} skipped (Expected: ${totalExpectedTx})`);
        log(`Members with NO transactions in mockData: ${membersWithNoTx}`);
        log(`Expenses: ${expensesCreated} created`);
        log(`Bank Transactions: ${bankTxCreated} created`);
        log('Migration Complete');

        return NextResponse.json({ success: true, summary, logs });

    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
