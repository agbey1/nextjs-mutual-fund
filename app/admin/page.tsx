import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DateFilter } from "./components/DateFilter";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/login");

    const params = await searchParams;
    const dateFilter = params?.date ? { lte: new Date(params.date).toISOString() } : undefined;

    // Parallel Aggregation with Dynamic Filtering
    const [
        savingsTx,
        withdrawalTx,
        sharePurchaseTx,
        shareWithdrawalTx,
        loanDisbursalTx,
        loanRepaymentTx,
        expensesData,
        memberCount
    ] = await Promise.all([
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: { in: ["DEPOSIT", "SAVINGS_DEPOSIT"] }, date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: { in: ["WITHDRAWAL", "SAVINGS_WITHDRAWAL"] }, date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "SHARE_PURCHASE", date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "SHARE_WITHDRAWAL", date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "LOAN_DISBURSAL", date: dateFilter } }),
        prisma.transaction.aggregate({ _sum: { amount: true, interestAmount: true }, where: { type: "LOAN_REPAYMENT", date: dateFilter } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { date: dateFilter } }),
        prisma.member.count() // Member count is always total or should it be filtered by registration date? Simple count is fine for now.
    ]);

    // Calculate Net Balances
    const totalSavings = (savingsTx._sum.amount || 0) - (withdrawalTx._sum.amount || 0);
    const totalShares = (sharePurchaseTx._sum.amount || 0) - (shareWithdrawalTx._sum.amount || 0);
    // Logic Correction requested by User:
    // Net Interest = (Total Loan Paid) - (Actual Loan Amount aka Principal) - Expenses
    // Total Loan Repayment (DB has Total Amount)
    const totalLoanPaid = loanRepaymentTx._sum.amount || 0;

    // Principal Repaid (Derived: Total - Interest)
    const totalInterestRepaid = loanRepaymentTx._sum.interestAmount || 0;
    const totalPrincipalRepaid = totalLoanPaid - totalInterestRepaid;

    const expenses = expensesData._sum.amount || 0;

    // Net Interest Calculation
    const netInterest = (totalLoanPaid - totalPrincipalRepaid) - expenses;

    const activeLoans = (loanDisbursalTx._sum.amount || 0) - totalPrincipalRepaid;
    // Note: Mathematically, (Total - Principal) IS Interest. So this simplifies back to Interest - Expenses.
    // However, explicitly stepping it out helps trace data integrity.

    // Recent Transactions (Filtered)
    const recentTx = await prisma.transaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        where: { date: dateFilter },
        include: { member: { select: { firstName: true, lastName: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold dark:text-white">Dashboard Overview</h2>
                <DateFilter />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Savings" value={totalSavings} />
                <MetricCard title="Total Shares" value={totalShares} color="text-indigo-600" />
                <MetricCard title="Active Loans" value={activeLoans} color="text-red-500" />
                <MetricCard title="Total Expenses" value={expenses} color="text-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Net Interest Card */}
                <MetricCard
                    title="Net Interest (Distributable)"
                    value={netInterest}
                    subtitle={`Gross Interest: ${totalInterestRepaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color={netInterest >= 0 ? "text-green-600" : "text-red-600"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simple Stats */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 font-medium">Total Members</h3>
                    <p className="text-4xl font-bold mt-2 dark:text-white">{memberCount}</p>
                </div>

                {/* Recent Transactions List */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">Recent Activity {params?.date ? `(up to ${params.date})` : ''}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="pb-2 text-sm text-gray-500">Date</th>
                                    <th className="pb-2 text-sm text-gray-500">Member</th>
                                    <th className="pb-2 text-sm text-gray-500">Type</th>
                                    <th className="pb-2 text-sm text-gray-500">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.map((tx: any) => (
                                    <tr key={tx.id} className="border-b last:border-0 dark:border-gray-700">
                                        <td className="py-3 text-sm dark:text-gray-300">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="py-3 text-sm dark:text-gray-300">{tx.member?.firstName || 'Unknown'} {tx.member?.lastName || ''}</td>
                                        <td className="py-3 text-sm dark:text-gray-300">
                                            <span className={`px-2 py-1 rounded text-xs ${tx.type.includes('DEPOSIT') || tx.type.includes('REPAYMENT') || tx.type.includes('PURCHASE') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {tx.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm font-medium dark:text-gray-300">
                                            {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {recentTx.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-500">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Analytics Charts */}
            <AnalyticsDashboard />
        </div>
    );
}

function MetricCard({ title, value, color = "text-gray-900", subtitle }: { title: string, value: number, color?: string, subtitle?: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
            <p className={`mt-2 text-3xl font-bold ${color} dark:text-white`}>
                GH₵ {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    )
}
