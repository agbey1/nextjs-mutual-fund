
import prisma from '../lib/prisma';

async function main() {
    console.log("Testing Mock Prisma Create...");

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            console.log("Transaction started");

            // 1. Create User
            const user = await tx.user.create({
                data: {
                    username: 'TEST_ACC_001',
                    password: 'password123',
                    role: 'MEMBER',
                    name: 'Test User'
                }
            });
            console.log("User created:", user);

            if (!user || !user.id) throw new Error("User creation failed or returned no ID");

            // 2. Create Member
            const member = await tx.member.create({
                data: {
                    userId: user.id,
                    firstName: 'Test',
                    lastName: 'User',
                    gender: 'MALE',
                    dateOfBirth: new Date('1990-01-01'),
                    phone: '0244000001',
                    email: 'test@example.com',
                    address: 'Test Address',
                    gps: 'GA-000-00',
                    accountNumber: 'TEST_ACC_001',
                    beneficiaryName: 'Ben',
                    beneficiaryRelationship: 'Friend',
                    beneficiaryAddress: 'Ben Address'
                }
            });
            console.log("Member created:", member);
            return member;
        });

        console.log("Transaction successful:", result);

        // Verify it's in the list
        const allMembers = await prisma.member.findMany({});
        console.log("Total members:", allMembers.length);
        const found = allMembers.find((m: any) => m.accountNumber === 'TEST_ACC_001');
        console.log("Found created member:", found ? "YES" : "NO");

    } catch (error) {
        console.error("TEST FAILED:", error);
    }
}

main();
