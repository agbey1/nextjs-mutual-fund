const fs = require('fs');
const readline = require('readline');

async function migrate() {
    console.log('Starting All-Migration (Stream Mode - 2 Passes)...');

    // Store members map
    const membersMap = new Map();
    const transactions = [];

    // Counters
    let totalSavingsPool = 0;
    let totalSharesPool = 0;
    let totalLoansOutstanding = 0;
    let totalInterestCollected = 0;

    // Helper to process stream line by line
    async function processLineByLine(pass) {
        const fileStream = fs.createReadStream('d:/projects/mutualfund/roselyn.sql', { encoding: 'ucs2' });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            const trim = line.trim();

            if (pass === 1) {
                // PASS 1: PARSE MEMBERS ONLY
                if (trim.startsWith('INSERT [dbo].[Member]')) {
                    // Match: VALUES (id, N'name', gender, CAST(N'date' AS DateTime2), N'accountNumber')
                    const match = trim.match(/VALUES\s*\((\d+),\s*N'([^']*)',\s*(\d+)/);
                    if (match) {
                        const id = match[1];
                        const name = match[2];
                        const genderId = match[3];

                        // Parse DOB from CAST(N'1980-10-21T00:00:00.0000000' AS DateTime2)
                        const dobMatch = trim.match(/CAST\(N'([^']+)'\s+AS\s+DateTime2\)/);
                        const dob = dobMatch ? new Date(dobMatch[1]).toISOString() : new Date().toISOString();

                        const accMatch = trim.match(/N'(\d+)'\s*\)$/);
                        const acc = accMatch ? accMatch[1] : 'UNKNOWN';

                        const nameParts = name.trim().split(/\s+/);
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || firstName;

                        membersMap.set(id, {
                            id: id,
                            firstName: firstName,
                            lastName: lastName,
                            gender: genderId === '0' ? 'MALE' : 'FEMALE',
                            dateOfBirth: dob,
                            accountNumber: acc,
                            totalSavings: 0,
                            totalShares: 0,
                            totalLoans: 0,
                            phone: '',
                            email: null,
                            address: '',
                            gps: '',
                            beneficiaryName: '',
                            beneficiaryRelationship: '',
                            beneficiaryAddress: '',
                            userId: id,
                            transactions: []
                        });
                    }
                }
            } else {
                // PASS 2: PARSE CONTACTS AND TRANSACTIONS

                // PARSE CONTACTS
                if (trim.startsWith('INSERT [dbo].[Contact]')) {
                    const valContentMatch = trim.match(/VALUES\s*\((.*)\)/);
                    if (valContentMatch) {
                        const valStr = valContentMatch[1];
                        // Regex to match: N'...' OR NULL OR number
                        const fields = [];
                        const fieldRegex = /(?:N'([^']*)'|NULL|(\d+))/g;
                        let match;
                        while ((match = fieldRegex.exec(valStr)) !== null) {
                            if (match[1] !== undefined) fields.push(match[1]);
                            else if (match[2] !== undefined) fields.push(match[2]);
                            else fields.push(null);
                        }

                        // Expected order: Id, Phone, Email, Address, GPS, MemberId, BenefAddress, BenefName, BenefRel
                        // Note: If GPS is NULL, it comes through as null in fields array
                        if (fields.length >= 9) {
                            const phone = fields[1];
                            const email = fields[2];
                            const address = fields[3];
                            const gps = fields[4];
                            const memberId = fields[5];
                            const beneficiaryAddress = fields[6];
                            const beneficiaryName = fields[7];
                            const beneficiaryRelationship = fields[8];

                            const member = membersMap.get(memberId);
                            if (member) {
                                member.phone = phone || '';
                                member.email = email || null;
                                member.address = address || '';
                                member.gps = gps || '';
                                member.beneficiaryName = beneficiaryName || '';
                                member.beneficiaryRelationship = beneficiaryRelationship || '';
                                member.beneficiaryAddress = beneficiaryAddress || '';
                            }
                        }
                    }
                }

                // PARSE TRANSACTIONS
                if (trim.startsWith('INSERT [dbo].[Transaction]')) {
                    const valMatch = trim.match(/VALUES\s*\(\d+,\s*CAST\(([\d.]+)\s+AS\s+Decimal/);
                    const typeMatch = trim.match(/Decimal\(18,\s*2\)\),\s*(\d+),\s*(\d+),\s*CAST/);
                    const dateMatch = trim.match(/CAST\(N'([^']+)'\s+AS\s+DateTime2\)/);
                    const receiptMatch = trim.match(/,\s*N'([^']*)',\s*CAST/);
                    const entryTypeMatch = trim.match(/,\s*N'(cr|dr)'/i);

                    if (valMatch && typeMatch && entryTypeMatch) {
                        const amount = parseFloat(valMatch[1]);
                        const typeId = typeMatch[1];
                        const memberId = typeMatch[2];
                        const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
                        const receipt = receiptMatch ? receiptMatch[1] : '';
                        const entryType = entryTypeMatch[1].toLowerCase();

                        const member = membersMap.get(memberId);
                        if (member) {
                            let type = 'UNKNOWN';
                            let isPlus = false;

                            if (typeId === '1') {
                                if (entryType === 'cr') { type = 'SAVINGS_DEPOSIT'; isPlus = true; member.totalSavings += amount; totalSavingsPool += amount; }
                                else { type = 'SAVINGS_WITHDRAWAL'; member.totalSavings -= amount; totalSavingsPool -= amount; }
                            }
                            else if (typeId === '2') {
                                if (entryType === 'dr') { type = 'LOAN_DISBURSAL'; member.totalLoans += amount; totalLoansOutstanding += amount; }
                                else { type = 'LOAN_REPAYMENT'; isPlus = true; member.totalLoans -= amount; totalLoansOutstanding -= amount; }
                            }
                            else if (typeId === '3') {
                                if (entryType === 'cr') { type = 'SHARE_PURCHASE'; isPlus = true; member.totalShares += amount; totalSharesPool += amount; }
                                else { type = 'SHARE_WITHDRAWAL'; member.totalShares -= amount; totalSharesPool -= amount; }
                            }

                            const tx = {
                                id: Math.random().toString(36).substr(2, 9),
                                memberId: memberId,
                                receiptNo: receipt,
                                type: type,
                                amount: amount,
                                interestAmount: 0,
                                principalAmount: isPlus ? amount : 0,
                                description: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                                date: date,
                                recordedBy: 'seed'
                            };

                            member.transactions.push(tx);
                            transactions.push(tx);
                        }
                    }
                }
            }
        }
    }

    console.log('Running Pass 1: Members...');
    await processLineByLine(1);
    console.log(`Pass 1 Complete: Found ${membersMap.size} members.`);

    console.log('Running Pass 2: Contacts & Transactions...');
    await processLineByLine(2);
    console.log(`Pass 2 Complete: Processed ${transactions.length} transactions.`);

    console.log('Writing mockData.ts...');

    const membersArray = Array.from(membersMap.values());

    const mockExpenses = [
        { id: '1', description: 'Office Rent - Jan', amount: 500, date: '2024-01-15T00:00:00Z', category: 'RENT', recordedBy: 'admin' },
        { id: '2', description: 'Electricity Bill', amount: 120, date: '2024-01-20T00:00:00Z', category: 'UTILITIES', recordedBy: 'admin' },
        { id: '3', description: 'Stationery', amount: 50, date: '2024-02-05T00:00:00Z', category: 'SUPPLIES', recordedBy: 'admin' }
    ];

    const fileContent = `
export const mockMembers = ${JSON.stringify(membersArray, null, 2)};

export const mockTransactions = ${JSON.stringify(transactions, null, 2)};

export const mockExpenses = ${JSON.stringify(mockExpenses, null, 2)};
`;

    fs.writeFileSync('d:/projects/mutualfund/web/lib/mockData.ts', fileContent);
    console.log('Done.');
}

migrate().catch(console.error);
