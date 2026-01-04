"use client";

import { useState, useEffect } from "react";
import {
    generateMemberStatementPDF,
    exportTransactionsExcel,
    downloadTransactionsCSV
} from "@/lib/reportUtils";

export default function AdminReportsPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [transactionType, setTransactionType] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/admin/members")
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error(err));
    }, []);

    const handleGenerateStatement = async () => {
        if (!selectedMember) {
            alert("Please select a member");
            return;
        }
        setLoading(true);
        await generateMemberStatementPDF(selectedMember);
        setLoading(false);
    };

    const handleExportExcel = async () => {
        setLoading(true);
        await exportTransactionsExcel({ startDate, endDate, type: transactionType });
        setLoading(false);
    };

    const handleExportCSV = async () => {
        setLoading(true);
        await downloadTransactionsCSV({ startDate, endDate, type: transactionType });
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold dark:text-white">Reports & Export</h2>
                <p className="text-gray-600 dark:text-gray-400">Generate statements and export transaction data</p>
            </div>

            {/* Member Statement Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Member Statement</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Generate a PDF statement for a specific member
                </p>

                <div className="flex flex-col md:flex-row gap-4">
                    <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select a member</option>
                        {members.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.accountNumber} - {m.firstName} {m.lastName}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleGenerateStatement}
                        disabled={loading || !selectedMember}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Generating..." : "Generate PDF"}
                    </button>
                </div>
            </div>

            {/* Transaction Export Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Transaction Export</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Export all transactions to Excel or CSV
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Transaction Type
                        </label>
                        <select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">All Types</option>
                            <option value="SAVINGS_DEPOSIT">Savings Deposit</option>
                            <option value="SAVINGS_WITHDRAWAL">Savings Withdrawal</option>
                            <option value="SHARE_PURCHASE">Share Purchase</option>
                            <option value="SHARE_WITHDRAWAL">Share Withdrawal</option>
                            <option value="LOAN_DISBURSAL">Loan Disbursal</option>
                            <option value="LOAN_REPAYMENT">Loan Repayment</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleExportExcel}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Exporting..." : "Export Excel"}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={loading}
                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                        {loading ? "Exporting..." : "Export CSV"}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Report Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{members.length}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reports Generated</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">-</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Exports Today</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">-</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
