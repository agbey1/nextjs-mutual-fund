'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EditTransactionModal, ReverseTransactionModal } from '@/components/admin/TransactionModals';
import { EditMemberModal } from '@/components/admin/EditMemberModal';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    interestAmount?: number;
    date: string;
    description: string;
    receiptNumber?: string; // Updated from receiptNo to match backend
    isReversal?: boolean;
}

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    accountNumber: string;
    phone: string;
    email: string | null;
    address: string;
    gps?: string;
    totalSavings: number;
    totalShares: number;
    totalLoans: number;
    gender: string;
    dateOfBirth: string;
    registrationDate?: string;
    beneficiaryName?: string;
    beneficiaryRelationship?: string;
    beneficiaryAddress?: string;
    transactions: Transaction[];
}

export default function MemberDetailPage() {
    const params = useParams();
    const memberId = params?.id as string;

    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0); // To trigger re-fetch

    // Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [reverseModalOpen, setReverseModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);

    // Transaction filters
    const [txSearch, setTxSearch] = useState('');
    const [txFilter, setTxFilter] = useState<'all' | 'savings' | 'shares' | 'loans'>('all');
    const [txPage, setTxPage] = useState(1);
    const txPerPage = 15;

    useEffect(() => {
        if (!memberId) return;

        fetch(`/api/admin/members/${memberId}`)
            .then(res => {
                if (!res.ok) throw new Error('Member not found');
                return res.json();
            })
            .then(data => {
                setMember(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [memberId, refreshKey]);

    // Calculate running balances and filter
    const filteredTransactions = useMemo(() => {
        if (!member?.transactions) return [];

        // 1. Sort chronologically (oldest first) to calculate balances
        const sortedTx = [...member.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. Calculate running balances
        let savings = 0;
        let shares = 0;
        let loans = 0;

        const txWithBalances = sortedTx.map(tx => {
            const principal = Number(tx.amount) || 0;
            const interest = Number((tx as any).interestAmount) || 0;

            switch (tx.type) {
                case 'SAVINGS_DEPOSIT':
                    savings += principal;
                    break;
                case 'SAVINGS_WITHDRAWAL':
                    savings -= principal;
                    break;
                case 'SHARE_PURCHASE':
                    shares += principal;
                    break;
                case 'SHARE_WITHDRAWAL':
                    shares -= principal;
                    break;
                case 'LOAN_DISBURSAL':
                    loans += principal + interest;
                    break;
                case 'LOAN_REPAYMENT':
                    loans -= principal;
                    break;
            }

            return {
                ...tx,
                runningBalances: {
                    savings,
                    shares,
                    loans
                }
            };
        });

        // 3. Apply filters (on the enriched transactions)
        let result = txWithBalances.reverse(); // Show newest first by default

        // Search filter
        if (txSearch.trim()) {
            const query = txSearch.toLowerCase();
            result = result.filter(tx =>
                tx.type.toLowerCase().includes(query) ||
                tx.description.toLowerCase().includes(query) ||
                (tx.receiptNumber && tx.receiptNumber.includes(query)) ||
                tx.amount.toString().includes(query)
            );
        }

        // Type filter
        if (txFilter === 'savings') {
            result = result.filter(tx => tx.type.includes('SAVINGS'));
        } else if (txFilter === 'shares') {
            result = result.filter(tx => tx.type.includes('SHARE'));
        } else if (txFilter === 'loans') {
            result = result.filter(tx => tx.type.includes('LOAN'));
        }

        return result;
    }, [member?.transactions, txSearch, txFilter]);

    const handleEditClick = (tx: Transaction) => {
        setSelectedTx(tx);
        setEditModalOpen(true);
    };

    const handleReverseClick = (tx: Transaction) => {
        setSelectedTx(tx);
        setReverseModalOpen(true);
    };

    const handleSaveEdit = async (id: string, updates: any) => {
        try {
            const res = await fetch('/api/admin/transactions/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });

            if (res.ok) {
                setRefreshKey(prev => prev + 1);
            } else {
                alert("Failed to edit transaction");
            }
        } catch (e) {
            console.error(e);
            alert("Error editing transaction");
        }
    };

    const handleConfirmReverse = async (id: string, reason: string) => {
        try {
            const res = await fetch('/api/admin/transactions/reverse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, reason })
            });

            if (res.ok) {
                setRefreshKey(prev => prev + 1);
            } else {
                alert("Failed to reverse transaction");
            }
        } catch (e) {
            console.error(e);
            alert("Error reversing transaction");
        }
    };

    const totalTxPages = Math.ceil(filteredTransactions.length / txPerPage);
    const paginatedTransactions = useMemo(() => {
        const start = (txPage - 1) * txPerPage;
        return filteredTransactions.slice(start, start + txPerPage);
    }, [filteredTransactions, txPage]);

    // Reset page when filters change
    useEffect(() => {
        setTxPage(1);
    }, [txSearch, txFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !member) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Member Not Found</h2>
                <p className="text-gray-500 mb-6">{error || 'The requested member could not be found.'}</p>
                <Link href="/admin/members" className="text-blue-600 hover:underline">
                    ← Back to Members
                </Link>
            </div>
        );
    }

    const formatCurrency = (amount: number) => `GH₵ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    const getTypeColor = (type: string) => {
        if (type.includes('SAVINGS_DEPOSIT') || type.includes('SHARE_PURCHASE')) return 'bg-green-100 text-green-800';
        if (type.includes('SAVINGS_WITHDRAWAL') || type.includes('SHARE_WITHDRAWAL')) return 'bg-yellow-100 text-yellow-800';
        if (type.includes('LOAN_DISBURSAL')) return 'bg-red-100 text-red-800';
        if (type.includes('LOAN_REPAYMENT')) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };

    const isCredit = (type: string) =>
        type.includes('DEPOSIT') || type.includes('PURCHASE') || type.includes('REPAYMENT');

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/members" className="text-gray-500 hover:text-gray-700">
                        ← Back
                    </Link>
                    <h2 className="text-2xl font-bold dark:text-white">
                        {member.firstName} {member.lastName}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-mono">
                        {member.accountNumber}
                    </span>
                    <button
                        onClick={async () => {
                            if (!confirm("Are you sure you want to promote this member to Admin? They will have full access.")) return;
                            try {
                                const res = await fetch('/api/admin/members/promote', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ memberId: member.id })
                                });
                                if (res.ok) alert("Member promoted to Admin successfully.");
                                else alert("Failed to promote member.");
                            } catch (e) {
                                alert("Error promoting member.");
                            }
                        }}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded hover:bg-purple-200 border border-purple-200"
                    >
                        Promote to Admin
                    </button>
                    <button
                        onClick={async () => {
                            const newPassword = prompt("Enter new password for member:");
                            if (!newPassword) return;

                            try {
                                const res = await fetch('/api/admin/members/reset-password', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ memberId: member.id, newPassword })
                                });
                                if (res.ok) alert("Password reset successfully.");
                                else alert("Failed to reset password.");
                            } catch (e) {
                                alert("Error resetting password.");
                            }
                        }}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 border border-red-200"
                    >
                        Reset Password
                    </button>
                    <button
                        onClick={() => setEditMemberModalOpen(true)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 border border-green-200"
                    >
                        Edit Member
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                        <p className="text-lg font-medium dark:text-white">{member.firstName} {member.lastName}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-lg font-medium dark:text-white">{member.phone || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                        <p className="text-lg font-medium dark:text-white">{member.email || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-lg font-medium dark:text-white">{member.address || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Registration Date</label>
                        <p className="text-lg font-medium dark:text-white">{member.registrationDate ? formatDate(member.registrationDate) : '-'}</p>
                    </div>
                </div>
            </div>

            {/* Beneficiary Information */}
            {
                (member.beneficiaryName || member.beneficiaryRelationship) && (
                    <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Beneficiary Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Beneficiary Name</label>
                                <p className="text-lg font-medium dark:text-white">{member.beneficiaryName || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Relationship</label>
                                <p className="text-lg font-medium dark:text-white">{member.beneficiaryRelationship || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">Beneficiary Address</label>
                                <p className="text-lg font-medium dark:text-white">{member.beneficiaryAddress || '-'}</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Financial Summary - Three Accounts */}
            {(() => {
                // Get current live balances from the most recent transaction (first in filtered list)
                // Note: filteredTransactions is reversed (newest first)
                const latestTx = filteredTransactions[0];
                const liveSavings = latestTx?.runningBalances?.savings || 0;
                const liveShares = latestTx?.runningBalances?.shares || 0;
                const liveLoans = latestTx?.runningBalances?.loans || 0;

                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                            <h3 className="text-lg font-medium opacity-90">Savings Balance</h3>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(liveSavings)}</p>
                            <p className="text-xs opacity-75 mt-1">Calculated from history</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
                            <h3 className="text-lg font-medium opacity-90">Shares Balance</h3>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(liveShares)}</p>
                            <p className="text-xs opacity-75 mt-1">Calculated from history</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
                            <h3 className="text-lg font-medium opacity-90">Outstanding Loans</h3>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(liveLoans)}</p>
                            <p className="text-xs opacity-75 mt-1">Calculated from history</p>
                        </div>
                    </div>
                );
            })()}

            {/* Transaction History with Search/Filter/Pagination */}
            <div className="bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-6 border-b dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-lg font-bold dark:text-white">Transaction History</h3>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={txSearch}
                                onChange={(e) => setTxSearch(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <select
                                value={txFilter}
                                onChange={(e) => setTxFilter(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="all">All Types</option>
                                <option value="savings">Savings</option>
                                <option value="shares">Shares</option>
                                <option value="loans">Loans</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <th className="p-4 text-sm font-medium text-gray-500">Date</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Receipt #</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Type</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Amount</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Interest</th>
                                <th className="p-4 text-sm font-medium text-gray-500 bg-blue-50 dark:bg-blue-900/30">Savings Bal.</th>
                                <th className="p-4 text-sm font-medium text-gray-500 bg-green-50 dark:bg-green-900/30">Shares Bal.</th>
                                <th className="p-4 text-sm font-medium text-gray-500 bg-red-50 dark:bg-red-900/30">Loan Bal.</th>
                                <th className="p-4 text-sm font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((tx: any) => (
                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                        <td className="p-4 text-sm dark:text-gray-300">{formatDate(tx.date)}</td>
                                        <td className="p-4 text-sm font-mono dark:text-gray-300">{tx.receiptNumber || '-'}</td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(tx.type)}`}>
                                                {tx.type.replace(/_/g, ' ')}
                                            </span>
                                            {tx.isReversal && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 border border-red-200">REV</span>}
                                        </td>
                                        <td className={`p-4 text-sm font-medium ${isCredit(tx.type) ? 'text-green-600' : 'text-red-500'}`}>
                                            {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="p-4 text-sm text-orange-600 dark:text-orange-400">
                                            {tx.interestAmount > 0 ? formatCurrency(tx.interestAmount) : '-'}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-blue-600 bg-blue-50/50 dark:bg-blue-900/10">
                                            {formatCurrency(tx.runningBalances?.savings || 0)}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-green-600 bg-green-50/50 dark:bg-green-900/10">
                                            {formatCurrency(tx.runningBalances?.shares || 0)}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-red-600 bg-red-50/50 dark:bg-red-900/10">
                                            {formatCurrency(tx.runningBalances?.loans || 0)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!tx.isReversal && !tx.description.includes('REVERSAL') && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(tx)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleReverseClick(tx)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Reverse
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                        {txSearch || txFilter !== 'all'
                                            ? 'No transactions match your search criteria.'
                                            : 'No transactions found for this member.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalTxPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t dark:border-gray-700">
                        <button
                            onClick={() => setTxPage(p => Math.max(1, p - 1))}
                            disabled={txPage === 1}
                            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page {txPage} of {totalTxPages}
                        </span>

                        <button
                            onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                            disabled={txPage === totalTxPages}
                            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <EditTransactionModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                transaction={selectedTx}
                onSave={handleSaveEdit}
            />
            <ReverseTransactionModal
                isOpen={reverseModalOpen}
                onClose={() => setReverseModalOpen(false)}
                transaction={selectedTx}
                onConfirm={handleConfirmReverse}
            />
            <EditMemberModal
                isOpen={editMemberModalOpen}
                onClose={() => setEditMemberModalOpen(false)}
                member={member}
                onSave={() => setRefreshKey(prev => prev + 1)}
            />
        </div >
    );
}
