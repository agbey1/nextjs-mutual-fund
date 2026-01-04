const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

const lines = content.split(/\r?\n/);
for (const line of lines) {
    if (line.trim().startsWith('INSERT [dbo].[TransactionType]')) {
        console.log(line);
    }
}
