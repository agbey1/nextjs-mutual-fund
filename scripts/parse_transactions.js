// Script to parse transaction.csv and convert to app format
const fs = require('fs');
const path = require('path');

// Read CSV
const csvPath = path.join(__dirname, '..', 'transaction.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());
console.log('Headers:', headers);
console.log('Total rows:', lines.length - 1);

// Parse each row
const transactions = [];
for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const tx = {};
    headers.forEach((h, idx) => {
        tx[h] = values[idx]?.trim() || '';
    });
    transactions.push(tx);
}

// Map TransactionTypeId to app types
// 1=Savings, 2=Loans, 3=Shares
// EntryType: cr=credit (deposit), dr=debit (withdrawal)
const mapTransactionType = (typeId, entryType) => {
    const isCredit = entryType === 'cr';
    switch (typeId) {
        case '1': return isCredit ? 'SAVINGS_DEPOSIT' : 'SAVINGS_WITHDRAWAL';
        case '2': return isCredit ? 'LOAN_DISBURSAL' : 'LOAN_REPAYMENT';
        case '3': return isCredit ? 'SHARE_PURCHASE' : 'SHARE_WITHDRAWAL';
        default: return 'UNKNOWN';
    }
};

// Convert to app format
const appTransactions = transactions.map(tx => {
    let dateStr = tx.Date;
    let parsedDate;
    try {
        parsedDate = dateStr ? new Date(dateStr) : new Date();
        // Check if date is valid
        if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date(); // Default to now if invalid
        }
    } catch (e) {
        parsedDate = new Date();
    }

    return {
        id: `tx-${tx.Id}`,
        memberId: tx.MemberId,
        receiptNo: tx.ReceiptNumber,
        type: mapTransactionType(tx.TransactionTypeId, tx.EntryType),
        amount: parseFloat(tx.Amount) || 0,
        interestAmount: parseFloat(tx.InterestTotal) || 0,
        principalAmount: parseFloat(tx.Amount) || 0,
        description: `${mapTransactionType(tx.TransactionTypeId, tx.EntryType).replace(/_/g, ' ')}`,
        date: parsedDate.toISOString(),
        recordedBy: 'legacy',
        paymentCompleted: tx.PaymentCompleted === '1',
        isReversal: tx.IsReversal === '1'
    };
});

// Group by MemberId
const transactionsByMember = {};
appTransactions.forEach(tx => {
    if (!transactionsByMember[tx.memberId]) {
        transactionsByMember[tx.memberId] = [];
    }
    transactionsByMember[tx.memberId].push(tx);
});

// Calculate totals per member
const memberStats = {};
Object.entries(transactionsByMember).forEach(([memberId, txs]) => {
    let savings = 0, shares = 0, loans = 0, interest = 0;
    txs.forEach(tx => {
        if (tx.type.includes('SAVINGS_DEPOSIT')) savings += tx.amount;
        if (tx.type.includes('SAVINGS_WITHDRAWAL')) savings -= tx.amount;
        if (tx.type.includes('SHARE_PURCHASE')) shares += tx.amount;
        if (tx.type.includes('SHARE_WITHDRAWAL')) shares -= tx.amount;
        if (tx.type === 'LOAN_DISBURSAL') loans += tx.amount;
        if (tx.type === 'LOAN_REPAYMENT') loans -= tx.amount;
        if (tx.interestAmount > 0) interest += tx.interestAmount;
    });
    memberStats[memberId] = { savings, shares, loans, interest, transactionCount: txs.length };
});

console.log('\n=== Transaction Summary ===');
console.log('Unique members:', Object.keys(transactionsByMember).length);
console.log('Total transactions:', appTransactions.length);

// Show members with interest
console.log('\n=== Members with Loan Interest ===');
Object.entries(memberStats)
    .filter(([_, stats]) => stats.interest > 0)
    .forEach(([memberId, stats]) => {
        console.log(`  Member ${memberId}: Interest=${stats.interest}, Loans=${stats.loans}`);
    });

// Output files
const outputDir = path.join(__dirname, '..', 'lib', 'migrationData');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
    path.join(outputDir, 'transactions.json'),
    JSON.stringify(appTransactions, null, 2)
);

fs.writeFileSync(
    path.join(outputDir, 'transactionsByMember.json'),
    JSON.stringify(transactionsByMember, null, 2)
);

fs.writeFileSync(
    path.join(outputDir, 'memberStats.json'),
    JSON.stringify(memberStats, null, 2)
);

console.log('\n=== Files saved to lib/migrationData/ ===');
console.log('- transactions.json');
console.log('- transactionsByMember.json');
console.log('- memberStats.json');
