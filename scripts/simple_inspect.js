const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

// Find tables via simpler regex
const matches = content.match(/INSERT \[dbo\]\.\[(\w+)\]/g);
const tables = [...new Set(matches?.map(m => m.match(/\[(\w+)\]$/)?.[1]) || [])];
console.log('=== TABLES WITH INSERT STATEMENTS ===');
console.log(tables);

// Sample Contact insert
const lines = content.split(/\r?\n/);
console.log('\n=== SAMPLE CONTACT INSERT ===');
for (const line of lines) {
    if (line.includes('INSERT [dbo].[Contact]') && line.includes('VALUES')) {
        console.log(line.substring(0, 400));
        break;
    }
}

// Sample Dependant/Address tables
console.log('\n=== LOOKING FOR DEPENDANT/ADDRESS ===');
for (const table of tables) {
    if (table.toLowerCase().includes('depend') || table.toLowerCase().includes('address')) {
        console.log('Found:', table);
    }
}
