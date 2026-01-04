const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

const lines = content.split(/\r?\n/);
const types = {};
for (const line of lines) {
    if (line.trim().startsWith('INSERT [dbo].[TransactionType]')) {
        // Naive parse: VALUES (1, N'Name', ...
        const match = line.match(/VALUES \((\d+), N'([^']+)'/);
        if (match) {
            types[match[1]] = match[2];
        }
    }
}
console.log(types);
