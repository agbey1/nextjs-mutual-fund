const fs = require('fs');
const readline = require('readline');

async function debug() {
    const fileStream = fs.createReadStream('d:/projects/mutualfund/roselyn.sql', { encoding: 'ucs2' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('INSERT [dbo].[Contact]') && line.includes('VALUES (1,')) {
            console.log('FOUND LINE:', line);

            const trim = line.trim();
            const valContentMatch = trim.match(/VALUES\s*\((.*)\)/);
            if (valContentMatch) {
                const valStr = valContentMatch[1];
                console.log('VAL STR:', valStr);

                const fields = [];
                const fieldRegex = /(?:N'([^']*)'|NULL|(\d+))/g;
                let match;
                while ((match = fieldRegex.exec(valStr)) !== null) {
                    if (match[1] !== undefined) fields.push(match[1]);
                    else if (match[2] !== undefined) fields.push(match[2]);
                    else fields.push(null);
                }

                console.log('FIELDS EXTRACTED:', fields);
                console.log('MemberId (Index 5):', fields[5]);
            } else {
                console.log('VAL CONTENT NO MATCH');
            }
            break;
        }
    }
}

debug();
