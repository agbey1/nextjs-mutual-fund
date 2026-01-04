
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoanActions } from "@/components/LoanActions";

export default async function AdminLoansPage() {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") redirect("/login");

    // Fetch all loan requests
    const loans = await prisma.loanRequest.findMany({
        include: { member: true }
    });

    const pendingLoans = loans.filter((l: any) => l.status === "PENDING");
    const disbursedLoans = loans.filter((l: any) => l.status === "DISBURSED");
    const rejectedLoans = loans.filter((l: any) => l.status === "REJECTED");

    const formatCurrency = (amount: number) => `GH₵ ${amount?.toLocaleString() || 0}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Review and manage loan requests</p>
                </div>
                <Link
                    href="/admin/loans/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    + New Loan
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingLoans.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Disbursed</h3>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{disbursedLoans.length}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Rejected</h3>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{rejectedLoans.length}</p>
                </div>
            </div>

            {/* Pending Requests Section */}
            {pendingLoans.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pending Requests</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Purpose</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Requested</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingLoans.map((loan: any) => (
                                    <tr key={loan.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {loan.member?.firstName} {loan.member?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {loan.member?.accountNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(loan.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {loan.purpose || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(loan.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <LoanActions loanId={loan.id} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* All Loans History */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Loan History</h2>
                {loans.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No loan requests yet.</p>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loans.map((loan: any) => (
                                    <tr key={loan.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {loan.member?.firstName} {loan.member?.lastName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {formatCurrency(loan.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${loan.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                                loan.status === "DISBURSED" ? "bg-green-100 text-green-800" :
                                                    "bg-red-100 text-red-800"
                                                }`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(loan.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
