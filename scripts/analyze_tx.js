const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

console.log('=== TRANSACTION INSERT ANALYSIS ===\n');

let count = 0;
for (const line of lines) {
    const trim = line.trim();
    if (trim.startsWith('INSERT [dbo].[Transaction]') && trim.includes('VALUES')) {
        console.log('--- FULL LINE ---');
        console.log(trim);
        console.log('\n--- PARSED COMPONENTS ---');

        // Find VALUES section
        const valStart = trim.indexOf('VALUES (');
        if (valStart !== -1) {
            const valPart = trim.substring(valStart + 8, trim.lastIndexOf(')'));
            console.log('VALUES content:', valPart);

            // Try to extract date - look for DateTime2
            const dateMatch = trim.match(/CAST\(N'([^']+)' AS DateTime2\)/);
            console.log('Date extracted:', dateMatch ? dateMatch[1] : 'NOT FOUND');

            // Try amount
            const amountMatch = trim.match(/CAST\(([\d.]+)\s+AS\s+Decimal\(\d+,\s*\d+\)\)/);
            console.log('Amount:', amountMatch ? amountMatch[1] : 'NOT FOUND');

            // Try to extract all integers after the decimal close
            // Pattern: ...), memberId, typeId, entryType, N'...
            const afterDecimal = valPart.match(/Decimal\(\d+,\s*\d+\)\),\s*(\d+),\s*(\d+),\s*(\d+)/);
            console.log('After Decimal (memberId, typeId, entryType):', afterDecimal ? [afterDecimal[1], afterDecimal[2], afterDecimal[3]] : 'NOT FOUND');
        }

        count++;
        if (count >= 3) break;
        console.log('\n' + '='.repeat(80) + '\n');
    }
}
