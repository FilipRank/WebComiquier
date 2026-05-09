import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updatePageSchema } from "@/lib/validation_schemas/page";
import { z } from "zod";

const normalizePage = (page: any) => {
    const { ImageUri, ...rest } = page;
    return { ...rest, imageUri: ImageUri };
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const page = await prisma.page.findUnique({
            where: { id: params.id },
            include: {
                comic: {
                    select: { id: true, title: true, thumbnailUri: true },
                },
                comments: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        author: {
                            select: { id: true, username: true, imageUri: true },
                        },
                    },
                },
            },
        });

        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        return NextResponse.json(normalizePage(page));
    } catch (error) {
        console.error("Failed to fetch page:", error);
        return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const validation = updatePageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: z.flattenError(validation.error) },
                { status: 400 },
            );
        }

        const existingPage = await prisma.page.findUnique({ where: { id: params.id } });
        if (!existingPage) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        const { index, imageUri, description } = validation.data;

        const updatedPage = await prisma.page.update({
            where: { id: params.id },
            data: {
                ...(index !== undefined && { index }),
                ...(imageUri !== undefined && { ImageUri: imageUri }),
                ...(description !== undefined && { description }),
            },
            include: {
                comic: {
                    select: { id: true, title: true, thumbnailUri: true },
                },
                comments: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        author: {
                            select: { id: true, username: true, imageUri: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(normalizePage(updatedPage));
    } catch (error) {
        console.error("Failed to update page:", error);
        return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const existingPage = await prisma.page.findUnique({ where: { id: params.id } });
        if (!existingPage) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        await prisma.page.delete({ where: { id: params.id } });

        return NextResponse.json({ message: "Page deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete page:", error);
        return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }
}
