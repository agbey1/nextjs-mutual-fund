// Complete re-migration with proper Excel date parsing
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outputDir = path.join(__dirname, '..', 'lib', 'migrationData');

console.log('=== Complete Data Migration with Correct Dates ===\n');

// Excel serial date to JavaScript Date
function excelDateToJS(serial) {
    if (!serial || typeof serial !== 'number') return new Date();
    // Excel epoch is 1899-12-30, JS epoch is 1970-01-01
    // 25569 is the number of days between Excel epoch and Unix epoch
    const utcDays = serial - 25569;
    const utcValue = utcDays * 86400 * 1000;
    return new Date(utcValue);
}

// 1. Parse Transactions from Excel
console.log('1. Parsing transaction.xlsx...');
const txWb = XLSX.readFile(path.join(__dirname, '..', 'transaction.xlsx'));
const txWs = txWb.Sheets[txWb.SheetNames[0]];
const transactions = XLSX.utils.sheet_to_json(txWs);
console.log(`   Found ${transactions.length} transactions`);

// Sample date check
const sampleTx = transactions[0];
console.log(`   Sample: Date serial ${sampleTx.Date} -> ${excelDateToJS(sampleTx.Date).toISOString()}`);

// 2. Parse Expenses from Excel
console.log('2. Parsing expense.xlsx...');
let expenses = [];
try {
    const expWb = XLSX.readFile(path.join(__dirname, '..', 'expense.xlsx'));
    const expWs = expWb.Sheets[expWb.SheetNames[0]];
    expenses = XLSX.utils.sheet_to_json(expWs);
    console.log(`   Found ${expenses.length} expenses`);
} catch (e) {
    console.log(`   Error: ${e.message}`);
}

// 3. Parse Bank Transactions from Excel
console.log('3. Parsing bankTransaction.xlsx...');
let bankTx = [];
try {
    const bankWb = XLSX.readFile(path.join(__dirname, '..', 'bankTransaction.xlsx'));
    const bankWs = bankWb.Sheets[bankWb.SheetNames[0]];
    bankTx = XLSX.utils.sheet_to_json(bankWs);
    console.log(`   Found ${bankTx.length} bank transactions`);
} catch (e) {
    console.log(`   Error: ${e.message}`);
}

// 4. Load member data
console.log('4. Loading members...');
const membersJson = JSON.parse(fs.readFileSync(path.join(outputDir, 'members.json'), 'utf8'));
console.log(`   Found ${membersJson.length} members`);

// Map TransactionTypeId to app types
const mapTransactionType = (typeId, entryType) => {
    const isCredit = entryType === 'cr';
    switch (String(typeId)) {
        case '1': return isCredit ? 'SAVINGS_DEPOSIT' : 'SAVINGS_WITHDRAWAL';
        case '2': return isCredit ? 'LOAN_DISBURSAL' : 'LOAN_REPAYMENT';
        case '3': return isCredit ? 'SHARE_PURCHASE' : 'SHARE_WITHDRAWAL';
        default: return 'UNKNOWN';
    }
};

// 5. Convert transactions with proper dates
console.log('\n5. Converting transactions with correct dates...');
const appTransactions = transactions.map(tx => ({
    id: `tx-${tx.Id}`,
    memberId: String(tx.MemberId),
    receiptNo: String(tx.ReceiptNumber || ''),
    type: mapTransactionType(tx.TransactionTypeId, tx.EntryType),
    amount: parseFloat(tx.Amount) || 0,
    interestAmount: parseFloat(tx.InterestTotal) || 0,
    principalAmount: parseFloat(tx.Amount) || 0,
    description: mapTransactionType(tx.TransactionTypeId, tx.EntryType).replace(/_/g, ' '),
    date: excelDateToJS(tx.Date).toISOString(),
    entryDate: excelDateToJS(tx.EntryDate).toISOString(),
    recordedBy: 'legacy',
    paymentCompleted: tx.PaymentCompleted === 1,
    isReversal: tx.IsReversal === 1
}));

// Group by member
const transactionsByMember = {};
appTransactions.forEach(tx => {
    if (!transactionsByMember[tx.memberId]) {
        transactionsByMember[tx.memberId] = [];
    }
    transactionsByMember[tx.memberId].push(tx);
});

// 6. Merge transactions into members
console.log('6. Merging transactions into members...');
membersJson.forEach(member => {
    member.transactions = transactionsByMember[member.id] || [];
});

// Show sample with correct dates
console.log('\n=== Sample Transaction with Correct Date ===');
const sampleMember = membersJson.find(m => m.transactions.length > 0);
if (sampleMember && sampleMember.transactions[0]) {
    const t = sampleMember.transactions[0];
    console.log(`Member ${sampleMember.id}: ${t.type} on ${t.date}`);
}

// 7. Write updated mockData.ts
console.log('\n7. Writing mockData.ts...');
const mockDataPath = path.join(__dirname, '..', 'lib', 'mockData.ts');

const mockDataContent = `
export const mockMembers = ${JSON.stringify(membersJson, null, 2)};

export const mockTransactions: any[] = [];

export const mockExpenses: any[] = ${JSON.stringify(expenses.map(e => ({
    id: String(e.Id || Date.now()),
    description: e.Description || e.Narration || '',
    amount: parseFloat(e.Amount) || 0,
    date: e.Date ? excelDateToJS(e.Date).toISOString() : new Date().toISOString(),
    category: e.Category || 'General',
    recordedBy: 'legacy'
})), null, 2)};

export const mockAuditLogs: any[] = [];
`;

fs.writeFileSync(mockDataPath, mockDataContent);
console.log('   ✅ mockData.ts updated with correct dates');

// Summary
console.log('\n=== Migration Complete ===');
console.log(`Members: ${membersJson.length}`);
console.log(`Transactions: ${appTransactions.length}`);
console.log(`Members with transactions: ${Object.keys(transactionsByMember).length}`);
console.log(`Expenses: ${expenses.length}`);
console.log(`Bank Transactions: ${bankTx.length}`);

// Show date range
const dates = appTransactions.map(t => new Date(t.date)).filter(d => !isNaN(d.getTime()));
if (dates.length > 0) {
    dates.sort((a, b) => a - b);
    console.log(`\nDate range: ${dates[0].toLocaleDateString()} to ${dates[dates.length - 1].toLocaleDateString()}`);
}
