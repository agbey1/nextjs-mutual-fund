const fs = require('fs');
const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');

const lines = content.split(/\r?\n/);
let found = 0;
for (const line of lines) {
    if (line.toUpperCase().includes('INSERT')) {
        console.log(line.substring(0, 200)); // Print start of line
        found++;
        if (found > 10) break;
    }
}

if (found === 0) console.log("No INSERT found in split lines. Content length:", content.length);
