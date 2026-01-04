
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { memberId } = body;

        // Find user for this member
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return new NextResponse("Member not found", { status: 404 });

        // Update User Role
        // Note: Logic assumes member.userId links to User.id.
        // In Mock, we must find the user by id.
        await prisma.user.update({
            where: { id: member.userId },
            data: { role: 'ADMIN' }
        });

        // Audit
        await logAction("PROMOTE_MEMBER", "MEMBER", memberId, { promotedBy: session.user.id });

        return new NextResponse("Member promoted to Admin", { status: 200 });

    } catch (e) {
        console.error(e);
        return new NextResponse("Error promoting member", { status: 500 });
    }
}
