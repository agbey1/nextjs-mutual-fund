
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AuditLogPage() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/login");

    const logs = await prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        // include: { user: true } // Mock prisma simplistic support
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white">Audit Trail</h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Timestamp</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Action</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Entity</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">User</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {logs.map((log: any) => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    <span className={`px-2 py-1 rounded-full text-xs ${log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                                            log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {log.entityType} #{log.entityId}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {log.userId}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={log.details}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
