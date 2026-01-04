const fs = require('fs');

try {
    // Try reading as UTF16LE first
    const content = fs.readFileSync('d:/projects/mutualfund/roselyn.sql', 'ucs2');
    console.log('--- READ AS UCS2 ---');
    console.log(content.substring(0, 500));
} catch (e) {
    console.log('Error reading ucs2:', e.message);
}
