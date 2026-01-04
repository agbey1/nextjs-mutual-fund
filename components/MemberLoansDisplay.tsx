"use client";

import { useState, useEffect } from "react";

export function MemberLoansDisplay() {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/loans")
            .then(res => res.json())
            .then(data => {
                setLoans(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const formatCurrency = (amount: number) =>
        `GH₵ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    if (loading) {
        return <p className="text-gray-500">Loading loans...</p>;
    }

    if (loans.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400">No loan requests yet.</p>;
    }

    return (
        <div className="space-y-3">
            {loans.map((loan: any) => (
                <div
                    key={loan.id}
                    className="p-4 border rounded-lg dark:border-gray-700 flex justify-between items-center"
                >
                    <div>
                        <p className="font-medium dark:text-white">{formatCurrency(loan.amount)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{loan.purpose}</p>
                        <p className="text-xs text-gray-400">
                            {new Date(loan.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${loan.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            loan.status === "DISBURSED" ? "bg-green-100 text-green-800" :
                                "bg-red-100 text-red-800"
                        }`}>
                        {loan.status}
                    </span>
                </div>
            ))}
        </div>
    );
}
