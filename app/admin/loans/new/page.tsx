"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoanAmortizationTable } from "@/components/LoanAmortizationTable";

export default function NewLoanPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [memberId, setMemberId] = useState("");
    const [amount, setAmount] = useState("");

    // Interest Handling
    const [interestType, setInterestType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [interestValue, setInterestValue] = useState("10"); // Default 10%

    const [purpose, setPurpose] = useState("");
    const [repaymentPeriod, setRepaymentPeriod] = useState("12");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Fetch members for dropdown
        fetch("/api/admin/members")
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId,
                    amount: parseFloat(amount),
                    purpose,
                    repaymentPeriod: parseInt(repaymentPeriod)
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to create loan request");
            }

            router.push("/admin/loans");
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Loan Request</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                {/* Member Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Member *
                    </label>
                    <select
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    >
                        <option value="">Select a member</option>
                        {members.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.accountNumber} - {m.firstName} {m.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Amount */}
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
                        min="1"
                        required
                    />
                </div>

                {/* Purpose */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Purpose
                    </label>
                    <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Business expansion, Emergency"
                    />
                </div>

                {/* Repayment Period */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Repayment Period (months)
                    </label>
                    <select
                        value={repaymentPeriod}
                        onChange={(e) => setRepaymentPeriod(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                        <option value="18">18 months</option>
                        <option value="24">24 months</option>
                        <option value="36">36 months</option>
                    </select>
                </div>

                {/* Interest Type Toggle */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Interest Calculation Method *
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                checked={interestType === "PERCENTAGE"}
                                onChange={() => {
                                    setInterestType("PERCENTAGE");
                                    setInterestValue("10"); // Reset to default %
                                }}
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Percentage Rate (per annum)</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                checked={interestType === "FIXED"}
                                onChange={() => {
                                    setInterestType("FIXED");
                                    setInterestValue("100"); // Reset to default amount
                                }}
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Total Interest Amount (Flat)</span>
                        </label>
                    </div>
                </div>

                {/* Interest Value Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {interestType === "PERCENTAGE" ? "Interest Rate (% per annum) *" : "Total Interest Amount (GH₵) *"}
                    </label>
                    <input
                        type="number"
                        value={interestValue}
                        onChange={(e) => setInterestValue(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder={interestType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
                        min="0"
                        step="0.1"
                        required
                    />
                </div>

                <LoanAmortizationTable
                    amount={parseFloat(amount) || 0}
                    interestType={interestType}
                    rateOrAmount={parseFloat(interestValue) || 0}
                    months={parseInt(repaymentPeriod) || 0}
                />

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Loan Request"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
