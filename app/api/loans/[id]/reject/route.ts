
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

// POST: Reject a loan request
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
        const body = await req.json();
        const { reason } = body;

        // Get loan request
        const loan = await prisma.loanRequest.findUnique({
            where: { id }
        });

        if (!loan) {
            return new NextResponse("Loan request not found", { status: 404 });
        }

        if (loan.status !== "PENDING") {
            return new NextResponse("Loan is not in pending status", { status: 400 });
        }

        // Update loan status to REJECTED
        await prisma.loanRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectedBy: session.user.id,
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason || "Not specified"
            }
        });

        // Audit
        await logAction("LOAN_REJECTED", "LOAN", id, {
            rejectedBy: session.user.id,
            reason
        });

        return new NextResponse("Loan request rejected", { status: 200 });
    } catch (e) {
        console.error("Error rejecting loan:", e);
        return new NextResponse("Error rejecting loan", { status: 500 });
    }
}
