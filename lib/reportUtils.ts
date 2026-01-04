"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface StatementData {
    member: {
        accountNumber: string;
        name: string;
        phone: string;
        email: string;
        address: string;
        totalSavings: number;
        totalShares: number;
        totalLoans: number;
        beneficiaryName: string;
    };
    transactions: {
        date: string;
        type: string;
        amount: number;
        principalAmount?: number;
        interestAmount?: number;
        description: string;
        reference: string;
    }[];
    generatedAt: string;
}

export async function generateMemberStatementPDF(memberId: string): Promise<void> {
    try {
        // Fetch statement data
        const res = await fetch(`/api/reports/statement?memberId=${memberId}`);
        if (!res.ok) throw new Error("Failed to fetch statement data");

        const data: StatementData = await res.json();

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235); // Blue
        doc.text("Calvary Impact Chapel", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Mutual Fund - Member Statement", pageWidth / 2, 28, { align: "center" });

        // Member Info
        doc.setFontSize(10);
        doc.text(`Account: ${data.member.accountNumber}`, 14, 45);
        doc.text(`Name: ${data.member.name}`, 14, 52);
        doc.text(`Phone: ${data.member.phone}`, 14, 59);
        doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 14, 66);

        // Balance Summary
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("Account Summary", 14, 80);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        const formatCurrency = (n: number) => `GH₵ ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        doc.text(`Total Savings: ${formatCurrency(data.member.totalSavings)}`, 14, 88);
        doc.text(`Total Shares: ${formatCurrency(data.member.totalShares)}`, 14, 95);
        doc.text(`Loan Balance: ${formatCurrency(data.member.totalLoans)}`, 14, 102);
        doc.text(`Beneficiary: ${data.member.beneficiaryName || 'Not specified'}`, 14, 109);

        // Transactions Table
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text("Transaction History", 14, 125);

        const tableData = data.transactions.map(tx => {
            const principal = tx.principalAmount || tx.amount;
            const interest = tx.interestAmount || 0;
            const total = principal + interest;
            return [
                new Date(tx.date).toLocaleDateString(),
                tx.type.replace(/_/g, ' '),
                formatCurrency(principal),
                interest > 0 ? formatCurrency(interest) : '-',
                formatCurrency(total),
                tx.reference || '-'
            ];
        });

        autoTable(doc, {
            startY: 130,
            head: [['Date', 'Type', 'Principal', 'Interest', 'Total', 'Ref']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 8 },
            columnStyles: {
                3: { textColor: [234, 88, 12] } // Orange for interest column
            }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable?.finalY || 200;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text("This is a computer-generated statement.", pageWidth / 2, finalY + 15, { align: "center" });

        // Save
        doc.save(`Statement_${data.member.accountNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Failed to generate statement PDF");
    }
}

export async function exportTransactionsExcel(filters?: { startDate?: string; endDate?: string; type?: string }): Promise<void> {
    try {
        const params = new URLSearchParams();
        if (filters?.startDate) params.set("startDate", filters.startDate);
        if (filters?.endDate) params.set("endDate", filters.endDate);
        if (filters?.type) params.set("type", filters.type);

        const res = await fetch(`/api/reports/transactions-export?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch export data");

        const { data } = await res.json();

        // Dynamic import xlsx only when needed
        const XLSX = (await import("xlsx")).default;

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");

        // Download
        XLSX.writeFile(wb, `Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
        console.error("Excel export error:", error);
        alert("Failed to export transactions");
    }
}

export async function downloadTransactionsCSV(filters?: { startDate?: string; endDate?: string; type?: string }): Promise<void> {
    try {
        const params = new URLSearchParams({ format: "csv" });
        if (filters?.startDate) params.set("startDate", filters.startDate);
        if (filters?.endDate) params.set("endDate", filters.endDate);
        if (filters?.type) params.set("type", filters.type);

        const res = await fetch(`/api/reports/transactions-export?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to download CSV");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("CSV download error:", error);
        alert("Failed to download CSV");
    }
}
