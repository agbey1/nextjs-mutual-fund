const fs = require('fs');

const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

console.log('=== TRANSACTION TYPE ANALYSIS ===\n');

const typeCounts = {
    'TypeId_1_cr': 0, 'TypeId_1_dr': 0,
    'TypeId_2_cr': 0, 'TypeId_2_dr': 0,
    'TypeId_3_cr': 0, 'TypeId_3_dr': 0,
    'other': 0
};

const samplesByType = {};

for (const line of lines) {
    const trim = line.trim();
    if (trim.startsWith('INSERT [dbo].[Transaction]') && trim.includes('VALUES')) {
        // Extract TypeId and MemberId
        const typeAndMemberMatch = trim.match(/Decimal\(18,\s*2\)\),\s*(\d+),\s*(\d+),\s*CAST/);
        const entryTypeMatch = trim.match(/,\s*N'(cr|dr)'/i);

        if (typeAndMemberMatch && entryTypeMatch) {
            const typeId = typeAndMemberMatch[1];
            const entryType = entryTypeMatch[1].toLowerCase();
            const key = `TypeId_${typeId}_${entryType}`;

            if (typeCounts[key] !== undefined) {
                typeCounts[key]++;

                // Capture first 2 samples of each type
                if (!samplesByType[key]) samplesByType[key] = [];
                if (samplesByType[key].length < 2) {
                    // Extract amount and date for sample
                    const amountMatch = trim.match(/CAST\(([\d.]+)\s+AS\s+Decimal\(12/);
                    const dateMatches = trim.match(/CAST\(N'([^']+)'\s+AS\s+DateTime2\)/g);
                    let txDate = 'Unknown';
                    if (dateMatches && dateMatches.length >= 2) {
                        const dm = dateMatches[1].match(/N'([^']+)'/);
                        if (dm) txDate = dm[1].split('T')[0];
                    }
                    samplesByType[key].push({
                        amount: amountMatch ? amountMatch[1] : 'Unknown',
                        date: txDate,
                        memberId: typeAndMemberMatch[2]
                    });
                }
            } else {
                typeCounts['other']++;
            }
        }
    }
}

console.log('Transaction Counts by Type:');
console.log('TypeId 1 (Savings) - Credit (deposit):', typeCounts['TypeId_1_cr']);
console.log('TypeId 1 (Savings) - Debit (withdrawal):', typeCounts['TypeId_1_dr']);
console.log('TypeId 2 (Loans) - Credit (repayment):', typeCounts['TypeId_2_cr']);
console.log('TypeId 2 (Loans) - Debit (disbursal):', typeCounts['TypeId_2_dr']);
console.log('TypeId 3 (Shares) - Credit (purchase):', typeCounts['TypeId_3_cr']);
console.log('TypeId 3 (Shares) - Debit (withdrawal):', typeCounts['TypeId_3_dr']);
console.log('Other:', typeCounts['other']);

console.log('\n=== SAMPLES OF EACH TYPE ===');
for (const [key, samples] of Object.entries(samplesByType)) {
    console.log('\n' + key + ':');
    samples.forEach((s, i) => console.log(`  ${i + 1}. Amount: ${s.amount}, Date: ${s.date}, MemberId: ${s.memberId}`));
}

// Total
const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
console.log('\n=== TOTAL TRANSACTIONS: ' + total + ' ===');
