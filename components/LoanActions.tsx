"use client";

export function LoanActions({ loanId }: { loanId: string }) {
    const handleApprove = async () => {
        if (confirm("Approve and disburse this loan?")) {
            await fetch(`/api/loans/${loanId}/approve`, { method: "POST" });
            window.location.reload();
        }
    };

    const handleReject = async () => {
        const reason = prompt("Reason for rejection?");
        if (reason !== null) {
            await fetch(`/api/loans/${loanId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason })
            });
            window.location.reload();
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleApprove}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
                Approve
            </button>
            <button
                onClick={handleReject}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
                Reject
            </button>
        </div>
    );
}
