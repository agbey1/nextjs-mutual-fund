'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/members', label: 'Members', icon: '👥' },
    { href: '/admin/transactions', label: 'Transactions', icon: '💰' },
    { href: '/admin/expenses', label: 'Expenses', icon: '📝' },
    { href: '/admin/bank-transactions', label: 'Bank Transactions', icon: '🏦' },
    { href: '/admin/loans', label: 'Loans', icon: '💳' },
    { href: '/admin/reports', label: 'Reports', icon: '📈' },
    { href: '/admin/dividends', label: 'Dividends', icon: '💸' },
    { href: '/admin/audit', label: 'Audit Trail', icon: '🔍' },
];

export function CollapsibleSidebar({ user }: { user?: { name?: string | null } }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname?.startsWith(href);
    };

    const Sidebar = () => (
        <aside
            className={`
                bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
                text-white shadow-xl flex flex-col transition-all duration-300 ease-in-out
                ${collapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* Header */}
            <div className={`p-4 border-b border-gray-700/50 ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? (
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                        C
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                            CF
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Calvary Fund
                            </h1>
                            <p className="text-xs text-gray-400">Admin Portal</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full items-center justify-center shadow-lg border border-gray-600 transition-colors"
            >
                <svg
                    className={`w-4 h-4 text-gray-300 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                            ${isActive(item.href)
                                ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white shadow-lg'
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            }
                            ${collapsed ? 'justify-center' : ''}
                        `}
                        title={collapsed ? item.label : undefined}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            {/* User Section */}
            <div className={`p-4 border-t border-gray-700/50 ${collapsed ? 'text-center' : ''}`}>
                {!collapsed && (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-sm shadow">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-400">Administrator</p>
                        </div>
                    </div>
                )}
                <LogoutButton />
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex relative">
                <Sidebar />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold shadow">
                        CF
                    </div>
                    <span className="font-bold">Calvary Fund</span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-64">
                        <Sidebar />
                    </div>
                </div>
            )}
        </>
    );
}
