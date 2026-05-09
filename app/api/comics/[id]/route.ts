import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateComicSchema } from "@/lib/validation_schemas/comic";

// GET - Retrieve a specific comic by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const comic = await prisma.comic.findUnique({
            where: { id: params.id },
            include: {
                author: {
                    select: { id: true, username: true, imageUri: true },
                },
                pages: {
                    orderBy: { index: "asc" },
                    include: {
                        _count: {
                            select: { comments: true },
                        },
                    },
                },
                _count: {
                    select: { subscriptions: true },
                },
            },
        });

        if (!comic) {
            return NextResponse.json({ error: "Comic not found" }, { status: 404 });
        }

        return NextResponse.json(comic);
    } catch (error) {
        console.error("Failed to fetch comic:", error);
        return NextResponse.json({ error: "Failed to fetch comic" }, { status: 500 });
    }
}

// PUT - Update a specific comic
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validationResult = updateComicSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 },
            );
        }

        // Check if comic exists
        const existingComic = await prisma.comic.findUnique({
            where: { id: params.id },
        });

        if (!existingComic) {
            return NextResponse.json({ error: "Comic not found" }, { status: 404 });
        }

        const { title, description, thumbnailUri, status } = validationResult.data;

        const updatedComic = await prisma.comic.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(thumbnailUri !== undefined && { thumbnailUri }),
                ...(status && { status }),
            },
            include: {
                author: {
                    select: { id: true, username: true, imageUri: true },
                },
                _count: {
                    select: { pages: true, subscriptions: true },
                },
            },
        });

        return NextResponse.json(updatedComic);
    } catch (error) {
        console.error("Failed to update comic:", error);
        return NextResponse.json({ error: "Failed to update comic" }, { status: 500 });
    }
}

// DELETE - Delete a specific comic
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check if comic exists
        const existingComic = await prisma.comic.findUnique({
            where: { id: params.id },
        });

        if (!existingComic) {
            return NextResponse.json({ error: "Comic not found" }, { status: 404 });
        }

        await prisma.comic.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Comic deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete comic:", error);
        return NextResponse.json({ error: "Failed to delete comic" }, { status: 500 });
    }
}
