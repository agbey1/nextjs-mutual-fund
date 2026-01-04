
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/hash";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { memberId, newPassword } = body;

        if (!memberId || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // 1. Find Member to get UserId
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // 2. Hash New Password
        const hashedPassword = hashPassword(newPassword);

        // 3. Update User
        await prisma.user.update({
            where: { id: member.userId },
            data: { password: hashedPassword }
        });

        // 4. Audit
        await logAction("RESET_PASSWORD", "MEMBER", memberId, { resetBy: session.user.id });

        return new NextResponse("Password reset successfully", { status: 200 });

    } catch (e) {
        console.error("Reset Password Error:", e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
