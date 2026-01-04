'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    accountNumber: string;
    phone: string;
    email: string | null;
    address: string;
    totalSavings: number;
    totalShares: number;
    totalLoans: number;
    gender: string;
    transactions: any[];
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState<'all' | 'withSavings' | 'withLoans'>('all');

    const itemsPerPage = 20;

    useEffect(() => {
        fetch('/api/admin/members')
            .then(res => res.json())
            .then(data => {
                setMembers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading members:', err);
                setLoading(false);
            });
    }, []);

    // Filter and search
    const filteredMembers = useMemo(() => {
        let result = members;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(m =>
                m.firstName.toLowerCase().includes(query) ||
                m.lastName.toLowerCase().includes(query) ||
                m.accountNumber.toLowerCase().includes(query) ||
                String(m.phone || '').includes(query) ||
                (m.email && m.email.toLowerCase().includes(query))
            );
        }

        // Type filter
        if (filterType === 'withSavings') {
            result = result.filter(m => (m.totalSavings || 0) > 0 || (m.totalShares || 0) > 0);
        } else if (filterType === 'withLoans') {
            result = result.filter(m => m.totalLoans > 0);
        }

        return result;
    }, [members, searchQuery, filterType]);

    // Pagination
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredMembers.slice(start, start + itemsPerPage);
    }, [filteredMembers, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType]);

    if (loading) {
        return <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">Member Management</h2>
                <Link
                    href="/admin/members/create"
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                    Add New Member
                </Link>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <input
                    type="text"
                    placeholder="Search by name, account, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="all">All Members</option>
                    <option value="withSavings">With Savings</option>
                    <option value="withLoans">With Active Loans</option>
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {paginatedMembers.length} of {filteredMembers.length} members
                </span>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <th className="p-4 text-sm font-medium text-gray-500">Account</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Name</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Phone</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Savings</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Shares</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Loans</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMembers.map((member) => (
                                <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                    <td className="p-4 text-sm font-mono dark:text-gray-300">{member.accountNumber}</td>
                                    <td className="p-4 text-sm font-medium dark:text-white">
                                        {member.firstName} {member.lastName}
                                    </td>
                                    <td className="p-4 text-sm dark:text-gray-300">{member.phone || '-'}</td>
                                    <td className="p-4 text-sm text-blue-600 font-medium">GH₵ {Number(member.totalSavings || 0).toFixed(2)}</td>
                                    <td className="p-4 text-sm text-green-600 font-medium">GH₵ {Number(member.totalShares || 0).toFixed(2)}</td>
                                    <td className="p-4 text-sm text-red-500 font-medium">GH₵ {Number(member.totalLoans || 0).toFixed(2)}</td>
                                    <td className="p-4 text-sm">
                                        <Link
                                            href={`/admin/members/${member.id}`}
                                            className="text-blue-600 hover:underline mr-3"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {paginatedMembers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        {searchQuery || filterType !== 'all'
                                            ? 'No members match your search criteria.'
                                            : 'No members found. Add one to get started.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 rounded border ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
