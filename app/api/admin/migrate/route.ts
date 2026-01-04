
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mockMembers, mockExpenses, mockAuditLogs } from '@/lib/mockData';
import { hashPassword } from '@/lib/hash';

export async function GET(request: Request) {
    try {
        // Simple security check (Authorization header or just simple secret param?)
        // For now, we'll assume the user visits this once. 
        // We can check query param ?secret=MY_SECRET
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== process.env.AUTH_SECRET && secret !== 'migration-override') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting migration via API...');
        const logs: string[] = [];
        const log = (msg: string) => { console.log(msg); logs.push(msg); };

        log(`Starting migration... Members: ${mockMembers.length}`);

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
        } else {
            log('Admin user already exists');
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
                log(`Created User: ${user.username}`);
            }

            // Check by both accountNumber AND phone (both are unique)
            const existingMember = await prisma.member.findUnique({ where: { accountNumber: m.accountNumber } });
            const existingByPhone = await prisma.member.findUnique({ where: { phone: m.phone.toString() } });

            if (!existingMember && !existingByPhone) {
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
                        gps: m.gps, // Maps to gpsAddress in DB
                        beneficiaryName: m.beneficiaryName,
                        beneficiaryRelationship: m.beneficiaryRelationship, // DB field beneficiaryRelation
                        beneficiaryAddress: m.beneficiaryAddress,
                        totalSavings: m.totalSavings,
                        totalShares: m.totalShares,
                        totalLoans: m.totalLoans
                    }
                });
                log(`Created Member: ${m.accountNumber}`);
            } else {
                log(`Skipped Member (exists): ${m.accountNumber}`);
            }

            // Transactions
            if (m.transactions && m.transactions.length > 0) {
                const dbMember = await prisma.member.findUnique({ where: { accountNumber: m.accountNumber } });
                if (dbMember) {
                    for (const tx of m.transactions) {
                        const existingTx = await prisma.transaction.findFirst({
                            where: {
                                receiptNumber: tx.receiptNo || (tx as any).receiptNumber,
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
                                    receiptNumber: tx.receiptNo || (tx as any).receiptNumber,
                                    isReversal: tx.isReversal || false
                                }
                            });
                        }
                    }
                    log(`Processed transactions for ${m.accountNumber}`);
                }
            }
        }

        // 2. Expenses
        log(`Migrating ${mockExpenses.length} expenses...`);
        for (const exp of mockExpenses) {
            // Check existence by ID if possible, or just create (mock IDs are simple)
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
            }
        }

        // 3. Audit Logs
        // Skip for now or implement similarly if critical

        log('Migration Complete');
        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
