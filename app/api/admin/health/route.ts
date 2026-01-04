import { NextResponse } from 'next/server';

export async function GET() {
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
    };

    try {
        // Try to import prisma dynamically to catch import errors
        const { default: prisma } = await import('@/lib/prisma');
        diagnostics.prismaImported = true;

        // Try a simple query
        const userCount = await prisma.user.count?.() ?? 'count not available';
        diagnostics.userCount = userCount;
        diagnostics.dbConnected = true;

    } catch (error: any) {
        diagnostics.error = error.message;
        diagnostics.stack = error.stack?.split('\n').slice(0, 5);
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
