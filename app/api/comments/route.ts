import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createCommentSchema } from "@/lib/validation_schemas/comment";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const pageId = searchParams.get("pageId");
        const authorId = searchParams.get("authorId");

        const skip = (page - 1) * limit;
        const where: any = {};

        if (pageId) where.pageId = pageId;
        if (authorId) where.authorId = authorId;

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, username: true, imageUri: true } },
                    page: { select: { id: true, index: true, comicId: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.comment.count({ where }),
        ]);

        return NextResponse.json({
            data: comments,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createCommentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: z.flattenError(validation.error) },
                { status: 400 },
            );
        }

        const { content, isPinned, pageId, authorId } = validation.data;

        const [page, author] = await Promise.all([
            prisma.page.findUnique({ where: { id: pageId } }),
            prisma.user.findUnique({ where: { id: authorId } }),
        ]);

        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        if (!author) {
            return NextResponse.json({ error: "Author not found" }, { status: 404 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                isPinned: isPinned ?? false,
                pageId,
                authorId,
            },
            include: {
                author: { select: { id: true, username: true, imageUri: true } },
                page: { select: { id: true, index: true, comicId: true } },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Failed to create comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
