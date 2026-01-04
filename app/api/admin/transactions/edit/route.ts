import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { id, date, description, receiptNumber } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        // Prepare update data - only allow safe fields
        const updateData: any = {};
        if (date) updateData.date = date;
        if (description) updateData.description = description;
        if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber; // Allow clearing?

        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
        });

        // Log the audit (if we had a real audit log user context, for now we mock it)
        await prisma.auditLog.create({
            data: {
                action: 'TRANSACTION_EDIT',
                details: `Edited transaction ${id}: ${JSON.stringify(updateData)}`,
                userId: 'admin-mock-id', // Placeholder
            }
        });

        return NextResponse.json(updatedTransaction);
    } catch (error) {
        console.error('Error editing transaction:', error);
        return NextResponse.json(
            { error: 'Failed to edit transaction' },
            { status: 500 }
        );
    }
}
