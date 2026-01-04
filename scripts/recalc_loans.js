// Script to recalculate member loan balances with interest
const fs = require('fs');
const path = require('path');

console.log('=== Recalculating Loan Balances with Interest ===\n');

const mockDataPath = path.join(__dirname, '..', 'lib', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf8');

// Parse members
const membersMatch = content.match(/export const mockMembers = (\[[\s\S]*?\]);/);
if (!membersMatch) {
    console.error('Could not parse mockMembers');
    process.exit(1);
}

const members = JSON.parse(membersMatch[1]);
console.log(`Found ${members.length} members`);

// Recalculate balances from transactions
members.forEach(member => {
    let savings = 0, shares = 0, loans = 0;

    (member.transactions || []).forEach(tx => {
        const principal = tx.principalAmount || tx.amount || 0;
        const interest = tx.interestAmount || 0;

        switch (tx.type) {
            case 'SAVINGS_DEPOSIT':
                savings += principal;
                break;
            case 'SAVINGS_WITHDRAWAL':
                savings -= principal;
                break;
            case 'SHARE_PURCHASE':
                shares += principal;
                break;
            case 'SHARE_WITHDRAWAL':
                shares -= principal;
                break;
            case 'LOAN_DISBURSAL':
                // Loan balance = principal + interest
                loans += principal + interest;
                break;
            case 'LOAN_REPAYMENT':
                loans -= principal + interest;
                break;
        }
    });

    member.totalSavings = savings;
    member.totalShares = shares;
    member.totalLoans = Math.max(0, loans); // Can't be negative
});

// Show sample with loan interest
const membersWithLoans = members.filter(m => m.totalLoans > 0);
console.log(`\nMembers with loan balances: ${membersWithLoans.length}`);
membersWithLoans.slice(0, 10).forEach(m => {
    console.log(`  ${m.accountNumber}: Loan Balance = GH₵${m.totalLoans}`);
});

// Write back
const updatedContent = content.replace(
    /export const mockMembers = \[[\s\S]*?\];/,
    `export const mockMembers = ${JSON.stringify(members, null, 2)};`
);

fs.writeFileSync(mockDataPath, updatedContent);
console.log('\n✅ Loan balances updated (principal + interest)');
