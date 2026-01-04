
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

// POST: Approve and disburse a loan
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        // Get loan request
        const loan = await prisma.loanRequest.findUnique({
            where: { id },
            include: { member: true }
        });

        if (!loan) {
            return new NextResponse("Loan request not found", { status: 404 });
        }

        if (loan.status !== "PENDING") {
            return new NextResponse("Loan is not in pending status", { status: 400 });
        }

        // Update loan status to APPROVED/DISBURSED
        await prisma.loanRequest.update({
            where: { id },
            data: {
                status: "DISBURSED",
                approvedBy: session.user.id,
                approvedAt: new Date().toISOString(),
                disbursedAt: new Date().toISOString()
            }
        });

        // Create a LOAN_DISBURSAL transaction
        await prisma.transaction.create({
            data: {
                memberId: loan.memberId,
                type: "LOAN_DISBURSAL",
                amount: loan.amount,
                description: `Loan Disbursal - ${loan.purpose}`,
                reference: `LOAN-${id}`,
                recordedBy: session.user.id
            }
        });

        // Update member's total loans
        const member = loan.member;
        if (member) {
            await prisma.member.update({
                where: { id: loan.memberId },
                data: {
                    totalLoans: (member.totalLoans || 0) + loan.amount
                }
            });
        }

        // Audit
        await logAction("LOAN_APPROVED", "LOAN", id, {
            approvedBy: session.user.id,
            amount: loan.amount,
            memberId: loan.memberId
        });

        return new NextResponse("Loan approved and disbursed", { status: 200 });
    } catch (e) {
        console.error("Error approving loan:", e);
        return new NextResponse("Error approving loan", { status: 500 });
    }
}
