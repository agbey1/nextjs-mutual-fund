import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId");
        const take = parseInt(searchParams.get("take") || "50");
        const skip = parseInt(searchParams.get("skip") || "0");
        const search = searchParams.get("search") || "";

        const where: any = {};
        if (memberId) where.memberId = memberId;

        if (search) {
            where.OR = [
                { reference: { contains: search, mode: 'insensitive' } }, // Case-insensitive if Prisma supports, mock might need help
                // Mock Prisma might not iterate deep relations easily in 'where'. 
                // But let's try standard Prisma syntax.
                // Note: Schema might not support 'mode' depending on DB provider, usually ok for postgres.
                // For nested relation filter:
                { member: { firstName: { contains: search, mode: 'insensitive' } } },
                { member: { lastName: { contains: search, mode: 'insensitive' } } },
                { member: { accountNumber: { contains: search } } }
            ];
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { date: 'desc' },
                take,
                skip,
                include: { member: { select: { firstName: true, lastName: true, accountNumber: true } } }
            }),
            prisma.transaction.count({ where })
        ]);

        return NextResponse.json({ data: transactions, meta: { total, skip, take } });
    } catch (e) {
        console.error(e);
        return new NextResponse("Error fetching transactions", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { memberId, type, amount, reference, description, interestAmount, principalAmount } = body;

        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return new NextResponse("Invalid amount", { status: 400 });

        // Fetch current member state for validation
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!member) return new NextResponse("Member not found", { status: 404 });

        // VALIDATION LOGIC
        if (type === "WITHDRAWAL" || type === "SAVINGS_WITHDRAWAL") {
            if (member.totalSavings < val) {
                return new NextResponse(`Insufficient Savings Balance. Current: ${member.totalSavings}`, { status: 400 });
            }
        } else if (type === "SHARE_WITHDRAWAL") {
            if (member.totalShares < val) {
                return new NextResponse(`Insufficient Shares Balance. Current: ${member.totalShares}`, { status: 400 });
            }
        } else if (type === "LOAN_REPAYMENT") {
            // Logic: Cannot pay more than outstanding loan? 
            // Usually we allow overpayment but for now let's strict check against Principal
            // Member totalLoans tracks principal outstanding generally.
            if (member.totalLoans < (parseFloat(principalAmount) || 0)) {
                return new NextResponse(`Repayment principal exceeds outstanding loan. Current: ${member.totalLoans}`, { status: 400 });
            }
        }

        const result = await prisma.$transaction(async (prismaTx: any) => {
            const tx = await prismaTx.transaction.create({
                data: {
                    memberId,
                    type,
                    amount: val,
                    reference,
                    description,
                    interestAmount: interestAmount ? parseFloat(interestAmount) : 0,
                    principalAmount: principalAmount ? parseFloat(principalAmount) : 0,
                    recordedBy: session?.user?.id!
                }
            });

            // UPDATE BALANCES
            if (type === "DEPOSIT" || type === "SAVINGS_DEPOSIT") {
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { totalSavings: { increment: val } }
                });
            } else if (type === "WITHDRAWAL" || type === "SAVINGS_WITHDRAWAL") {
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { totalSavings: { decrement: val } }
                });
            } else if (type === "SHARE_PURCHASE") {
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { totalShares: { increment: val } }
                });
            } else if (type === "SHARE_WITHDRAWAL") {
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { totalShares: { decrement: val } }
                });
            } else if (type === "LOAN_DISBURSAL") {
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { totalLoans: { increment: val } }
                });
            } else if (type === "LOAN_REPAYMENT") {
                const principal = principalAmount ? parseFloat(principalAmount) : val;
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { totalLoans: { decrement: principal } }
                });
            }

            // Re-fetch the member to get its updated state within the transaction
            const updatedMember = await prismaTx.member.findUnique({
                where: { id: memberId }
            });

            return { transaction: tx, member: updatedMember };
        });

        // Log Audit
        try {
            await logAction(
                "CREATE_TRANSACTION",
                "TRANSACTION",
                result.transaction.id,
                {
                    type: result.transaction.type,
                    amount: result.transaction.amount,
                    memberId: result.transaction.memberId
                }
            );
        } catch (e) {
            console.error("Failed to log action:", e);
        }

        return NextResponse.json(result.transaction);
    } catch (e) {
        console.error(e);
        return new NextResponse("Error recording transaction", { status: 500 });
    }
}
