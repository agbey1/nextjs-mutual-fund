"use client";

import { useState, useEffect } from "react";
import {
    SavingsTrendChart,
    LoanDistributionChart,
    MonthlyContributionsChart
} from "./Charts";

interface AnalyticsData {
    monthlyTrends: { month: string; savings: number; shares: number }[];
    loanDistribution: { name: string; value: number }[];
    monthlyContributions: { month: string; deposits: number; withdrawals: number }[];
}

export function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch analytics data
        fetch("/api/analytics")
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load analytics:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!data) {
        return <p className="text-gray-500">Failed to load analytics data.</p>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold dark:text-white">Analytics</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Savings & Shares Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-4">Savings & Shares Trend</h4>
                    <SavingsTrendChart data={data.monthlyTrends} />
                </div>

                {/* Monthly Contributions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-4">Monthly Contributions</h4>
                    <MonthlyContributionsChart data={data.monthlyContributions} />
                </div>

                {/* Loan Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow lg:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-4">Loan Distribution by Status</h4>
                    <LoanDistributionChart data={data.loanDistribution} />
                </div>
            </div>
        </div>
    );
}
