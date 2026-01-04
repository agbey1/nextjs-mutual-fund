"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
        >
            Sign Out
        </button>
    );
}
