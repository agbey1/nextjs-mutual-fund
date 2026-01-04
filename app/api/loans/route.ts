
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

// GET: List all loan requests (Admin sees all, Member sees their own)
export async function GET(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        let where: any = {};

        // Members can only see their own loans
        if (session.user.role === "MEMBER") {
            where.memberId = session.user.memberId;
        }

        if (status) {
            where.status = status;
        }

        const loans = await prisma.loanRequest.findMany({
            where,
            include: { member: true }
        });

        return NextResponse.json(loans);
    } catch (e) {
        console.error("Error fetching loans:", e);
        return new NextResponse("Error fetching loans", { status: 500 });
    }
}

// POST: Create a new loan request
export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { memberId, amount, purpose, repaymentPeriod, interestType, interestValue } = body;

        // Validate
        if (!memberId || !amount || amount <= 0) {
            return new NextResponse("Invalid loan request data", { status: 400 });
        }

        // Members can only request for themselves
        if (session.user.role === "MEMBER" && memberId !== session.user.memberId) {
            return new NextResponse("Cannot request loan for another member", { status: 403 });
        }

        // Get member details
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // Create loan request
        const loan = await prisma.loanRequest.create({
            data: {
                memberId,
                amount: parseFloat(amount),
                purpose: purpose || "General Loan",
                repaymentPeriod: repaymentPeriod || 12, // Default 12 months
                status: "PENDING",
                requestedBy: session.user.id,
                interestType: interestType || "PERCENTAGE",
                interestRate: interestType === "PERCENTAGE" ? (parseFloat(interestValue) / 100) : 0,
                interestAmount: interestType === "FIXED" ? parseFloat(interestValue) : 0
            }
        });

        // Audit
        await logAction("LOAN_REQUEST_CREATED", "LOAN", loan.id, {
            memberId,
            amount,
            requestedBy: session.user.id
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (e) {
        console.error("Error creating loan:", e);
        return new NextResponse("Error creating loan request", { status: 500 });
    }
}
