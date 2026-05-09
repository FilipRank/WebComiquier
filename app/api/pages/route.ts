import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createComicSchema } from "@/lib/validation_schemas/comic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const authorId = searchParams.get("authorId");
    } catch (error) {
        console.error("Failed to fetch pages:", error);
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }
}
