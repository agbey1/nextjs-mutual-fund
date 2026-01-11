"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TransactionsTable } from "../components/TransactionsTable";

type Member = { id: string; firstName: string; lastName: string; accountNumber: string };

export default function TransactionPage() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Loan Interest State
    const [interestMode, setInterestMode] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
    const [interestValue, setInterestValue] = useState("");

    const [formData, setFormData] = useState({
        memberId: "",
        type: "DEPOSIT",
        amount: "",
        interestAmount: "0",
        principalAmount: "",
        description: "",
        reference: "",
        date: new Date().toISOString().split('T')[0] // Default to today
    });

    useEffect(() => {
        // Fetch members for dropdown
        fetch("/api/admin/members")
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(console.error);
    }, []);

    // Filter members based on search
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return [];
        const lower = searchQuery.toLowerCase();
        return members.filter(m =>
            m.firstName.toLowerCase().includes(lower) ||
            m.lastName.toLowerCase().includes(lower) ||
            m.accountNumber.includes(lower)
        ).slice(0, 10); // Limit to 10 results for performance
    }, [members, searchQuery]);

    const selectMember = (member: Member) => {
        setFormData({ ...formData, memberId: member.id });
        setSearchQuery(`${member.firstName} ${member.lastName} (${member.accountNumber})`);
        setShowSuggestions(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");

        if (!formData.memberId) {
            setError("Please select a member first.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to record transaction");
            }

            setSuccess("Transaction recorded successfully!");
            // Reset form
            setFormData({
                memberId: "",
                type: "DEPOSIT",
                amount: "",
                interestAmount: "0",
                principalAmount: "",
                description: "",
                reference: "",
                date: new Date().toISOString().split('T')[0]
            });
            setInterestValue("");
            setSearchQuery("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isLoanRepayment = formData.type === "LOAN_REPAYMENT";

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold dark:text-white">Record Transaction</h2>

            {success && (
                <div className="p-3 text-green-700 bg-green-100 rounded border border-green-200">
                    {success}
                </div>
            )}

            {error && (
                <div className="p-3 text-red-700 bg-red-100 rounded border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                {/* Searchable Member Select */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Search</label>
                    <input
                        type="text"
                        placeholder="Search by name or account number..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                            if (e.target.value === "") setFormData({ ...formData, memberId: "" });
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && searchQuery && filteredMembers.length > 0 && (
                        <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredMembers.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => selectMember(m)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b last:border-0 dark:border-gray-600"
                                >
                                    <p className="font-medium dark:text-white">{m.firstName} {m.lastName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{m.accountNumber}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {showSuggestions && searchQuery && filteredMembers.length === 0 && (
                        <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border p-2 text-gray-500 rounded-b-lg shadow-lg">
                            No members found.
                        </div>
                    )}
                </div>

                {formData.memberId && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-sm text-blue-700 dark:text-blue-300">
                        Selected: <strong>{searchQuery}</strong>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="DEPOSIT">Savings Deposit</option>
                        <option value="WITHDRAWAL">Savings Withdrawal</option>
                        <option value="SHARE_PURCHASE">Share Purchase</option>
                        <option value="SHARE_WITHDRAWAL">Share Withdrawal</option>
                        <option value="LOAN_DISBURSAL">Loan Disbursal (Give Loan)</option>
                        <option value="LOAN_REPAYMENT">Loan Repayment (Pay Loan)</option>
                        <option value="LOAN_FINE">Loan Fine (Penalty)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Date (Manual)</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>

                {/* LOAN DISBURSAL INTEREST LOGIC */}
                {formData.type === "LOAN_DISBURSAL" && (
                    <div className="p-4 bg-blue-50 rounded dark:bg-blue-900 border dark:border-blue-700 space-y-3">
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">Loan Interest Calculation</h4>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    name="interestMode"
                                    checked={interestMode === 'PERCENTAGE'}
                                    onChange={() => setInterestMode('PERCENTAGE')}
                                    className="focus:ring-blue-500"
                                />
                                Percentage (%)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    name="interestMode"
                                    checked={interestMode === 'FIXED'}
                                    onChange={() => setInterestMode('FIXED')}
                                    className="focus:ring-blue-500"
                                />
                                Fixed Amount (GH₵)
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {interestMode === 'PERCENTAGE' ? 'Interest Rate (%)' : 'Interest Amount (GH₵)'}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={interestValue}
                                    onChange={(e) => {
                                        setInterestValue(e.target.value);
                                        // Auto-calculate logic handled in effect or submit, but let's do real-time for UX
                                        if (interestMode === 'PERCENTAGE' && formData.amount) {
                                            const rate = parseFloat(e.target.value) || 0;
                                            const principal = parseFloat(formData.amount) || 0;
                                            const calculated = (principal * rate) / 100;
                                            setFormData(prev => ({ ...prev, interestAmount: calculated.toFixed(2) }));
                                        } else if (interestMode === 'FIXED') {
                                            setFormData(prev => ({ ...prev, interestAmount: e.target.value }));
                                        }
                                    }}
                                    className="w-full mt-1 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder={interestMode === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Calculated Interest</label>
                                <input
                                    type="number"
                                    value={formData.interestAmount}
                                    readOnly
                                    className="w-full mt-1 p-2 border rounded text-sm bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                            Total Outstanding Loan will increase by: GH₵ {(parseFloat(formData.amount || "0") + parseFloat(formData.interestAmount || "0")).toLocaleString()}
                        </p>
                    </div>
                )}

                {isLoanRepayment && (
                    <div className="p-4 bg-yellow-50 rounded dark:bg-yellow-900 border dark:border-yellow-700">
                        <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">Repayment Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Principal Portion</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="principalAmount"
                                    value={formData.principalAmount}
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Interest Portion</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="interestAmount"
                                    value={formData.interestAmount}
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g. 50"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Sum should equal Total Amount.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference / Receipt #</label>
                    <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={2}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                    {loading ? "Processing..." : "Submit Transaction"}
                </button>
            </form>

            <TransactionsTable />
        </div>
    );
}
