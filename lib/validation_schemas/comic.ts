import { z } from "zod";

export const createComicSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().default(""),
    authorId: z.string().min(1, "Author ID is required"),
    status: z
        .string()
        .transform((val) => val.toUpperCase())
        .pipe(z.enum(["ONGOING", "COMPLETED", "HIATUS", "CANCELLED"]))
        .default("ONGOING"),
    thumbnailUri: z.url().optional().nullable(),
});

export const updateComicSchema = z.object({
    title: z.string().min(1, "Title cannot be empty").optional(),
    description: z.string().optional(),
    status: z
        .string()
        .transform((val) => val.toUpperCase())
        .pipe(z.enum(["ONGOING", "COMPLETED", "HIATUS", "CANCELLED"]))
        .optional(),
    thumbnailUri: z.url().optional().nullable(),
});
