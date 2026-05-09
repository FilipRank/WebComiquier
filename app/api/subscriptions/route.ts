import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createSubscriptionSchema } from "@/lib/validation_schemas/subscription";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const userId = searchParams.get("userId");
        const comicId = searchParams.get("comicId");

        const skip = (page - 1) * limit;
        const where: any = {};

        if (userId) where.userId = userId;
        if (comicId) where.comicId = comicId;

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, username: true, imageUri: true } },
                    comic: { select: { id: true, title: true, thumbnailUri: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.subscription.count({ where }),
        ]);

        return NextResponse.json({
            data: subscriptions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
        return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createSubscriptionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: z.flattenError(validation.error) },
                { status: 400 },
            );
        }

        const { userId, comicId } = validation.data;

        const [user, comic] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.comic.findUnique({ where: { id: comicId } }),
        ]);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!comic) {
            return NextResponse.json({ error: "Comic not found" }, { status: 404 });
        }

        const existingSubscription = await prisma.subscription.findFirst({
            where: { userId, comicId },
        });

        if (existingSubscription) {
            return NextResponse.json({ error: "Subscription already exists" }, { status: 409 });
        }

        const subscription = await prisma.subscription.create({
            data: { userId, comicId },
            include: {
                user: { select: { id: true, username: true, imageUri: true } },
                comic: { select: { id: true, title: true, thumbnailUri: true } },
            },
        });

        return NextResponse.json(subscription, { status: 201 });
    } catch (error) {
        console.error("Failed to create subscription:", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }
}
