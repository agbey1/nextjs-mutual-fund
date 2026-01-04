import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { amount, description, category } = body;

        const expense = await prisma.expense.create({
            data: {
                amount: parseFloat(amount),
                description,
                category,
                recordedBy: session?.user?.id!
            }
        });

        return NextResponse.json(expense);
    } catch (e) {
        console.error(e);
        return new NextResponse("Error recording expense", { status: 500 });
    }
}

// GET: Fetch Expenses
export async function GET(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
        take: 50
    });
    return NextResponse.json(expenses);
}

// PUT: Update Expense
export async function PUT(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { id, amount, description, category } = body;

        const updated = await prisma.expense.update({
            where: { id },
            data: {
                amount: parseFloat(amount),
                description,
                category
            }
        });

        // Audit Log
        /* await logAction("UPDATE_EXPENSE", "EXPENSE", id, { amount, description }); */

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return new NextResponse("Error updating expense", { status: 500 });
    }
}

// DELETE: Delete Expense
export async function DELETE(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return new NextResponse("ID required", { status: 400 });

        await prisma.expense.delete({
            where: { id }
        });

        // Audit Log
        /* await logAction("DELETE_EXPENSE", "EXPENSE", id, {}); */

        return new NextResponse("Deleted", { status: 200 });
    } catch (e) {
        console.error(e);
        return new NextResponse("Error deleting expense", { status: 500 });
    }
}
