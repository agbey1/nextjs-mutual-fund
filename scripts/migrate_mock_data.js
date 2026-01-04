const fs = require('fs');

const sqlPath = 'd:/projects/mutualfund/roselyn.sql';
const outputPath = 'd:/projects/mutualfund/web/lib/mockData.ts';

const content = fs.readFileSync(sqlPath, 'ucs2');
const lines = content.split(/\r?\n/);

const membersMap = new Map();
const transactions = [];

console.log('Parsing SQL with correct business model...');
console.log('TypeId 1 = Savings, TypeId 2 = Loans, TypeId 3 = Shares');

// PASS 1: Parse all members
// Columns: [Id], [Name], [Gender], [DOB], [AccountNumber]
// Gender: 0 = MALE, 1 = FEMALE (based on Rev. David Edem Anyomih having Gender=0)
for (const line of lines) {
    const trim = line.trim();
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
                gender: genderId === '0' ? 'MALE' : 'FEMALE', // 0 = MALE, 1 = FEMALE
                dateOfBirth: dob,
                accountNumber: acc,
                // THREE SEPARATE BALANCES
                totalSavings: 0,   // TypeId 1 - Personal savings account
                totalShares: 0,    // TypeId 3 - Share capital contribution
                totalLoans: 0,     // TypeId 2 - Outstanding loan balance
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
}

console.log('Found ' + membersMap.size + ' members');

// PASS 2: Parse contacts with all fields
// Columns: [Id], [Phone], [Email], [Address], [GPS], [MemberId], [BeneficiaryAddress], [BeneficiaryName], [BeneficiaryRelationship]
for (const line of lines) {
    const trim = line.trim();
    if (trim.startsWith('INSERT [dbo].[Contact]')) {
        // Extract all 9 values from Contact INSERT
        // VALUES (1, N'phone', N'email', N'address', N'gps', memberId, N'benefAddr', N'benefName', N'benefRel')
        const contactMatch = trim.match(/VALUES\s*\(\d+,\s*N'([^']*)',\s*N'([^']*)',\s*N'([^']*)',\s*N'([^']*)',\s*(\d+),\s*N'([^']*)',\s*N'([^']*)',\s*N'([^']*)'\)/);

        if (contactMatch) {
            const phone = contactMatch[1];
            const email = contactMatch[2];
            const address = contactMatch[3];
            const gps = contactMatch[4];
            const memberId = contactMatch[5];
            const beneficiaryAddress = contactMatch[6];
            const beneficiaryName = contactMatch[7];
            const beneficiaryRelationship = contactMatch[8];

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

// PASS 3: Parse transactions with CORRECT business model
// TransactionTypeId: 1=Savings, 2=Loans, 3=Shares
// EntryType: 'cr' = credit (money in to account), 'dr' = debit (money out of account)

for (const line of lines) {
    const trim = line.trim();
    if (trim.startsWith('INSERT [dbo].[Transaction]') && trim.includes('VALUES')) {
        const idMatch = trim.match(/VALUES\s*\((\d+),/);
        const amountMatch = trim.match(/VALUES\s*\(\d+,\s*CAST\(([\d.]+)\s+AS\s+Decimal/);

        const dateMatches = trim.match(/CAST\(N'([^']+)'\s+AS\s+DateTime2\)/g);
        let txDate = new Date().toISOString();
        if (dateMatches && dateMatches.length >= 2) {
            const dateMatch = dateMatches[1].match(/N'([^']+)'/);
            if (dateMatch) {
                txDate = new Date(dateMatch[1]).toISOString();
            }
        }

        const receiptMatch = trim.match(/DateTime2\),\s*N'([^']*)'/);
        const typeAndMemberMatch = trim.match(/Decimal\(18,\s*2\)\),\s*(\d+),\s*(\d+),\s*CAST/);
        const entryTypeMatch = trim.match(/,\s*N'(cr|dr)'/i);

        // Extract InterestTotal from transactions
        const interestMatches = trim.match(/CAST\(([\d.]+)\s+AS\s+Decimal\(18,\s*2\)\)/g);
        let interest = 0;
        if (interestMatches && interestMatches.length >= 2) {
            const intMatch = interestMatches[1].match(/CAST\(([\d.]+)/);
            if (intMatch) interest = parseFloat(intMatch[1]) || 0;
        }

        if (idMatch && amountMatch && typeAndMemberMatch && entryTypeMatch) {
            const id = idMatch[1];
            const amount = parseFloat(amountMatch[1]) || 0;
            const receiptNo = receiptMatch ? receiptMatch[1] : '';
            const typeId = typeAndMemberMatch[1];
            const memberId = typeAndMemberMatch[2];
            const entryType = entryTypeMatch[1].toLowerCase();

            // Correct transaction type mapping
            let type = '';
            let description = '';

            if (typeId === '1') {
                // SAVINGS account (personal savings)
                type = entryType === 'cr' ? 'SAVINGS_DEPOSIT' : 'SAVINGS_WITHDRAWAL';
                description = entryType === 'cr' ? 'Savings Deposit' : 'Savings Withdrawal';
            } else if (typeId === '3') {
                // SHARES account (capital contribution to fund pool)
                type = entryType === 'cr' ? 'SHARE_PURCHASE' : 'SHARE_WITHDRAWAL';
                description = entryType === 'cr' ? 'Share Purchase' : 'Share Redemption';
            } else if (typeId === '2') {
                // LOANS (borrowed from share pool)
                type = entryType === 'dr' ? 'LOAN_DISBURSAL' : 'LOAN_REPAYMENT';
                description = entryType === 'dr' ? 'Loan Disbursement' : 'Loan Repayment';
            }

            const tx = {
                id: id,
                memberId: memberId,
                receiptNo: receiptNo,
                type: type,
                typeId: typeId, // Keep original for reference
                amount: Math.abs(amount),
                interestAmount: interest,
                principalAmount: type === 'LOAN_REPAYMENT' ? Math.abs(amount) - interest : 0,
                description: description,
                date: txDate,
                recordedBy: 'seed'
            };

            transactions.push(tx);

            // Update member balances by TYPE
            const member = membersMap.get(memberId);
            if (member) {
                member.transactions.push(tx);

                // Savings account (TypeId 1)
                if (type === 'SAVINGS_DEPOSIT') member.totalSavings += Math.abs(amount);
                if (type === 'SAVINGS_WITHDRAWAL') member.totalSavings -= Math.abs(amount);

                // Shares account (TypeId 3) 
                if (type === 'SHARE_PURCHASE') member.totalShares += Math.abs(amount);
                if (type === 'SHARE_WITHDRAWAL') member.totalShares -= Math.abs(amount);

                // Loans (TypeId 2)
                if (type === 'LOAN_DISBURSAL') member.totalLoans += Math.abs(amount);
                if (type === 'LOAN_REPAYMENT') member.totalLoans -= Math.abs(amount);
            }
        }
    }
}

const members = Array.from(membersMap.values());
console.log('Generated ' + members.length + ' members and ' + transactions.length + ' transactions.');
console.log('Members with transactions: ' + members.filter(m => m.transactions.length > 0).length);

// Calculate totals
let totalSavingsPool = 0;
let totalSharesPool = 0;
let totalLoansOutstanding = 0;
let totalInterestCollected = 0;

members.forEach(m => {
    m.totalSavings = Math.round(m.totalSavings * 100) / 100;
    m.totalShares = Math.round(m.totalShares * 100) / 100;
    m.totalLoans = Math.round(m.totalLoans * 100) / 100;
    totalSavingsPool += m.totalSavings;
    totalSharesPool += m.totalShares;
    totalLoansOutstanding += m.totalLoans;
    m.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

// Calculate interest from loan repayments
totalInterestCollected = transactions
    .filter(t => t.type === 'LOAN_REPAYMENT')
    .reduce((sum, t) => sum + (t.interestAmount || 0), 0);

transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

console.log('\n=== FUND SUMMARY ===');
console.log('Total Savings Pool: GH₵ ' + totalSavingsPool.toFixed(2));
console.log('Total Shares Pool: GH₵ ' + totalSharesPool.toFixed(2));
console.log('Outstanding Loans: GH₵ ' + totalLoansOutstanding.toFixed(2));
console.log('Interest Collected: GH₵ ' + totalInterestCollected.toFixed(2));

// Sample expenses for testing
const mockExpenses = [
    { id: 'exp1', amount: 150.00, description: 'Office supplies', category: 'Operational', date: '2024-01-15', recordedBy: 'admin' },
    { id: 'exp2', amount: 500.00, description: 'Annual audit fee', category: 'Administrative', date: '2024-02-20', recordedBy: 'admin' },
    { id: 'exp3', amount: 75.00, description: 'Bank charges', category: 'Operational', date: '2024-03-05', recordedBy: 'admin' }
];

const fileContent = 'export const mockMembers = ' + JSON.stringify(members, null, 2) + ';\n' +
    'export const mockTransactions = ' + JSON.stringify(transactions, null, 2) + ';\n' +
    'export const mockExpenses = ' + JSON.stringify(mockExpenses, null, 2) + ';';

fs.writeFileSync(outputPath, fileContent);
console.log('\nData written to ' + outputPath);

// Sample output
const memberWithTx = members.find(m => m.transactions.length > 0);
if (memberWithTx) {
    console.log('\n=== SAMPLE MEMBER ===');
    console.log('Name:', memberWithTx.firstName, memberWithTx.lastName);
    console.log('Savings: GH₵', memberWithTx.totalSavings);
    console.log('Shares: GH₵', memberWithTx.totalShares);
    console.log('Loans: GH₵', memberWithTx.totalLoans);
    console.log('# Transactions:', memberWithTx.transactions.length);
}
