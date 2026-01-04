// Script to merge contact data (phone, email, address) into mockData.ts
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('=== Merging Contact Data into Members ===\n');

// 1. Read contact.xlsx
const contactPath = path.join(__dirname, '..', 'contact.xlsx');
const workbook = XLSX.readFile(contactPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const contacts = XLSX.utils.sheet_to_json(sheet);

console.log(`Found ${contacts.length} contacts`);

// Create lookup by MemberId
const contactByMemberId = {};
contacts.forEach(c => {
    contactByMemberId[c.MemberId] = {
        phone: c.Phone || '',
        email: c.Email || '',
        address: c.Address || '',
        gps: c.GPS || '',
        beneficiaryName: c.BeneficiaryName || '',
        beneficiaryRelationship: c.BeneficiaryRelationship || '',
        beneficiaryAddress: c.BeneficiaryAddress || ''
    };
});

// 2. Read current mockData.ts
const mockDataPath = path.join(__dirname, '..', 'lib', 'mockData.ts');
let mockContent = fs.readFileSync(mockDataPath, 'utf8');

// 3. Parse the mockMembers array
const membersMatch = mockContent.match(/export const mockMembers = (\[[\s\S]*?\]);/);
if (!membersMatch) {
    console.error('Could not parse mockMembers from mockData.ts');
    process.exit(1);
}

const members = JSON.parse(membersMatch[1]);
console.log(`Found ${members.length} members in mockData.ts`);

// 4. Merge contact data
let mergedCount = 0;
members.forEach(member => {
    const contact = contactByMemberId[member.id];
    if (contact) {
        member.phone = contact.phone || member.phone;
        member.email = contact.email || member.email;
        member.address = contact.address || member.address;
        member.gps = contact.gps || member.gps;
        member.beneficiaryName = contact.beneficiaryName || member.beneficiaryName;
        member.beneficiaryRelationship = contact.beneficiaryRelationship || member.beneficiaryRelationship;
        member.beneficiaryAddress = contact.beneficiaryAddress || member.beneficiaryAddress;
        mergedCount++;
    }
});

console.log(`Merged contact data for ${mergedCount} members`);

// 5. Show some samples with phone numbers
console.log('\n=== Sample Members with Phone Numbers ===');
const withPhone = members.filter(m => m.phone && m.phone.length > 5);
console.log(`Members with phone: ${withPhone.length}`);
withPhone.slice(0, 10).forEach(m => {
    console.log(`  ${m.accountNumber} (ID: ${m.id}): ${m.firstName} ${m.lastName} - Phone: ${m.phone}`);
});

// 6. Write updated mockData.ts
const updatedContent = `
export const mockMembers = ${JSON.stringify(members, null, 2)};

export const mockTransactions = [];

export const mockExpenses = [];

export const mockAuditLogs = [];
`;

fs.writeFileSync(mockDataPath, updatedContent);
console.log('\n✅ mockData.ts updated with contact data');

// 7. Show login credentials
console.log('\n=== Login Credentials (Sample) ===');
withPhone.slice(0, 15).forEach(m => {
    console.log(`Account: ${m.accountNumber}, Password: ${m.phone}`);
});
