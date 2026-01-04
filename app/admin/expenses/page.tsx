
"use client";

import { useState, useEffect } from "react";

type Expense = { id: string; amount: number; description: string; date: string; category?: string };

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    // Form State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Operational");

    // Filter State
    const [categoryFilter, setCategoryFilter] = useState("All");

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = () => {
        fetch("/api/admin/expenses")
            .then(res => res.json())
            .then(setExpenses)
            .catch(console.error);
    };

    const handleEdit = (ex: Expense) => {
        setEditing(ex);
        setAmount(ex.amount.toString());
        setDescription(ex.description);
        setCategory(ex.category || "Operational");
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        try {
            await fetch(`/api/admin/expenses?id=${id}`, { method: "DELETE" });
            fetchExpenses();
        } catch (e) {
            alert("Error deleting");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = editing ? "PUT" : "POST";
            const body: any = { amount: parseFloat(amount), description, category };
            if (editing) body.id = editing.id;

            const res = await fetch("/api/admin/expenses", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                closeModal();
                fetchExpenses();
            } else {
                alert("Failed to save expense");
            }
        } catch (err) {
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
        setAmount("");
        setDescription("");
        setCategory("Operational");
    };

    const filteredExpenses = categoryFilter === "All"
        ? expenses
        : expenses.filter(e => e.category === categoryFilter);

    // Pagination could be added here similar to Transactions

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Expenses Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                    + Record Expense
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded shadow dark:bg-gray-800">
                <span className="text-sm font-medium dark:text-gray-300">Filter by Category:</span>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border p-1 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option>All</option>
                    <option>Operational</option>
                    <option>Administrative</option>
                    <option>Capital</option>
                    <option>Other</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Date</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Description</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Category</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Amount</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredExpenses.map((ex) => (
                            <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(ex.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium dark:text-white">
                                    {ex.description}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                        {ex.category || 'General'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600 dark:text-red-400">
                                    -{Number(ex.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-sm space-x-2">
                                    <button onClick={() => handleEdit(ex)} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(ex.id)} className="text-red-600 hover:underline">Delete</button>
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
                            {editing ? "Edit Expense" : "New Expense"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Amount</label>
                                <input
                                    type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Category</label>
                                <select
                                    value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option>Operational</option>
                                    <option>Administrative</option>
                                    <option>Capital</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Description</label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
