const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
const lines = content.split(/\r?\n/);

// Sample transaction insert
for (const line of lines) {
    if (line.includes('INSERT [dbo].[Transaction]') && line.includes('VALUES')) {
        console.log('=== SAMPLE TRANSACTION INSERT ===');
        console.log(line.substring(0, 500));

        // Extract VALUES
        const start = line.indexOf('VALUES (');
        const valContent = line.substring(start + 8, line.lastIndexOf(')'));
        console.log('\n=== EXTRACTED VALUES ===');
        console.log(valContent.substring(0, 300));
        break;
    }
}

// Sample member IDs
console.log('\n=== SAMPLE MEMBER IDS ===');
let count = 0;
for (const line of lines) {
    if (line.includes('INSERT [dbo].[Member]') && line.includes('VALUES')) {
        const start = line.indexOf('VALUES (');
        const valContent = line.substring(start + 8, 100);
        console.log(valContent);
        count++;
        if (count >= 3) break;
    }
}
