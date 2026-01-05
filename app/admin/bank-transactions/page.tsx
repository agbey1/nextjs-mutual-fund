
"use client";

import { useState, useEffect, useMemo } from "react";

type BankTransaction = {
    id: string;
    amount: number;
    description: string;
    date: string;
    createdAt: string;
    type: "DEPOSIT" | "WITHDRAWAL";
    reference?: string;
};

export default function BankTransactionsPage() {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    // Search & Filter State
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL">("ALL");

    // Pagination State
    const [page, setPage] = useState(1);
    const perPage = 15;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<BankTransaction | null>(null);

    // Form State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
    const [reference, setReference] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, typeFilter]);

    const fetchTransactions = () => {
        setLoading(true);
        fetch("/api/admin/bank-transactions")
            .then(res => res.json())
            .then(data => {
                setTransactions(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    // Filtered and paginated transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = search === "" ||
                tx.description?.toLowerCase().includes(search.toLowerCase()) ||
                tx.reference?.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [transactions, search, typeFilter]);

    const totalPages = Math.ceil(filteredTransactions.length / perPage);
    const paginatedTransactions = filteredTransactions.slice((page - 1) * perPage, page * perPage);

    const handleEdit = (tx: BankTransaction) => {
        setEditing(tx);
        setAmount(tx.amount.toString());
        setDescription(tx.description || "");
        setType(tx.type);
        setReference(tx.reference || "");
        setDate(new Date(tx.date).toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await fetch(`/api/admin/bank-transactions?id=${id}`, { method: "DELETE" });
            fetchTransactions();
        } catch (e) {
            alert("Error deleting");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editing ? "PUT" : "POST";
            const body: any = {
                amount: parseFloat(amount),
                description,
                type,
                date,
                reference
            };
            if (editing) body.id = editing.id;

            const res = await fetch("/api/admin/bank-transactions", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                closeModal();
                fetchTransactions();
            } else {
                alert("Failed to save transaction");
            }
        } catch (err) {
            alert("Error saving");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
        setAmount("");
        setDescription("");
        setType("DEPOSIT");
        setReference("");
        setDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Bank Transactions</h2>
                <button
                    onClick={() => { closeModal(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Record Bank Transaction
                </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search by description or reference..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Type:</span>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="ALL">All</option>
                        <option value="DEPOSIT">Deposit</option>
                        <option value="WITHDRAWAL">Withdrawal</option>
                    </select>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {paginatedTransactions.length} of {filteredTransactions.length} records
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Transaction Date</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Entry Date (System)</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Description / Payer</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Type</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Ref</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Amount</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {loading ? (
                            <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                        ) : paginatedTransactions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No transactions found</td></tr>
                        ) : paginatedTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium dark:text-white">
                                    {new Date(tx.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(tx.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium dark:text-white">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${tx.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 font-mono text-xs">
                                    {tx.reference}
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-sm space-x-2">
                                    <button onClick={() => handleEdit(tx)} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                            if (pageNum > totalPages) return null;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`px-3 py-1 border rounded text-sm ${page === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold dark:text-white">
                            {editing ? "Edit Transaction" : "New Bank Transaction"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Date</label>
                                <input
                                    type="date" value={date} onChange={e => setDate(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Type</label>
                                <select
                                    value={type} onChange={e => setType(e.target.value as any)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="DEPOSIT">Deposit</option>
                                    <option value="WITHDRAWAL">Withdrawal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Amount</label>
                                <input
                                    type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Description / Paid By</label>
                                <input
                                    type="text" value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Reference (Optional)</label>
                                <input
                                    type="text" value={reference} onChange={e => setReference(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

