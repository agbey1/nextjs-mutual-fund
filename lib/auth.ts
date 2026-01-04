import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const username = credentials.username as string;
                const password = credentials.password as string;

                // Fetch user
                const user = await prisma.user.findUnique({
                    where: { username },
                    include: { member: true },
                });

                if (!user) {
                    return null;
                }

                // Verify Hash
                if (!verifyPassword(password, user.password)) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    memberId: user.member?.id
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.memberId = user.memberId;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token) {
                session.user.id = token.sub; // Add user ID to session
                session.user.role = token.role;
                session.user.memberId = token.memberId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        signOut: "/login",
    },
});
