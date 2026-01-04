
import prisma from '../lib/prisma';

async function main() {
    console.log("DEBUG: Testing Dashboard Aggregation Logic");

    const dateFilter = undefined; // Simulate no date filter for total

    const [
        savingsTx,
        withdrawalTx,
        sharePurchaseTx,
        shareWithdrawalTx,
        loanDisbursalTx,
        loanRepaymentTx,
        expensesData
    ] = await Promise.all([
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: { in: ["DEPOSIT", "SAVINGS_DEPOSIT"] }, date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: { in: ["WITHDRAWAL", "SAVINGS_WITHDRAWAL"] }, date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "SHARE_PURCHASE", date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "SHARE_WITHDRAWAL", date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "LOAN_DISBURSAL", date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true, interestAmount: true }, where: { type: "LOAN_REPAYMENT", date: dateFilter } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { date: dateFilter } })
    ]);

    const totalSavings = (savingsTx._sum.amount || 0) - (withdrawalTx._sum.amount || 0);
    const totalShares = (sharePurchaseTx._sum.amount || 0) - (shareWithdrawalTx._sum.amount || 0);
    const totalRepayment = loanRepaymentTx._sum.amount || 0;
    const totalInterestRepaid = loanRepaymentTx._sum.interestAmount || 0;
    const totalPrincipalRepaid = totalRepayment - totalInterestRepaid;
    const activeLoans = (loanDisbursalTx._sum.amount || 0) - totalPrincipalRepaid;
    const expenses = expensesData._sum.amount || 0;
    const netInterest = totalInterestRepaid - expenses;

    console.log("--- RESULTS ---");
    console.log(`Savings Deposits (Sum): ${savingsTx._sum.amount}`);
    console.log(`Savings Withdrawals (Sum): ${withdrawalTx._sum.amount}`);
    console.log(`Total Savings: ${totalSavings}`);
    console.log(`Total Shares: ${totalShares}`);
    console.log(`Active Loans: ${activeLoans}`);
    console.log(`Total Interest Repaid: ${totalInterestRepaid}`);
    console.log(`Expenses: ${expenses}`);
    console.log(`Net Interest: ${netInterest}`);

    if (totalSavings === 0) {
        console.error("FAIL: Total Savings is still 0.");
    } else {
        console.log("PASS: Total Savings is non-zero.");
    }

    if (totalInterestRepaid === 0 && netInterest === -expenses) {
        console.log("CONFIRMED: Net Interest equals -Expenses because Interest Repaid is 0.");
    }
}

main();
