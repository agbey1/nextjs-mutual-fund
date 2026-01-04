// Extract loan transactions with InterestTotal from roselyn.sql
const fs = require('fs');

const sqlPath = 'D:\\projects\\mutualfund\\roselyn.sql';
const sqlContent = fs.readFileSync(sqlPath, 'utf16le');

console.log('=== Extracting Loan Transactions with InterestTotal ===\n');

// Based on user's sample:
// Id, Amount, EntryDate, Date, ReceiptNumber, PaymentTotal, TransactionTypeId, MemberId, InterestTotal, PaymentCompleted, EntryType, IsReversal, ReversedBy
// TransactionTypeId: 1=Savings, 2=Loans, 3=Shares

// Search for INSERT patterns that look like loan transactions (TypeId=2) with InterestTotal
// Pattern: number, 2, memberId, non-zero InterestTotal

const loanTransactions = [];

// Look for patterns like: CAST(5000.0000 AS Decimal...), ... 2, 323, CAST(400.00 AS Decimal
const loanPattern = /CAST\((\d+\.?\d*)\s+AS\s+Decimal[^)]+\)[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,\s*2,\s*(\d+),\s*CAST\((\d+\.?\d*)\s+AS\s+Decimal/gi;

let match;
while ((match = loanPattern.exec(sqlContent)) !== null) {
    const amount = parseFloat(match[1]);
    const memberId = match[2];
    const interestTotal = parseFloat(match[3]);

    if (amount > 0) {
        loanTransactions.push({
            memberId,
            amount,
            interestTotal,
            type: 'LOAN_DISBURSAL'
        });
    }
}

console.log(`Found ${loanTransactions.length} potential loan transactions\n`);

// Also try a simpler pattern looking for , 2, (memberId), (interest)
const simplePattern = /,\s*2,\s*(\d+),\s*CAST\((\d+\.?\d*)/gi;
const simpleLoanData = [];

while ((match = simplePattern.exec(sqlContent)) !== null) {
    simpleLoanData.push({
        memberId: match[1],
        interestTotal: parseFloat(match[2])
    });
}

console.log(`Simple pattern found ${simpleLoanData.length} entries`);
console.log('\nSample entries with non-zero interest:');
simpleLoanData.filter(d => d.interestTotal > 0).slice(0, 10).forEach((d, i) => {
    console.log(`  ${i + 1}. MemberId: ${d.memberId}, InterestTotal: ${d.interestTotal}`);
});

// Extract all unique members with their total interest
const memberInterest = {};
simpleLoanData.forEach(d => {
    if (d.interestTotal > 0) {
        if (!memberInterest[d.memberId]) {
            memberInterest[d.memberId] = 0;
        }
        memberInterest[d.memberId] += d.interestTotal;
    }
});

console.log('\n\nMembers with loan interest:');
Object.entries(memberInterest).forEach(([memberId, total]) => {
    console.log(`  MemberId: ${memberId}, Total Interest: ${total}`);
});

// Save to file
const outputPath = 'D:\\projects\\mutualfund\\web\\lib\\memberLoanInterest.json';
fs.writeFileSync(outputPath, JSON.stringify(memberInterest, null, 2));
console.log(`\nSaved to ${outputPath}`);
