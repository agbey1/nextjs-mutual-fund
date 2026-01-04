
import { auth } from "@/lib/auth";
import prisma from "./prisma";

export async function logAction(
    action: string,
    entityType: string,
    entityId: string,
    details: any
) {
    try {
        const session = await auth();
        const userId = session?.user?.id || 'system';

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: JSON.stringify(details),
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
