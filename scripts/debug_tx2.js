const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

// Find Transaction INSERT with column names
for (const line of lines) {
    if (line.includes('[dbo].[Transaction]') && line.includes('INSERT')) {
        // Find non-data insert with column definitions
        if (line.includes('([')) {
            console.log('=== TRANSACTION INSERT WITH COLUMNS ===');
            console.log(line.substring(0, 700));
            break;
        }
    }
}

console.log('\n\n=== FIRST 3 TRANSACTION DATA LINES ===');
let count = 0;
for (const line of lines) {
    if (line.trim().startsWith('INSERT [dbo].[Transaction]') && line.includes('VALUES')) {
        console.log('\n--- TX ' + (count + 1) + ' ---');
        console.log(line.substring(0, 600));
        count++;
        if (count >= 3) break;
    }
}
