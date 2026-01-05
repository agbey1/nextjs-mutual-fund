"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function DateFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

    const applyFilter = () => {
        const params = new URLSearchParams(searchParams);
        if (startDate) {
            params.set("startDate", startDate);
        } else {
            params.delete("startDate");
        }
        if (endDate) {
            params.set("endDate", endDate);
        } else {
            params.delete("endDate");
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const clearFilter = () => {
        setStartDate("");
        setEndDate("");
        router.replace(pathname);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded shadow">
            <span className="text-sm font-medium text-gray-500">Filter Period:</span>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Start Date"
            />
            <span className="text-gray-400">to</span>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
                placeholder="End Date"
            />
            <button
                onClick={applyFilter}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
                Apply
            </button>
            {(startDate || endDate) && (
                <button
                    onClick={clearFilter}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                    Clear
                </button>
            )}
        </div>
    );
}
