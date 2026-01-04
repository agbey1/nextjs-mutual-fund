"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function DateFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [date, setDate] = useState(searchParams.get("date") || "");

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);
        const params = new URLSearchParams(searchParams);
        if (newDate) {
            params.set("date", newDate);
        } else {
            params.delete("date");
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded shadow">
            <span className="text-sm font-medium text-gray-500">Balances As Of:</span>
            <input
                type="date"
                value={date}
                onChange={handleDateChange}
                className="border p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
            />
            {date && (
                <button
                    onClick={() => {
                        setDate("");
                        router.replace(pathname);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                    Clear
                </button>
            )}
        </div>
    );
}
