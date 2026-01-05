import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CollapsibleSidebar } from "@/components/admin/CollapsibleSidebar";

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
            <CollapsibleSidebar user={session.user} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Spacer */}
                <div className="md:hidden h-16" />

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

