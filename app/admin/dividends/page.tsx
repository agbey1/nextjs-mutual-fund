"use client";

import { useState, useEffect } from "react";

export default function DividendsPage() {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [totalAmount, setTotalAmount] = useState("");
    const [preview, setPreview] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Fetch distribution history
        fetch("/api/admin/dividends")
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err));
    }, []);

    const handlePreview = async () => {
        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setLoading(true);
        setPreview(null);
        setMessage("");

        try {
            const res = await fetch("/api/admin/dividends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "preview",
                    totalAmount: parseFloat(totalAmount),
                    year
                })
            });
            const data = await res.json();
            setPreview(data);
        } catch (err) {
            console.error(err);
            alert("Error calculating preview");
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!confirm(`Are you sure you want to distribute GH₵ ${totalAmount} to ${preview?.totalMembers} members for year ${year}? This action cannot be undone.`)) {
            return;
        }

        setExecuting(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/dividends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "execute",
                    totalAmount: parseFloat(totalAmount),
                    year,
                    distributionMethod: "SHARE_BASED"
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessage(`Successfully distributed GH₵ ${data.totalAmount} to ${data.membersReceived} members!`);
                setPreview(null);
                setTotalAmount("");
                // Refresh history
                const histRes = await fetch("/api/admin/dividends");
                setHistory(await histRes.json());
            } else {
                throw new Error("Distribution failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error executing distribution");
        } finally {
            setExecuting(false);
        }
    };

    const formatCurrency = (amount: number) =>
        `GH₵ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold dark:text-white">Dividend Distribution</h2>
                <p className="text-gray-600 dark:text-gray-400">Calculate and distribute year-end dividends to members</p>
            </div>

            {message && (
                <div className="p-4 bg-green-100 text-green-700 rounded-md">{message}</div>
            )}

            {/* Distribution Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 dark:text-white">New Distribution</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Year
                        </label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {[...Array(5)].map((_, i) => {
                                const y = new Date().getFullYear() - i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total Amount to Distribute (GH₵)
                        </label>
                        <input
                            type="number"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter total amount"
                            min="1"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handlePreview}
                            disabled={loading || !totalAmount}
                            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Calculating..." : "Calculate Preview"}
                        </button>
                    </div>
                </div>

                {/* Preview Results */}
                {preview && !preview.error && (
                    <div className="border-t dark:border-gray-700 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold dark:text-white">Distribution Preview</h4>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Total Shares: {preview.totalShares?.toLocaleString()} |
                                Members: {preview.totalMembers}
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left text-gray-500 dark:text-gray-300">Member</th>
                                        <th className="p-3 text-left text-gray-500 dark:text-gray-300">Account</th>
                                        <th className="p-3 text-right text-gray-500 dark:text-gray-300">Shares</th>
                                        <th className="p-3 text-right text-gray-500 dark:text-gray-300">%</th>
                                        <th className="p-3 text-right text-gray-500 dark:text-gray-300">Dividend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {preview.preview?.map((m: any) => (
                                        <tr key={m.memberId}>
                                            <td className="p-3 dark:text-white">{m.memberName}</td>
                                            <td className="p-3 text-gray-500 dark:text-gray-400">{m.accountNumber}</td>
                                            <td className="p-3 text-right dark:text-white">{m.shares.toLocaleString()}</td>
                                            <td className="p-3 text-right text-gray-500 dark:text-gray-400">{m.sharePercentage}%</td>
                                            <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">
                                                {formatCurrency(m.dividendAmount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleExecute}
                                disabled={executing}
                                className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                            >
                                {executing ? "Distributing..." : `Execute Distribution (${formatCurrency(parseFloat(totalAmount))})`}
                            </button>
                        </div>
                    </div>
                )}

                {preview?.error && (
                    <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
                        {preview.error}
                    </div>
                )}
            </div>

            {/* Distribution History */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Distribution History</h3>

                {history.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No distributions yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3 text-left text-gray-500 dark:text-gray-300">Year</th>
                                    <th className="p-3 text-left text-gray-500 dark:text-gray-300">Date</th>
                                    <th className="p-3 text-right text-gray-500 dark:text-gray-300">Amount</th>
                                    <th className="p-3 text-right text-gray-500 dark:text-gray-300">Members</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {history.map((h: any) => (
                                    <tr key={h.id}>
                                        <td className="p-3 font-medium dark:text-white">{h.year}</td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400">
                                            {new Date(h.distributedAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 text-right text-green-600 dark:text-green-400 font-medium">
                                            {formatCurrency(h.totalAmount)}
                                        </td>
                                        <td className="p-3 text-right dark:text-white">{h.totalMembers}</td>
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
