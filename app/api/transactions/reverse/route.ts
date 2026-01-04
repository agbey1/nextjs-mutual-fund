
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { transactionId, reason } = body;

        const originalTx = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!originalTx) return new NextResponse("Transaction not found", { status: 404 });

        // Determine Reversal Type
        let reversalType = "";
        let balanceField = "";
        let multiplier = 0; // 1 for increment, -1 for decrement logic on balance

        switch (originalTx.type) {
            case "DEPOSIT":
                reversalType = "WITHDRAWAL";
                balanceField = "totalSavings";
                multiplier = -1; // Reduce savings
                break;
            case "SAVINGS_DEPOSIT":
                reversalType = "SAVINGS_WITHDRAWAL";
                balanceField = "totalSavings";
                multiplier = -1;
                break;
            case "WITHDRAWAL":
                reversalType = "DEPOSIT";
                balanceField = "totalSavings";
                multiplier = 1; // Increase savings (put it back)
                break;
            case "SAVINGS_WITHDRAWAL":
                reversalType = "SAVINGS_DEPOSIT";
                balanceField = "totalSavings";
                multiplier = 1;
                break;
            case "SHARE_PURCHASE":
                reversalType = "SHARE_WITHDRAWAL";
                balanceField = "totalShares";
                multiplier = -1;
                break;
            case "SHARE_WITHDRAWAL":
                reversalType = "SHARE_PURCHASE";
                balanceField = "totalShares";
                multiplier = 1;
                break;
            case "LOAN_DISBURSAL":
                reversalType = "LOAN_REPAYMENT"; // Or specialized type REVERSAL
                balanceField = "totalLoans";
                multiplier = -1; // Reduce loan debt (they didn't take it)
                break;
            case "LOAN_REPAYMENT":
                reversalType = "LOAN_DISBURSAL";
                balanceField = "totalLoans";
                multiplier = 1; // Increase loan debt (payment executed by mistake)
                break;
            default:
                return new NextResponse("Unsupported transaction type for reversal", { status: 400 });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // Create Reversal Transaction
            const reversalTx = await tx.transaction.create({
                data: {
                    memberId: originalTx.memberId,
                    type: reversalType, // Could use specific 'REVERSAL' type if schema permits, but using counter-type
                    amount: originalTx.amount,
                    reference: `REV-${originalTx.id}`,
                    description: `Reversal: ${reason} (Ref #${originalTx.id})`,
                    interestAmount: 0,
                    principalAmount: originalTx.principalAmount || 0,
                    recordedBy: session?.user?.id!
                }
            });

            // Update Member Balance
            if (multiplier !== 0 && balanceField) {
                await tx.member.update({
                    where: { id: originalTx.memberId },
                    data: {
                        [balanceField]: multiplier === 1 ? { increment: originalTx.amount } : { decrement: originalTx.amount }
                    }
                });
            }

            return reversalTx;
        });

        // Audit Log
        try {
            await logAction(
                "REVERSE_TRANSACTION",
                "TRANSACTION",
                result.id,
                { originalTransactionId: originalTx.id, reason }
            );
        } catch (e) {
            console.error("Failed audit log", e);
        }

        return NextResponse.json(result);

    } catch (e) {
        console.error(e);
        return new NextResponse("Error processing reversal", { status: 500 });
    }
}
