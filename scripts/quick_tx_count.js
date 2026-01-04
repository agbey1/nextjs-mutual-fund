const fs = require('fs');

const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

let output = '=== TRANSACTION TYPE COUNTS ===\n\n';

const typeCounts = { '1_cr': 0, '1_dr': 0, '2_cr': 0, '2_dr': 0, '3_cr': 0, '3_dr': 0 };

for (const line of lines) {
    if (line.includes('INSERT [dbo].[Transaction]') && line.includes('VALUES')) {
        const typeMatch = line.match(/Decimal\(18,\s*2\)\),\s*(\d+),\s*(\d+),\s*CAST/);
        const entryMatch = line.match(/N'(cr|dr)'/i);

        if (typeMatch && entryMatch) {
            const key = typeMatch[1] + '_' + entryMatch[1].toLowerCase();
            if (typeCounts[key] !== undefined) typeCounts[key]++;
        }
    }
}

output += 'TypeId 1 (Savings):\n';
output += '  - Credit (deposit): ' + typeCounts['1_cr'] + '\n';
output += '  - Debit (withdrawal): ' + typeCounts['1_dr'] + '\n\n';

output += 'TypeId 2 (Loans):\n';
output += '  - Credit (repayment): ' + typeCounts['2_cr'] + '\n';
output += '  - Debit (disbursal): ' + typeCounts['2_dr'] + '\n\n';

output += 'TypeId 3 (Shares):\n';
output += '  - Credit (purchase): ' + typeCounts['3_cr'] + '\n';
output += '  - Debit (withdrawal): ' + typeCounts['3_dr'] + '\n\n';

const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
output += 'TOTAL: ' + total + '\n';

fs.writeFileSync('d:/projects/mutualfund/web/tx_analysis_result.txt', output);
console.log(output);
