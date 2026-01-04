// Add expenses to mockData.ts
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Excel serial date to JavaScript Date
function excelDateToJS(serial) {
    if (!serial || typeof serial !== 'number') return new Date();
    const utcDays = serial - 25569;
    const utcValue = utcDays * 86400 * 1000;
    return new Date(utcValue);
}

console.log('=== Adding Expenses to mockData ===\n');

// Parse expenses
const expWb = XLSX.readFile(path.join(__dirname, '..', 'expense.xlsx'));
const expWs = expWb.Sheets[expWb.SheetNames[0]];
const expenses = XLSX.utils.sheet_to_json(expWs);

console.log(`Found ${expenses.length} expenses`);

// Convert to app format
const appExpenses = expenses.map(e => ({
    id: `exp-${e.Id}`,
    description: e.Description || '',
    amount: parseFloat(e.Amount) || 0,
    date: excelDateToJS(e.Date).toISOString(),
    category: e.Category || 'General',
    recordedBy: 'legacy'
}));

console.log('Converted expenses:', appExpenses);

// Read mockData.ts
const mockDataPath = path.join(__dirname, '..', 'lib', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf8');

// Replace mockExpenses
content = content.replace(
    /export const mockExpenses: any\[\] = \[\];/,
    `export const mockExpenses: any[] = ${JSON.stringify(appExpenses, null, 2)};`
);

// Also try without type annotation
content = content.replace(
    /export const mockExpenses = \[\];/,
    `export const mockExpenses: any[] = ${JSON.stringify(appExpenses, null, 2)};`
);

fs.writeFileSync(mockDataPath, content);
console.log('\n✅ Expenses added to mockData.ts');
