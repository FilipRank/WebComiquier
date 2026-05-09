import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createComicSchema } from "@/lib/validation_schemas/comic";

// GET - List all comics with optional pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const authorId = searchParams.get("authorId");

        const skip = (page - 1) * limit;

        const where = authorId ? { authorId } : {};

        const [comics, total] = await Promise.all([
            prisma.comic.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: {
                        select: { id: true, username: true, imageUri: true },
                    },
                    _count: {
                        select: { pages: true, subscriptions: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.comic.count({ where }),
        ]);

        return NextResponse.json({
            data: comics,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch comics:", error);
        return NextResponse.json({ error: "Failed to fetch comics" }, { status: 500 });
    }
}

// POST - Create a new comic
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validationResult = createComicSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 },
            );
        }

        const { title, description, authorId, status, thumbnailUri } = validationResult.data;

        // Verify author exists
        const author = await prisma.user.findUnique({
            where: { id: authorId },
        });

        if (!author) {
            return NextResponse.json({ error: "Author not found" }, { status: 404 });
        }

        const comic = await prisma.comic.create({
            data: {
                title,
                description,
                thumbnailUri,
                status,
                authorId,
            },
            include: {
                author: {
                    select: { id: true, username: true, imageUri: true },
                },
            },
        });

        return NextResponse.json(comic, { status: 201 });
    } catch (error) {
        console.error("Failed to create comic:", error);
        return NextResponse.json({ error: "Failed to create comic" }, { status: 500 });
    }
}
