
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyPassword, hashPassword } from "@/lib/hash";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // 1. Get User
        // Note: In real app we might fetch by ID from session.
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. Verify Current Password
        if (!verifyPassword(currentPassword, user.password)) {
            return new NextResponse("Invalid current password", { status: 403 });
        }

        // 3. Hash New Password
        const hashedPassword = hashPassword(newPassword);

        // 4. Update User
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        // 5. Audit
        await logAction("CHANGE_PASSWORD", "USER", session.user.id, { userId: session.user.id });

        return new NextResponse("Password changed successfully", { status: 200 });

    } catch (e) {
        console.error("Change Password Error:", e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
