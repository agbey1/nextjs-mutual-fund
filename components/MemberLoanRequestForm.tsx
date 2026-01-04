"use client";

import { useState } from "react";

export function MemberLoanRequestForm({ memberId }: { memberId: string }) {
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId,
                    amount: parseFloat(amount),
                    purpose,
                    repaymentPeriod: 12
                })
            });

            if (!res.ok) {
                throw new Error("Failed to submit loan request");
            }

            setMessage("Loan request submitted successfully! Please wait for admin approval.");
            setAmount("");
            setPurpose("");
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
                <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{message}</div>
            )}
            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loan Amount (GH₵) *
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter amount"
                    min="100"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose *
                </label>
                <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Business expansion, Emergency"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Submitting..." : "Request Loan"}
            </button>
        </form>
    );
}
