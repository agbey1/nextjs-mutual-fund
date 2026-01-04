"use client";

import { useState } from "react";
import { generateMemberStatementPDF } from "@/lib/reportUtils";

export function DownloadStatementButton({ memberId }: { memberId: string }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        await generateMemberStatementPDF(memberId);
        setLoading(false);
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
            {loading ? "Generating..." : "Download Statement PDF"}
        </button>
    );
}
