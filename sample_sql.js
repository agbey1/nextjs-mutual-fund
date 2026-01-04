const fs = require('fs');

const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

// Find Member inserts
const memberInserts = content.match(/INSERT INTO \[dbo\]\.\[Member\].*/g);
console.log('--- MEMBER INSERTS (First 3) ---');
if (memberInserts) console.log(memberInserts.slice(0, 3).join('\n'));

// Find Transaction inserts (checking table name correctness)
const txInserts = content.match(/INSERT INTO \[dbo\]\.\[Transaction\].*/g);
console.log('--- TRANSACTION INSERTS (First 3) ---');
if (txInserts) console.log(txInserts.slice(0, 3).join('\n'));
