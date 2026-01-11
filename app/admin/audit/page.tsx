
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/login");

    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const take = 50;
    const skip = (page - 1) * take;

    const action = params?.action || "";
    const entityType = params?.entityType || "";
    const search = params?.search || "";

    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityType) where.entityType = { equals: entityType };
    if (search) {
        where.OR = [
            { details: { contains: search, mode: 'insensitive' } },
            { userId: { contains: search, mode: 'insensitive' } },
            { entityId: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            take,
            skip,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold dark:text-white">Audit Trail</h2>

                {/* Filters Form */}
                <form className="flex flex-wrap gap-2 w-full md:w-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <select
                        name="entityType"
                        defaultValue={entityType}
                        className="px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Entities</option>
                        <option value="MEMBER">Member</option>
                        <option value="TRANSACTION">Transaction</option>
                        <option value="EXPENSE">Expense</option>
                        <option value="USER">User</option>
                    </select>

                    <input
                        type="text"
                        name="action"
                        placeholder="Action (e.g. CREATE)"
                        defaultValue={action}
                        className="px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="text"
                        name="search"
                        placeholder="Search Details/User/ID..."
                        defaultValue={search}
                        className="px-3 py-2 border rounded text-sm w-full md:w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">
                        Filter
                    </button>

                    {(action || entityType || search) && (
                        <Link href="/admin/audit" className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition dark:bg-gray-700 dark:text-gray-300">
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            {/* Scrollable Table Container */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left relative">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 bg-gray-50 dark:bg-gray-700">Timestamp</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 bg-gray-50 dark:bg-gray-700">Action</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 bg-gray-50 dark:bg-gray-700">Entity</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 bg-gray-50 dark:bg-gray-700">User</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 bg-gray-50 dark:bg-gray-700">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                                                log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                                    log.action.includes('UPDATE') ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                        <span className="font-mono">{log.entityType}</span>
                                        {log.entityId && <span className="text-xs text-gray-400 ml-1">#{log.entityId.slice(-4)}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                        {log.userId}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-md truncate" title={log.details || ''}>
                                        {log.details || '-'}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Stats */}
                <div className="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center shrink-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-medium">{logs.length > 0 ? skip + 1 : 0}</span> to <span className="font-medium">{Math.min(skip + logs.length, total)}</span> of <span className="font-medium">{total}</span> results
                    </p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link
                                href={{ pathname: '/admin/audit', query: { ...params, page: page - 1 } }}
                                className="px-3 py-1 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50"
                            >
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={{ pathname: '/admin/audit', query: { ...params, page: page + 1 } }}
                                className="px-3 py-1 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
