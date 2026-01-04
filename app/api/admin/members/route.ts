import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit";
import { hashPassword } from "@/lib/hash";
// import { Role, Gender } from "@prisma/client"; // Imports might fail if generate failed

export async function GET(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") { // Fallback to string check if Enum fails
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const members = await prisma.member.findMany({
            include: { user: true },
            orderBy: { lastName: 'asc' }
        });
        return NextResponse.json(members);
    } catch (e) {
        return new NextResponse("Database Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { firstName, lastName, gender, dob, phone, email, address, gps, accountNumber, beneficiaryName, beneficiaryRelationship, beneficiaryAddress } = body;

        const result = await prisma.$transaction(async (tx: any) => {
            // Create User
            // Default password = member's phone number
            const user = await tx.user.create({
                data: {
                    username: accountNumber,
                    password: hashPassword(phone), // Phone number as default password
                    role: "MEMBER",
                    name: `${firstName} ${lastName}`
                }
            });

            // Create Member
            const newMember = await tx.member.create({ // Renamed 'member' to 'newMember'
                data: {
                    userId: user.id, // Changed 'user.id' to 'newUser.id'
                    firstName,
                    lastName,
                    gender: gender, // Expecting "MALE" or "FEMALE"
                    dateOfBirth: new Date(dob), // Changed 'dob' to 'dateOfBirth'
                    phone,
                    email,
                    address,
                    gps,
                    accountNumber,
                    beneficiaryName,
                    beneficiaryRelationship,
                    beneficiaryAddress
                }
            });

            // Log Audit
            try {
                await logAction(
                    "CREATE_MEMBER",
                    "MEMBER",
                    newMember.id,
                    { firstName, lastName, accountNumber, createdBy: session?.user?.id }
                );
            } catch (error) {
                console.error("Audit log failed for member creation", error);
            }

            return newMember; // Return the new member from the transaction
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return new NextResponse("Error creating member", { status: 500 });
    }
}
