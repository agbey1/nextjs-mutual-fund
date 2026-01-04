const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

console.log('=== SAMPLE TRANSACTION LINES ===');
let count = 0;
for (const line of lines) {
    const trim = line.trim();
    if (trim.startsWith('INSERT [dbo].[Transaction]') && trim.includes('VALUES')) {
        console.log('\n--- TX ' + (count + 1) + ' ---');
        console.log(trim);

        // Test regex
        const idMatch = trim.match(/VALUES\s*\((\d+)/);
        const amountMatch = trim.match(/CAST\(([\d.]+)\s*AS\s*Decimal/);
        const memberIdMatch = trim.match(/Decimal\(\d+,\s*\d+\)\),\s*(\d+),\s*(\d+),\s*(\d+)/);

        console.log('idMatch:', idMatch ? idMatch[1] : 'NO MATCH');
        console.log('amountMatch:', amountMatch ? amountMatch[1] : 'NO MATCH');
        console.log('memberIdMatch:', memberIdMatch ? [memberIdMatch[1], memberIdMatch[2], memberIdMatch[3]] : 'NO MATCH');

        count++;
        if (count >= 3) break;
    }
}
