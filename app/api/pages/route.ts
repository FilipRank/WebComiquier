import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createPageSchema } from "@/lib/validation_schemas/page";

const normalizePage = (page: any) => {
    const { ImageUri, ...rest } = page;
    return { ...rest, imageUri: ImageUri };
};

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const comicId = searchParams.get("comicId");

        const skip = (page - 1) * limit;
        const where: any = {};

        if (comicId) where.comicId = comicId;

        const [pages, total] = await Promise.all([
            prisma.page.findMany({
                where,
                skip,
                take: limit,
                include: {
                    comic: { select: { id: true, title: true, thumbnailUri: true } },
                },
                orderBy: { index: "asc" },
            }),
            prisma.page.count({ where }),
        ]);

        return NextResponse.json({
            data: pages.map(normalizePage),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch pages:", error);
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createPageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: z.flattenError(validation.error) },
                { status: 400 },
            );
        }

        const { index, imageUri, description, comicId } = validation.data;

        const comic = await prisma.comic.findUnique({ where: { id: comicId } });
        if (!comic) {
            return NextResponse.json({ error: "Comic not found" }, { status: 404 });
        }

        const page = await prisma.page.create({
            data: {
                index,
                ImageUri: imageUri,
                description: description ?? null,
                comicId,
            },
            include: {
                comic: { select: { id: true, title: true, thumbnailUri: true } },
            },
        });

        return NextResponse.json(normalizePage(page), { status: 201 });
    } catch (error) {
        console.error("Failed to create page:", error);
        return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
    }
}
