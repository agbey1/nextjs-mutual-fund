import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const member = await prisma.member.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        return NextResponse.json(member);
    } catch (e) {
        console.error("Error fetching member:", e);
        return new NextResponse("Database Error", { status: 500 });
    }
}
