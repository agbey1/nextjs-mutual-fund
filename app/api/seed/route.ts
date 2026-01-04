
import prisma from "@/lib/prisma";
import { mockMembers, mockTransactions, mockExpenses } from "@/lib/mockData";
import { hashPassword } from "@/lib/hash";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse("Seeding disabled in production", { status: 403 });
    }

    try {
        // 1. Seed Admin
        const adminPassword = hashPassword('admin');
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                username: 'admin',
                password: adminPassword,
                name: 'Admin',
                role: 'ADMIN'
            }
        });

        // 2. Seed Members & Users
        for (const m of mockMembers) {
            // Create User
            const user = await prisma.user.upsert({
                where: { username: m.accountNumber },
                update: {},
                create: {
                    id: m.userId,
                    username: m.accountNumber,
                    password: hashPassword('password'),
                    role: 'MEMBER',
                    name: `${m.firstName} ${m.lastName}`
                }
            });

            // Create Member
            // Format dates
            const dob = new Date(m.dateOfBirth || "1990-01-01");

            await prisma.member.upsert({
                where: { accountNumber: m.accountNumber },
                update: {},
                create: {
                    id: m.id,
                    userId: user.id,
                    firstName: m.firstName,
                    lastName: m.lastName,
                    gender: m.gender || "MALE",
                    dateOfBirth: dob,
                    phone: m.phone,
                    email: m.email,
                    address: m.address,
                    accountNumber: m.accountNumber,
                    totalSavings: m.totalSavings || 0,
                    totalLoans: m.totalLoans || 0,
                }
            });
        }

        // 3. Seed Transactions
        // Batch create might fail if IDs conflict or relations missing, so we use loop or createMany
        // SQLite supports createMany
        if ((await prisma.transaction.count()) === 0) {
            await prisma.transaction.createMany({
                data: mockTransactions.map((t: any) => ({
                    // id: t.id, // Let DB generate ID or use mock ID if valid CUID
                    // mock IDs are "tx-..." which might not match CUID format if strict.
                    // Schema uses @default(cuid()).
                    // We can reuse ID if string.
                    memberId: t.memberId,
                    type: t.type,
                    amount: t.amount,
                    date: new Date(t.date),
                    description: t.description,
                    reference: t.reference || null,
                    recordedBy: t.recordedBy || null
                }))
            });
        }

        // 4. Seed Expenses
        if ((await prisma.expense.count()) === 0) {
            await prisma.expense.createMany({
                data: mockExpenses.map((e: any) => ({
                    amount: e.amount,
                    description: e.description,
                    category: e.category,
                    date: new Date(e.date),
                    recordedBy: e.recordedBy || null
                }))
            });
        }

        return new NextResponse("Seeding Completed", { status: 200 });

    } catch (e) {
        console.error("Seeding Error:", e);
        return new NextResponse("Seeding Failed: " + (e as Error).message, { status: 500 });
    }
}
