// Comprehensive data migration script - parse all CSV files and create mockData
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'lib', 'migrationData');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to parse CSV
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx]?.trim() || '';
        });
        data.push(row);
    }
    return { headers, data };
}

console.log('=== Comprehensive Data Migration ===\n');

// 1. Parse Members
console.log('1. Parsing member.csv...');
const memberFile = path.join(__dirname, '..', 'member.csv');
const { data: members } = parseCSV(memberFile);
console.log(`   Found ${members.length} members`);

// 2. Parse Transactions (already done, load from JSON)
console.log('2. Loading transactions from previous extraction...');
const transactionsByMember = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'transactionsByMember.json'), 'utf8')
);
const memberStats = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'memberStats.json'), 'utf8')
);
console.log(`   Found ${Object.keys(transactionsByMember).length} members with transactions`);

// 3. Parse Expenses
console.log('3. Parsing expense.csv...');
const expenseFile = path.join(__dirname, '..', 'expense.csv');
let expenses = [];
try {
    const { data } = parseCSV(expenseFile);
    expenses = data;
    console.log(`   Found ${expenses.length} expenses`);
} catch (e) {
    console.log(`   No expense file found or error: ${e.message}`);
}

// 4. Parse Bank Transactions
console.log('4. Parsing bankTransaction.csv...');
const bankTxFile = path.join(__dirname, '..', 'bankTransaction.csv');
let bankTransactions = [];
try {
    const { headers, data } = parseCSV(bankTxFile);
    bankTransactions = data;
    console.log(`   Found ${bankTransactions.length} bank transactions`);
    console.log(`   Headers: ${headers.join(', ')}`);
} catch (e) {
    console.log(`   No bank transaction file found or error: ${e.message}`);
}

// 5. Create merged member data with transactions
console.log('\n5. Creating merged member data...');

const appMembers = members.map(m => {
    const memberId = m.Id;
    const stats = memberStats[memberId] || { savings: 0, shares: 0, loans: 0, interest: 0 };
    const transactions = transactionsByMember[memberId] || [];

    // Parse name - format might be "Rev. David Edem Anyomih"
    const nameParts = (m.Name || '').trim().split(' ');
    let firstName = nameParts[0] || '';
    let lastName = nameParts.slice(1).join(' ') || '';

    return {
        id: memberId,
        firstName: firstName,
        lastName: lastName,
        gender: m.Gender === '1' ? 'MALE' : 'FEMALE',
        dateOfBirth: m.DOB || null,
        accountNumber: m.AccountNumber || `100${String(memberId).padStart(4, '0')}`,
        totalSavings: stats.savings,
        totalShares: stats.shares,
        totalLoans: Math.max(0, stats.loans), // Negative means paid off
        phone: '', // Will need to get from contact
        email: '',
        address: '',
        gps: '',
        beneficiaryName: '',
        beneficiaryRelationship: '',
        beneficiaryAddress: '',
        userId: memberId,
        transactions: transactions
    };
});

console.log(`   Created ${appMembers.length} merged member records`);

// Show sample
console.log('\n=== Sample Member Data ===');
const sample = appMembers.find(m => m.id === '323'); // Roselyn
if (sample) {
    console.log(`Member 323 (Roselyn):`, {
        name: `${sample.firstName} ${sample.lastName}`,
        accountNumber: sample.accountNumber,
        savings: sample.totalSavings,
        shares: sample.totalShares,
        loans: sample.totalLoans,
        transactionCount: sample.transactions.length
    });
}

// 6. Create mockData.ts formatted output
console.log('\n6. Creating mockData format...');

const mockMembersStr = `
export const mockMembers = ${JSON.stringify(appMembers, null, 2)};

export const mockTransactions = [];

export const mockExpenses = ${JSON.stringify(expenses.map(e => ({
    id: e.Id || `exp-${Date.now()}`,
    description: e.Description || e.Narration || '',
    amount: parseFloat(e.Amount) || 0,
    date: e.Date || new Date().toISOString(),
    category: e.Category || 'General',
    recordedBy: e.RecordedBy || 'legacy'
})), null, 2)};

export const mockAuditLogs = [];
`;

// Save individual files
fs.writeFileSync(path.join(outputDir, 'members.json'), JSON.stringify(appMembers, null, 2));
fs.writeFileSync(path.join(outputDir, 'expenses.json'), JSON.stringify(expenses, null, 2));
fs.writeFileSync(path.join(outputDir, 'bankTransactions.json'), JSON.stringify(bankTransactions, null, 2));

// Save mockData template
fs.writeFileSync(path.join(outputDir, 'mockData_template.ts'), mockMembersStr);

console.log('\n=== Files Saved ===');
console.log('- lib/migrationData/members.json');
console.log('- lib/migrationData/expenses.json');
console.log('- lib/migrationData/bankTransactions.json');
console.log('- lib/migrationData/mockData_template.ts');

// Summary
console.log('\n=== Migration Summary ===');
console.log(`Members: ${appMembers.length}`);
console.log(`Members with transactions: ${appMembers.filter(m => m.transactions.length > 0).length}`);
console.log(`Members with loan interest: ${appMembers.filter(m =>
    m.transactions.some(t => t.interestAmount > 0)
).length}`);
console.log(`Total transactions: ${appMembers.reduce((sum, m) => sum + m.transactions.length, 0)}`);
console.log(`Expenses: ${expenses.length}`);
console.log(`Bank Transactions: ${bankTransactions.length}`);
