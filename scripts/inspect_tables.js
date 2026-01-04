const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

// Find all table names from CREATE TABLE statements
const tableMatches = content.match(/CREATE TABLE \[dbo\]\.\[(\w+)\]/g);
const tables = [...new Set(tableMatches)].map(m => m.match(/\[(\w+)\]$/)[1]);
console.log('=== TABLES FOUND ===');
console.log(tables);

// Sample one insert from each table
console.log('\n=== SAMPLE INSERTS ===');
const lines = content.split(/\r?\n/);
for (const table of tables) {
    for (const line of lines) {
        if (line.trim().startsWith(`INSERT [dbo].[${table}]`)) {
            console.log(`\n--- ${table} ---`);
            console.log(line.substring(0, 300));
            break;
        }
    }
}
