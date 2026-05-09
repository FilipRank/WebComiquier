import { z } from "zod";

export const createPageSchema = z.object({
    index: z.number().int().min(1, "Page index must be at least 1"),
    imageUri: z.url("Image URI must be a valid URL"),
    description: z.string().optional(),
    comicId: z.string().min(1, "Comic ID is required"),
});

export const updatePageSchema = z.object({
    index: z.number().int().min(1, "Page index must be at least 1").optional(),
    imageUri: z.url("Image URI must be a valid URL").optional(),
    description: z.string().optional(),
});
