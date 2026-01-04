const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

let output = '=== TRANSACTION INSERT SAMPLES ===\n\n';

let count = 0;
for (const line of lines) {
    if (line.includes('INSERT [dbo].[Transaction]') && line.includes('VALUES')) {
        output += '--- TRANSACTION ' + (count + 1) + ' ---\n';
        output += line + '\n\n';
        count++;
        if (count >= 5) break;
    }
}

fs.writeFileSync('d:/projects/mutualfund/web/tx_samples.txt', output);
console.log('Written ' + count + ' samples to tx_samples.txt');
