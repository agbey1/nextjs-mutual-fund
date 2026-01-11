
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
    const id = process.argv[2];
    if (!id) console.log("No ID provided");
    const member = await prisma.member.findUnique({ where: { id } });
    if (member) {
        console.log(`FOUND MEMBER: ${member.firstName} ${member.lastName} (Account: ${member.accountNumber})`);
    } else {
        console.log("Member not found");
    }
}
main();
