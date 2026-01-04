
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format") || "json";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const type = searchParams.get("type");

        // Build filter
        const where: any = {};
        if (startDate) where.date = { ...where.date, gte: startDate };
        if (endDate) where.date = { ...where.date, lte: endDate };
        if (type) where.type = type;

        // Get transactions with member info
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: "desc" },
            include: { member: { select: { firstName: true, lastName: true, accountNumber: true } } }
        });

        // Format data for export
        const exportData = transactions.map((tx: any) => ({
            "Date": new Date(tx.date).toLocaleDateString(),
            "Member": `${tx.member?.firstName || ''} ${tx.member?.lastName || ''}`.trim() || 'Unknown',
            "Account": tx.member?.accountNumber || '-',
            "Type": tx.type.replace(/_/g, ' '),
            "Amount": tx.amount,
            "Description": tx.description || '-',
            "Reference": tx.reference || tx.receiptNo || '-'
        }));

        if (format === "csv") {
            // Generate CSV
            const headers = Object.keys(exportData[0] || {});
            const csvRows = [
                headers.join(","),
                ...exportData.map(row =>
                    headers.map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(",")
                )
            ];
            const csv = csvRows.join("\n");

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // Return JSON for client-side Excel generation
        return NextResponse.json({
            data: exportData,
            count: exportData.length,
            exportedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Export error:", e);
        return new NextResponse("Error exporting transactions", { status: 500 });
    }
}
