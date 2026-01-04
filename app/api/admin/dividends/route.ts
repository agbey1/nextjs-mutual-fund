
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

// GET: Get distribution history
export async function GET(req: Request) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const distributions = await prisma.dividendDistribution.findMany({});
        return NextResponse.json(distributions);
    } catch (e) {
        console.error("Error fetching distributions:", e);
        return new NextResponse("Error fetching distributions", { status: 500 });
    }
}

// POST: Calculate or execute dividend distribution
export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, totalAmount, year, distributionMethod } = body;

        if (action === "preview") {
            // Calculate preview - how much each member would receive
            const members = await prisma.member.findMany({});

            // Calculate total shares across all members
            const totalShares = members.reduce((sum: number, m: any) => sum + (m.totalShares || 0), 0);

            if (totalShares === 0) {
                return NextResponse.json({
                    error: "No shares found. Members need shares to receive dividends.",
                    preview: []
                });
            }

            // Calculate distribution per member based on their share percentage
            const preview = members.map((m: any) => {
                const sharePercentage = (m.totalShares || 0) / totalShares;
                const dividendAmount = totalAmount * sharePercentage;
                return {
                    memberId: m.id,
                    memberName: `${m.firstName} ${m.lastName}`,
                    accountNumber: m.accountNumber,
                    shares: m.totalShares || 0,
                    sharePercentage: (sharePercentage * 100).toFixed(2),
                    dividendAmount: Math.round(dividendAmount * 100) / 100
                };
            }).filter((m: any) => m.shares > 0);

            return NextResponse.json({
                totalAmount,
                totalShares,
                totalMembers: preview.length,
                preview,
                year
            });
        }

        if (action === "execute") {
            // Execute the distribution
            const members = await prisma.member.findMany({});
            const totalShares = members.reduce((sum: number, m: any) => sum + (m.totalShares || 0), 0);

            if (totalShares === 0) {
                return new NextResponse("No shares to distribute to", { status: 400 });
            }

            const distributions: any[] = [];

            // Create transactions for each member
            for (const member of members) {
                if ((member as any).totalShares > 0) {
                    const sharePercentage = ((member as any).totalShares || 0) / totalShares;
                    const dividendAmount = Math.round(totalAmount * sharePercentage * 100) / 100;

                    if (dividendAmount > 0) {
                        // Create dividend transaction
                        await prisma.transaction.create({
                            data: {
                                memberId: (member as any).id,
                                type: "DIVIDEND",
                                amount: dividendAmount,
                                description: `Dividend Distribution - Year ${year}`,
                                reference: `DIV-${year}-${(member as any).accountNumber}`,
                                recordedBy: session.user.id
                            }
                        });

                        // Update member savings
                        await prisma.member.update({
                            where: { id: (member as any).id },
                            data: {
                                totalSavings: ((member as any).totalSavings || 0) + dividendAmount
                            }
                        });

                        distributions.push({
                            memberId: (member as any).id,
                            memberName: `${(member as any).firstName} ${(member as any).lastName}`,
                            amount: dividendAmount
                        });
                    }
                }
            }

            // Record the distribution
            await prisma.dividendDistribution.create({
                data: {
                    year,
                    totalAmount,
                    totalMembers: distributions.length,
                    distributionMethod: distributionMethod || "SHARE_BASED",
                    executedBy: session.user.id
                }
            });

            // Audit log
            await logAction("DIVIDEND_DISTRIBUTED", "DIVIDEND", `${year}`, {
                totalAmount,
                memberCount: distributions.length,
                executedBy: session.user.id
            });

            return NextResponse.json({
                success: true,
                year,
                totalAmount,
                membersReceived: distributions.length,
                distributions
            });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (e) {
        console.error("Dividend error:", e);
        return new NextResponse("Error processing dividend", { status: 500 });
    }
}
