import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default async function MemberTransactionsPage() {
    const session = await auth();

    if (!session || session.user.role !== "MEMBER") {
        redirect("/login");
    }

    const member = await prisma.member.findUnique({
        where: { userId: session.user.id },
        include: {
            transactions: {
                orderBy: { date: "asc" }, // Ascending for running balance calculation
            },
        },
    });

    if (!member) {
        return <div>Member record not found.</div>;
    }

    const formatCurrency = (amount: number) =>
        `GH₵ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    // Calculate running balances
    let savingsBalance = 0;
    let sharesBalance = 0;
    let loanBalance = 0;

    const transactionsWithBalances = member.transactions.map((tx: any) => {
        const principal = tx.principalAmount || tx.amount || 0;
        const interest = tx.interestAmount || 0;

        switch (tx.type) {
            case 'SAVINGS_DEPOSIT':
                savingsBalance += principal;
                break;
            case 'SAVINGS_WITHDRAWAL':
                savingsBalance -= principal;
                break;
            case 'SHARE_PURCHASE':
                sharesBalance += principal;
                break;
            case 'SHARE_WITHDRAWAL':
                sharesBalance -= principal;
                break;
            case 'LOAN_DISBURSAL':
                loanBalance += principal + interest;
                break;
            case 'LOAN_REPAYMENT':
                loanBalance -= principal;
                break;
        }

        return {
            ...tx,
            runningBalances: {
                savings: savingsBalance,
                shares: sharesBalance,
                loans: loanBalance
            }
        };
    }).reverse(); // Reverse to show newest first

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navigation */}
            <nav className="p-4 bg-white shadow dark:bg-gray-800">
                <div className="container flex items-center justify-between mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-blue-600 hover:underline">← Back</Link>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
                    </div>
                    <LogoutButton />
                </div>
            </nav>

            <main className="container p-4 mx-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Savings Balance</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(savingsBalance)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400">Shares Balance</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(sharesBalance)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">Loan Outstanding</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(loanBalance)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="text-lg font-semibold dark:text-white">
                            All Transactions ({member.transactions.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300">Date</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300">Receipt</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300">Type</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300">Amount</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300">Interest</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/30">Savings Bal.</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300 bg-green-50 dark:bg-green-900/30">Shares Bal.</th>
                                    <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-300 bg-red-50 dark:bg-red-900/30">Loan Bal.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {transactionsWithBalances.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="p-3 text-sm dark:text-gray-300">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 text-sm font-mono text-gray-500 dark:text-gray-400">
                                            {tx.receiptNo || '-'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.type.includes('DEPOSIT') || tx.type.includes('PURCHASE')
                                                    ? 'bg-green-100 text-green-800'
                                                    : tx.type.includes('WITHDRAWAL')
                                                        ? 'bg-red-100 text-red-800'
                                                        : tx.type === 'LOAN_DISBURSAL'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : tx.type === 'LOAN_REPAYMENT'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {tx.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm font-medium dark:text-gray-300">
                                            {tx.type.includes('DEPOSIT') || tx.type.includes('PURCHASE') || tx.type === 'LOAN_REPAYMENT'
                                                ? '+' : '-'}
                                            {formatCurrency(tx.principalAmount || tx.amount)}
                                        </td>
                                        <td className="p-3 text-sm text-orange-600 dark:text-orange-400">
                                            {tx.interestAmount > 0 ? formatCurrency(tx.interestAmount) : '-'}
                                        </td>
                                        <td className="p-3 text-sm font-medium text-blue-600 bg-blue-50/50 dark:bg-blue-900/10">
                                            {formatCurrency(tx.runningBalances.savings)}
                                        </td>
                                        <td className="p-3 text-sm font-medium text-green-600 bg-green-50/50 dark:bg-green-900/10">
                                            {formatCurrency(tx.runningBalances.shares)}
                                        </td>
                                        <td className="p-3 text-sm font-medium text-red-600 bg-red-50/50 dark:bg-red-900/10">
                                            {formatCurrency(tx.runningBalances.loans)}
                                        </td>
                                    </tr>
                                ))}
                                {member.transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
