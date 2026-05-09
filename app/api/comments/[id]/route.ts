import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { updateCommentSchema } from "@/lib/validation_schemas/comment";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: params.id },
            include: {
                author: { select: { id: true, username: true, imageUri: true } },
                page: { select: { id: true, index: true, comicId: true } },
            },
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Failed to fetch comment:", error);
        return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const validation = updateCommentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: z.flattenError(validation.error) },
                { status: 400 },
            );
        }

        const existingComment = await prisma.comment.findUnique({ where: { id: params.id } });
        if (!existingComment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: params.id },
            data: {
                ...(validation.data.content !== undefined && { content: validation.data.content }),
                ...(validation.data.isPinned !== undefined && {
                    isPinned: validation.data.isPinned,
                }),
            },
            include: {
                author: { select: { id: true, username: true, imageUri: true } },
                page: { select: { id: true, index: true, comicId: true } },
            },
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error("Failed to update comment:", error);
        return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const existingComment = await prisma.comment.findUnique({ where: { id: params.id } });
        if (!existingComment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        await prisma.comment.delete({ where: { id: params.id } });
        return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
