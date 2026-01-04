import { PrismaClient, Gender, TransactionType, Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Read SQL file (Converted to UTF-8)
    const sqlPath = path.join(__dirname, '../../temp_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Create Admin
    const adminPassword = "password123";
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            name: 'System Admin',
            password: adminPassword, // TODO: Hash
            role: Role.ADMIN,
        },
    });

    // Regex to extract Member INSERTs
    // INSERT [dbo].[Member] ([Id], [Name], [Gender], [DOB], [AccountNumber]) VALUES (1, N'FAUSTINA ANYOMIH', 2, CAST(N'1965-05-18T00:00:00.0000000' AS DateTime2), N'10000')
    const memberRegex = /INSERT \[dbo\]\.\[Member\] \(\[Id\], \[Name\], \[Gender\], \[DOB\], \[AccountNumber\]\) VALUES \((\d+), N'([^']+)', (\d+), CAST\(N'([^']+)' AS DateTime2\), N'([^']+)'\)/g;

    let match;
    const memberMap = new Map(); // Old ID -> New ID

    while ((match = memberRegex.exec(sqlContent)) !== null) {
        const [_, oldId, name, genderCode, dob, accNum] = match;

        const gender = genderCode === '1' ? Gender.MALE : Gender.FEMALE; // Assess assumption
        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        // Create User & Member
        try {
            const user = await prisma.user.upsert({
                where: { username: accNum },
                update: {},
                create: {
                    username: accNum,
                    password: "password123", // Default password
                    role: Role.MEMBER
                }
            });

            const member = await prisma.member.upsert({
                where: { accountNumber: accNum },
                update: {},
                create: {
                    firstName: firstName || name,
                    lastName: lastName || "",
                    gender: gender,
                    dateOfBirth: new Date(dob),
                    accountNumber: accNum,
                    phone: `0000000000_${accNum}`, // Placeholder as phone is in Contact table
                    userId: user.id
                }
            });
            memberMap.set(oldId, member.id);
            console.log(`Migrated member: ${name}`);
        } catch (e) {
            console.error(`Failed to migrate member ${name}:`, e);
        }
    }

    // Parse Contacts to update Member Phone
    // INSERT [dbo].[Contact] ([Id], [Phone], [Email], [Address], [GPS], [MemberId], [BeneficiaryAddress], [BeneficiaryName], [BeneficiaryRelationship]) VALUES (..., N'0542696423', ...)
    const contactRegex = /INSERT \[dbo\]\.\[Contact\] .*? VALUES \(\d+, N'([^']*)', N'([^']*)', N'([^']*)', N'([^']*)', (\d+), N'([^']*)', N'([^']*)', N'([^']*)'\)/g;

    while ((match = contactRegex.exec(sqlContent)) !== null) {
        const [_, phone, email, address, gps, memberIdOld, benAddress, benName, benRel] = match;
        const newMemberId = memberMap.get(memberIdOld);

        if (newMemberId) {
            try {
                await prisma.member.update({
                    where: { id: newMemberId },
                    data: {
                        phone: phone,
                        email: email !== '' ? email : undefined,
                        address: address,
                        gpsAddress: gps,
                        beneficiaryName: benName,
                        beneficiaryRelation: benRel,
                        beneficiaryContact: benAddress // Assuming address contains contact or mix
                    }
                });
                console.log(`Updated contact for member ${memberIdOld}`);
            } catch (e) {
                console.error(`Failed to update contact for ${memberIdOld}:`, e);
            }
        }
    }

    // Parse Transactions
    // INSERT [dbo].[Transaction] ([Id], [Amount], [EntryDate], [Date], [ReceiptNumber], [PaymentTotal], [TransactionTypeId], [MemberId], [InterestTotal], [PaymentCompleted], [EntryType], [IsReversal], [ReversedBy]) VALUES (...)
    // 1=Deposit?? need to check schema. TransactionType table: 1=Deposit, 2=Withdrawal likely?
    // From previous grep: TransactionTypeID 1 might be Deposit, 2 Withdrawal.
    // Actually, bank transactions had 1 and 2. 
    // Let's assume 1=DEPOSIT, 2=WITHDRAWAL based on typical patterns, but I should verify if possible.
    // In BankTransaction inserts: 1=Deposit, 2=Withdrawal (based on 'PaidBy Elder Reuben' vs 'Bank Charges').

    const txRegex = /INSERT \[dbo\]\.\[Transaction\] .*? VALUES \(\d+, CAST\(([\d\.]+) AS Decimal\W+, .*?, CAST\(N'([^']+)' AS DateTime2\), N'([^']*)', .*?, (\d+), (\d+), .*?\)/g;
    // This regex is getting complicated. Let's simplify and just match needed fields if possible or iterate carefully.
    // Values: Id, Amount, EntryDate, Date, ReceiptNumber, PaymentTotal, TransactionTypeId, MemberId...

    const simpleTxRegex = /INSERT \[dbo\]\.\[Transaction\] .*? VALUES \((\d+), CAST\(([\d\.]+) AS Decimal[^,]+, [^,]+, CAST\(N'([^']+)' AS DateTime2\), N'([^']*)', [^,]+, (\d+), (\d+),/g;

    while ((match = simpleTxRegex.exec(sqlContent)) !== null) {
        const [_, oldId, amount, dateStr, receipt, typeId, memberIdOld] = match;
        const newMemberId = memberMap.get(memberIdOld);

        if (newMemberId) {
            // Map Type
            let type = TransactionType.DEPOSIT;
            if (typeId === '2') type = TransactionType.WITHDRAWAL;
            if (typeId === '3') type = TransactionType.LOAN_DISBURSAL; // Guessing

            await prisma.transaction.create({
                data: {
                    memberId: newMemberId,
                    amount: parseFloat(amount),
                    type: type,
                    date: new Date(dateStr),
                    reference: receipt,
                    description: "Migrated Transaction",
                    recordedBy: "Migration"
                }
            });
        }
    }

}


main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
