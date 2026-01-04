const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

const lines = content.split(/\r?\n/);
let txFound = false;
let contactFound = false;

for (const line of lines) {
    if (!txFound && line.trim().startsWith('INSERT [dbo].[Transaction]')) {
        console.log('--- TRANSACTION ---');
        console.log(line);
        txFound = true;
    }
    if (!contactFound && line.trim().startsWith('INSERT [dbo].[Contact]')) {
        console.log('--- CONTACT ---');
        console.log(line);
        contactFound = true;
    }
    if (txFound && contactFound) break;
}
