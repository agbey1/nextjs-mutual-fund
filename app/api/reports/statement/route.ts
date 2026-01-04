
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId");

        if (!memberId) {
            return new NextResponse("Member ID required", { status: 400 });
        }

        // Members can only get their own statement
        if (session.user.role === "MEMBER" && session.user.memberId !== memberId) {
            return new NextResponse("Access denied", { status: 403 });
        }

        // Get member data
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: {
                transactions: {
                    orderBy: { date: "desc" }
                }
            }
        });

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // Return statement data (client will generate PDF)
        return NextResponse.json({
            member: {
                accountNumber: member.accountNumber,
                name: `${member.firstName} ${member.lastName}`,
                phone: member.phone,
                email: member.email,
                address: member.address,
                totalSavings: member.totalSavings,
                totalShares: member.totalShares,
                totalLoans: member.totalLoans,
                beneficiaryName: member.beneficiaryName
            },
            transactions: member.transactions.map((tx: any) => ({
                date: tx.date,
                type: tx.type,
                amount: tx.amount,
                principalAmount: tx.principalAmount || tx.amount,
                interestAmount: tx.interestAmount || 0,
                description: tx.description,
                reference: tx.reference || tx.receiptNo
            })),
            generatedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Statement error:", e);
        return new NextResponse("Error generating statement", { status: 500 });
    }
}
