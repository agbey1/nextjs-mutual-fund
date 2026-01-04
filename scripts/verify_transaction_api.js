// const fetch = require('node-fetch'); // Native in node 20

async function testApi() {
    const baseUrl = 'http://localhost:3000/api';

    // 1. Get a member to find a transaction
    console.log('Fetching members...');
    const membersRes = await fetch(`${baseUrl}/admin/members`);
    if (!membersRes.ok) {
        const txt = await membersRes.text();
        throw new Error(`Failed to fetch members: ${membersRes.status} ${membersRes.statusText} - ${txt}`);
    }
    const members = await membersRes.json();

    let member;
    let tx;

    for (const m of members) {
        // Fetch detail to see transactions
        const txRes = await fetch(`${baseUrl}/admin/members/${m.id}`);
        if (!txRes.ok) continue;
        const detail = await txRes.json();
        if (detail.transactions && detail.transactions.length > 0) {
            member = m;
            tx = detail.transactions[0];
            break;
        }
    }

    if (!member || !tx) {
        console.log('No transactions found for ANY member, skipping test');
        return;
    }
    console.log(`Using member: ${member.firstName} ${member.lastName} (${member.id})`);
    console.log(`Testing with transaction: ${tx.id} (${tx.description})`);

    // 2. Test Edit
    console.log('Testing Edit...');
    const editRes = await fetch(`${baseUrl}/admin/transactions/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: tx.id,
            description: 'API Verify Edit',
            receiptNumber: 'REC-API-123'
        })
    });

    if (editRes.ok) {
        const updated = await editRes.json();
        console.log('Edit Success:', updated);
        if (updated.description !== 'API Verify Edit') throw new Error('Edit failed to update description');
    } else {
        console.error('Edit Failed:', await editRes.text());
    }

    // 3. Test Reverse
    console.log('Testing Reverse...');
    // Use a different tx if possible, or same one
    const reverseRes = await fetch(`${baseUrl}/admin/transactions/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: tx.id,
            reason: 'API Verify Reverse'
        })
    });

    if (reverseRes.ok) {
        const reversal = await reverseRes.json();
        console.log('Reverse Success:', reversal);
        if (!reversal.isReversal) throw new Error('Reversal flag missing');
        if (reversal.amount !== -1 * tx.amount) throw new Error('Reversal amount incorrect');
    } else {
        console.error('Reverse Failed:', await reverseRes.text());
    }
}

testApi().catch(console.error);
