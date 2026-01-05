
"use client";

import { useState, useEffect } from "react";

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
                        ) : transactions.map((tx) => (
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
