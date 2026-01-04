var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mockMembers, mockExpenses, mockTransactions } from '../lib/mockData';
import { hashPassword } from '../lib/hash';
import fs from 'fs';
function generateSQL() {
    return __awaiter(this, void 0, void 0, function* () {
        let sql = `-- Mutual Fund App Data Dump\n-- Generated on ${new Date().toISOString()}\n\n`;
        sql += `BEGIN;\n\n`;
        // 1. Users
        sql += `-- Users \n`;
        for (const m of mockMembers) {
            // Only generate insert if assuming empty DB
            const hashedPassword = yield hashPassword(m.phone.toString());
            const role = m.id === '1' ? 'ADMIN' : 'MEMBER';
            const userId = `user-${m.accountNumber}`; // Consistent ID generation
            // Escape strings helper
            const safe = (str) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
            sql += `INSERT INTO "User" (id, username, password, role, name, "createdAt", "updatedAt") VALUES ('${userId}', '${m.accountNumber}', '${hashedPassword}', '${role}', ${safe(m.firstName + ' ' + m.lastName)}, NOW(), NOW()) ON CONFLICT (username) DO NOTHING;\n`;
        }
        sql += `\n`;
        // 2. Members
        sql += `-- Members \n`;
        for (const m of mockMembers) {
            const userId = `user-${m.accountNumber}`;
            const safe = (str) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
            const dateOfBirth = m.dateOfBirth === "00:00.0" ? "1970-01-01" : m.dateOfBirth;
            sql += `INSERT INTO "Member" (id, "userId", "firstName", "lastName", "otherNames", gender, "dateOfBirth", phone, email, address, "gpsAddress", "accountNumber", "beneficiaryName", "beneficiaryRelation", "beneficiaryContact", "beneficiaryAddress", "totalSavings", "totalLoans", "totalShares", "createdAt", "updatedAt") 
        VALUES ('${m.id}', '${userId}', ${safe(m.firstName)}, ${safe(m.lastName)}, NULL, '${m.gender}', '${dateOfBirth}', '${m.phone}', ${safe(m.email)}, ${safe(m.address)}, ${safe(m.gps)}, '${m.accountNumber}', ${safe(m.beneficiaryName)}, ${safe(m.beneficiaryRelationship)}, NULL, ${safe(m.beneficiaryAddress)}, ${m.totalSavings}, ${m.totalLoans}, ${m.totalShares}, NOW(), NOW()) ON CONFLICT ("accountNumber") DO NOTHING;\n`;
        }
        sql += `\n`;
        // 3. Transactions (Embedded in MockMembers + Standalone)
        sql += `-- Transactions \n`;
        // Collect all transactions, avoiding duplicates
        const allTxs = new Map();
        // Standalone
        mockTransactions.forEach((t) => allTxs.set(t.id, Object.assign(Object.assign({}, t), { memberId: t.memberId || 'UNKNOWN' })));
        // Embedded
        mockMembers.forEach((m) => {
            if (m.transactions) {
                m.transactions.forEach((t) => {
                    allTxs.set(t.id, Object.assign(Object.assign({}, t), { memberId: m.id }));
                });
            }
        });
        for (const tx of allTxs.values()) {
            const safe = (str) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
            const isReversal = tx.isReversal ? 'true' : 'false';
            const paymentCompleted = 'true';
            // Map type
            let type = tx.type;
            sql += `INSERT INTO "Transaction" (id, "memberId", type, amount, "interestAmount", "principalAmount", description, reference, date, "recordedBy", "paymentCompleted", "isReversal", "createdAt")
        VALUES ('${tx.id}', '${tx.memberId}', '${type}', ${tx.amount}, ${tx.interestAmount || 0}, ${tx.principalAmount || 0}, ${safe(tx.description)}, ${safe(tx.receiptNo || tx.receiptNumber)}, '${tx.date}', NULL, ${paymentCompleted}, ${isReversal}, '${tx.date}') ON CONFLICT (id) DO NOTHING;\n`;
        }
        sql += `\n`;
        // 4. Expenses
        sql += `-- Expenses \n`;
        for (const e of mockExpenses) {
            const safe = (str) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
            sql += `INSERT INTO "Expense" (id, amount, description, category, date, "createdAt")
        VALUES ('${e.id}', ${e.amount}, ${safe(e.description)}, ${safe(e.category)}, '${e.date}', '${e.date}') ON CONFLICT (id) DO NOTHING;\n`;
        }
        sql += `\nCOMMIT;\n`;
        fs.writeFileSync('migration_dump.sql', sql);
        console.log('Successfully created migration_dump.sql');
    });
}
generateSQL();
