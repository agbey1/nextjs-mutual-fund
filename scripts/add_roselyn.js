// Script to add Roselyn Bansah to mockData with her loan interest
const fs = require('fs');

// Roselyn Bansah data from user (legacy MemberId: 323)
const roselynsData = {
    member: {
        id: "323",
        firstName: "Roselyn",
        lastName: "Bansah",
        gender: "FEMALE",
        dateOfBirth: "1990-01-01T00:00:00.000Z",
        accountNumber: "1000061",
        totalSavings: 100,
        totalShares: 100,
        totalLoans: 5000,  // From the sample: 5000.0000 loan amount
        phone: "0244542999",
        email: "roselyn.bansah@email.com",
        address: "Tema",
        gps: "",
        beneficiaryName: "",
        beneficiaryRelationship: "",
        beneficiaryAddress: "",
        userId: "323",
        transactions: [
            {
                id: "tx-323-1",
                memberId: "323",
                receiptNo: "1107",
                type: "SHARE_PURCHASE",
                amount: 50,
                interestAmount: 0,
                principalAmount: 50,
                description: "Share Purchase",
                date: "2018-11-25T00:00:00.000Z",
                recordedBy: "seed"
            },
            {
                id: "tx-323-2",
                memberId: "323",
                receiptNo: "1107",
                type: "SAVINGS_DEPOSIT",
                amount: 50,
                interestAmount: 0,
                principalAmount: 50,
                description: "Savings Deposit",
                date: "2018-11-25T00:00:00.000Z",
                recordedBy: "seed"
            },
            {
                id: "tx-323-3",
                memberId: "323",
                receiptNo: "L002",
                type: "LOAN_DISBURSAL",
                amount: 5000,
                interestAmount: 400,  // This is the InterestTotal from the legacy system
                principalAmount: 5000,
                description: "Loan Disbursal - Interest: GH₵400",
                date: "2019-09-22T00:00:00.000Z",
                recordedBy: "seed"
            }
        ]
    }
};

// Read current mockData
const mockDataPath = 'D:\\projects\\mutualfund\\web\\lib\\mockData.ts';
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Find where to insert (after first opening bracket of mockMembers array)
const insertIndex = mockDataContent.indexOf('export const mockMembers = [') + 'export const mockMembers = ['.length;

// Create the new member entry
const newMemberJson = JSON.stringify(roselynsData.member, null, 2);
const memberEntry = `
  ${newMemberJson},`;

// Insert the new member at the beginning of the array
mockDataContent = mockDataContent.slice(0, insertIndex) + memberEntry + mockDataContent.slice(insertIndex);

// Save the updated file
fs.writeFileSync(mockDataPath, mockDataContent);

console.log('Successfully added Roselyn Bansah to mockData.ts');
console.log('Account: 1000061');
console.log('Phone (password): 0244542999');
console.log('Loan Amount: 5000');
console.log('Interest Total: 400');
