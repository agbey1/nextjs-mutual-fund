import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "ADMIN" | "MEMBER";
            memberId?: string;
        } & DefaultSession["user"];
    }

    interface User {
        role: "ADMIN" | "MEMBER";
        memberId?: string;
    }
}
