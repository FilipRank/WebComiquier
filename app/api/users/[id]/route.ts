import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validation_schemas/user";
import { z } from "zod";

// GET - Retrieve a specific user by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                description: true,
                imageUri: true,
                createdAt: true,
                updatedAt: true,
                ownedComics: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        thumbnailUri: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: { subscriptions: true, comments: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

// PUT - Update a specific user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const body = await request.json();

        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: z.flattenError(validation.error),
            });
        }

        const { username, description, imageUri } = validation.data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(username && { username }),
                ...(description !== undefined && { description }),
                ...(imageUri !== undefined && { imageUri }),
            },
            select: {
                id: true,
                username: true,
                description: true,
                imageUri: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

// DELETE - Delete a specific user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Note: This will cascade delete related data based on Prisma schema
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
