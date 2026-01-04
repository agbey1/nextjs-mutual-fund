import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { MemberLoanRequestForm } from "@/components/MemberLoanRequestForm";
import { MemberLoansDisplay } from "@/components/MemberLoansDisplay";
import { DownloadStatementButton } from "@/components/DownloadStatementButton";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();

    if (!session || session.user.role !== "MEMBER") {
        redirect("/login");
    }

    const member = await prisma.member.findUnique({
        where: { userId: session.user.id },
        include: {
            transactions: {
                orderBy: { date: "desc" },
                take: 10,
            },
        },
    });

    if (!member) {
        return <div>Member record not found. Please contact Admin.</div>;
    }

    const formatCurrency = (amount: number) =>
        `GH₵ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navigation */}
            <nav className="p-4 bg-white shadow dark:bg-gray-800">
                <div className="container flex items-center justify-between mx-auto">
                    <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Calvary Fund</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {member.firstName} {member.lastName}
                        </span>
                        <LogoutButton />
                    </div>
                </div>
            </nav>

            <main className="container p-4 mx-auto space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-bold">Welcome, {member.firstName}!</h2>
                    <p className="text-blue-100 mt-1">Account: {member.accountNumber}</p>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Savings Card */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 border-l-4 border-green-500">
                        <h2 className="text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Total Savings</h2>
                        <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(member.totalSavings || 0)}
                        </p>
                    </div>

                    {/* Shares Card */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 border-l-4 border-blue-500">
                        <h2 className="text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Total Shares</h2>
                        <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(member.totalShares || 0)}
                        </p>
                    </div>

                    {/* Loans Card */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 border-l-4 border-red-500">
                        <h2 className="text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Loan Balance</h2>
                        <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(member.totalLoans || 0)}
                        </p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Transactions */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                                <Link href="/dashboard/transactions" className="text-sm text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-sm font-medium text-gray-500 border-b dark:border-gray-700 dark:text-gray-400">Date</th>
                                            <th className="p-2 text-sm font-medium text-gray-500 border-b dark:border-gray-700 dark:text-gray-400">Type</th>
                                            <th className="p-2 text-sm font-medium text-gray-500 border-b dark:border-gray-700 dark:text-gray-400">Principal</th>
                                            <th className="p-2 text-sm font-medium text-gray-500 border-b dark:border-gray-700 dark:text-gray-400">Interest</th>
                                            <th className="p-2 text-sm font-medium text-gray-500 border-b dark:border-gray-700 dark:text-gray-400">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {member.transactions.slice(0, 5).map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="p-2 text-sm border-b dark:border-gray-700 dark:text-gray-300">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-2 text-sm border-b dark:border-gray-700">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.type.includes('DEPOSIT') || tx.type.includes('PURCHASE') ? 'bg-green-100 text-green-800' :
                                                        tx.type.includes('WITHDRAWAL') ? 'bg-red-100 text-red-800' :
                                                            tx.type.includes('LOAN') ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {tx.type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-sm border-b dark:border-gray-700 dark:text-gray-300">
                                                    {formatCurrency(tx.principalAmount || tx.amount)}
                                                </td>
                                                <td className="p-2 text-sm border-b dark:border-gray-700 text-orange-600 dark:text-orange-400">
                                                    {tx.interestAmount > 0 ? formatCurrency(tx.interestAmount) : '-'}
                                                </td>
                                                <td className="p-2 text-sm font-medium border-b dark:border-gray-700 dark:text-gray-300">
                                                    {formatCurrency((tx.principalAmount || tx.amount) + (tx.interestAmount || 0))}
                                                </td>
                                            </tr>
                                        ))}
                                        {member.transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-gray-500">No transactions found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* My Loan Requests */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Loan Requests</h3>
                            <MemberLoansDisplay />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Request Loan */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Request a Loan</h3>
                            <MemberLoanRequestForm memberId={member.id} />
                        </div>

                        {/* Profile Info */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Profile</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Account Number</span>
                                    <span className="font-medium dark:text-white">{member.accountNumber}</span>
                                </div>
                                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Phone</span>
                                    <span className="font-medium dark:text-white">{member.phone}</span>
                                </div>
                                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Email</span>
                                    <span className="font-medium dark:text-white">{member.email || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Beneficiary</span>
                                    <span className="font-medium dark:text-white">{member.beneficiaryName || '-'}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <DownloadStatementButton memberId={member.id} />
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security Settings</h3>
                            <ChangePasswordForm />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
