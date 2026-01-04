import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get('account') || '1000007';

    try {
        // Find member
        const member = await prisma.member.findUnique({
            where: { accountNumber }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member not found', accountNumber });
        }

        // Count transactions for this member
        const transactions = await prisma.transaction.findMany({
            where: { memberId: member.id },
            orderBy: { date: 'desc' },
            take: 10
        });

        const totalTxCount = await prisma.transaction.count({
            where: { memberId: member.id }
        });

        // Get total counts in DB
        const totalMembers = await prisma.member.count();
        const totalTransactions = await prisma.transaction.count();

        return NextResponse.json({
            member: {
                id: member.id,
                accountNumber: member.accountNumber,
                name: `${member.firstName} ${member.lastName}`,
                totalSavings: member.totalSavings,
                totalShares: member.totalShares
            },
            transactionCount: totalTxCount,
            recentTransactions: transactions.map((t: any) => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                date: t.date,
                receiptNumber: t.receiptNumber
            })),
            dbStats: {
                totalMembers,
                totalTransactions
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
