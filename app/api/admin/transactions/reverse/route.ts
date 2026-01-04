import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { id, reason } = body;

        if (!id || !reason) {
            return NextResponse.json(
                { error: 'Transaction ID and reason are required' },
                { status: 400 }
            );
        }

        // Find the original transaction
        // Note: Mock prisma transaction.findUnique is not implemented, using findMany
        const transactions = await prisma.transaction.findMany({
            where: { id } // Custom implementation maps 'id' filter in findMany?
        });

        // Check if my findMany implementation supports 'id' filter directly?
        // Looking at lib/prisma.ts:
        // if (args?.where?.memberId) ...
        // if (args?.where?.type) ...
        // It DOES NOT support 'id' filter explicitly in the mock!

        // I need to fetch all and filter manually in this API route since the mock is limited
        // Or assume findMany returns everything if I don't pass supported filters, then I filter here.
        // But wait, findMany returns EVERYTHING if no memberId provided?
        // Yes: let result = getAllTransactions(); ... return result;

        // So I can fetch all and find. Not efficient but fine for mock.
        const allTx = await prisma.transaction.findMany({});
        const originalTx = allTx.find((t: any) => t.id === id);

        if (!originalTx) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Create offsetting transaction
        const reversalTx = await prisma.transaction.create({
            data: {
                memberId: originalTx.memberId,
                type: originalTx.type, // Same type to offset correctly in aggregations
                amount: -1 * (originalTx.amount || 0),
                interestAmount: -1 * (originalTx.interestAmount || 0),
                date: new Date().toISOString(), // Reversal happens now
                description: `REVERSAL of ${originalTx.receiptNumber || id}: ${reason}`,
                receiptNumber: `REV-${Date.now()}`,
                isReversal: true,
                originalTransactionId: id
            }
        });

        // Mark original as reversed? 
        // Usually good practice. The mock update supports it.
        await prisma.transaction.update({
            where: { id },
            data: { description: `${originalTx.description} (REVERSED)` }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'TRANSACTION_REVERSE',
                details: `Reversed transaction ${id}. New Tx: ${reversalTx.id}. Reason: ${reason}`,
                userId: 'admin-mock-id'
            }
        });

        return NextResponse.json(reversalTx);
    } catch (error) {
        console.error('Error reversing transaction:', error);
        return NextResponse.json(
            { error: 'Failed to reverse transaction' },
            { status: 500 }
        );
    }
}
