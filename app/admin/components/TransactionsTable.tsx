
"use client";

import { useState, useEffect } from "react";

export function TransactionsTable() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reversing, setReversing] = useState<string | null>(null);

    // Filter/Pagination State
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                take: pageSize.toString(),
                skip: (page * pageSize).toString(),
                search
            });
            const res = await fetch(`/api/transactions?${query.toString()}`);
            const json = await res.json();

            // Handle both old (array) and new ({data, meta}) formats gracefully (for safety)
            if (Array.isArray(json)) {
                setTransactions(json);
                setTotal(json.length);
            } else {
                setTransactions(json.data || []);
                setTotal(json.meta?.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, pageSize]); // Auto-fetch on pagination change

    // Search handler (debounce could be added, but manual for now or direct)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0); // Reset to first page
        fetchTransactions();
    };

    const handleReverse = async (tx: any) => {
        const reason = window.prompt(`Enter reason for reversing transaction ${tx.reference || tx.id}:`);
        if (!reason) return;

        if (!confirm(`Are you sure you want to reverse this ${tx.type} of ${tx.amount}? This will perform a counter-transaction.`)) return;

        setReversing(tx.id);
        try {
            const res = await fetch("/api/transactions/reverse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId: tx.id, reason })
            });

            if (!res.ok) {
                const err = await res.text();
                alert("Reversal Failed: " + err);
            } else {
                alert("Transaction Reversed Successfully.");
                fetchTransactions();
            }
        } catch (error) {
            console.error(error);
            alert("Network error during reversal.");
        } finally {
            setReversing(null);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mt-8">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-bold dark:text-white">Recent Transactions</h3>

                {/* Search & Filter */}
                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search Member, Reference..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-full"
                    />
                    <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        Search
                    </button>
                    <button type="button" onClick={() => { setSearch(""); setPage(0); fetchTransactions(); }} className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">
                        Clear
                    </button>
                </form>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Date</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Ref</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Member</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Type</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Amount</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {loading && (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                        )}
                        {!loading && transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {tx.reference || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    {tx.member ? `${tx.member.firstName} ${tx.member.lastName}` : 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.type.includes('DEPOSIT') || tx.type === 'LOAN_REPAYMENT' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                    {Number(tx.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {!tx.description?.startsWith('Reversal:') ? (
                                        <button
                                            onClick={() => handleReverse(tx)}
                                            disabled={!!reversing}
                                            className="text-red-600 hover:text-red-800 underline text-xs disabled:opacity-50"
                                        >
                                            {reversing === tx.id ? 'Reversing...' : 'Reverse'}
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">Is Reversal</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && transactions.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No transactions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {page + 1} of {Math.max(1, totalPages)} ({total} records)
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
