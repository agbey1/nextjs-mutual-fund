const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

// Print a few lines around Transaction inserts to see the exact format
console.log('=== SEARCHING FOR TRANSACTION STRUCTURE ===\n');

let count = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[dbo].[Transaction]') && line.includes('VALUES')) {
        console.log('Line ' + i + ':');
        // Print in chunks to see all parts
        const chunks = line.match(/.{1,100}/g);
        if (chunks) {
            chunks.forEach((chunk, idx) => {
                console.log('  [' + idx + '] ' + chunk);
            });
        }
        count++;
        if (count >= 2) break;
        console.log('\n');
    }
}
