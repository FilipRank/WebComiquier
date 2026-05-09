import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { updateSubscriptionSchema } from "@/lib/validation_schemas/subscription";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { id: params.id },
            include: {
                user: { select: { id: true, username: true, imageUri: true } },
                comic: { select: { id: true, title: true, thumbnailUri: true } },
            },
        });

        if (!subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Failed to fetch subscription:", error);
        return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const validation = updateSubscriptionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: z.flattenError(validation.error) },
                { status: 400 },
            );
        }

        const existingSubscription = await prisma.subscription.findUnique({
            where: { id: params.id },
        });
        if (!existingSubscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        const { userId, comicId } = validation.data;

        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
        }

        if (comicId) {
            const comic = await prisma.comic.findUnique({ where: { id: comicId } });
            if (!comic) {
                return NextResponse.json({ error: "Comic not found" }, { status: 404 });
            }
        }

        const duplicateCheck = await prisma.subscription.findFirst({
            where: {
                userId: userId ?? existingSubscription.userId,
                comicId: comicId ?? existingSubscription.comicId,
                NOT: { id: params.id },
            },
        });

        if (duplicateCheck) {
            return NextResponse.json(
                { error: "Another subscription already exists for this user and comic" },
                { status: 409 },
            );
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: params.id },
            data: {
                ...(userId !== undefined && { userId }),
                ...(comicId !== undefined && { comicId }),
            },
            include: {
                user: { select: { id: true, username: true, imageUri: true } },
                comic: { select: { id: true, title: true, thumbnailUri: true } },
            },
        });

        return NextResponse.json(updatedSubscription);
    } catch (error) {
        console.error("Failed to update subscription:", error);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const existingSubscription = await prisma.subscription.findUnique({
            where: { id: params.id },
        });
        if (!existingSubscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        await prisma.subscription.delete({ where: { id: params.id } });
        return NextResponse.json({ message: "Subscription deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete subscription:", error);
        return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
    }
}
