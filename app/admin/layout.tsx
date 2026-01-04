import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md dark:bg-gray-800 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Calvary Fund</h1>
                    <p className="text-xs text-gray-500">Admin Portal</p>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Dashboard
                    </Link>
                    <Link href="/admin/members" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Members
                    </Link>
                    <Link href="/admin/transactions" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Transactions
                    </Link>
                    <Link href="/admin/expenses" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Expenses
                    </Link>
                    <Link href="/admin/bank-transactions" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Bank Transactions
                    </Link>
                    <Link href="/admin/loans" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Loans
                    </Link>
                    <Link href="/admin/reports" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Reports
                    </Link>
                    <Link href="/admin/dividends" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Dividends
                    </Link>
                    <Link href="/admin/audit" className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Audit Trail
                    </Link>
                </nav>
                <div className="p-4 border-t dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                            A
                        </div>
                        <div>
                            <p className="text-sm font-medium dark:text-white">Admin</p>
                            <p className="text-xs text-gray-500">System Administrator</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white p-4 shadow flex justify-between items-center">
                    <span className="font-bold">Calvary Fund Admin</span>
                    {/* TODO: Mobile Menu Toggle */}
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
