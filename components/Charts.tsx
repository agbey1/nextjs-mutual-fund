"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from "recharts";

// Colors for pie chart
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

interface SavingsTrendData {
    month: string;
    savings: number;
    shares: number;
}

interface LoanDistributionData {
    name: string;
    value: number;
}

interface MonthlyContributionData {
    month: string;
    deposits: number;
    withdrawals: number;
}

export function SavingsTrendChart({ data }: { data: SavingsTrendData[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                    name="Savings"
                />
                <Line
                    type="monotone"
                    dataKey="shares"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                    name="Shares"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function LoanDistributionChart({ data }: { data: LoanDistributionData[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => [`GH₵ ${value.toLocaleString()}`, 'Amount']}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function MonthlyContributionsChart({ data }: { data: MonthlyContributionData[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: number) => [`GH₵ ${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Bar dataKey="deposits" fill="#10B981" name="Deposits" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" fill="#EF4444" name="Withdrawals" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// Member count trend
export function MemberGrowthChart({ data }: { data: { month: string; members: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
                <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6' }}
                    name="Total Members"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
