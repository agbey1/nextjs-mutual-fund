"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
    const handleSignOut = () => {
        // Use window.location.origin to ensure correct domain redirect
        const callbackUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/login`
            : '/login';
        signOut({ callbackUrl });
    };

    return (
        <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-red-400 border border-red-400/50 rounded-lg hover:bg-red-500/10 transition-colors"
        >
            Sign Out
        </button>
    );
}


