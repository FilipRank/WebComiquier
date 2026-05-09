import { z } from "zod";

export const createCommentSchema = z.object({
    content: z.string().min(1, "Content is required"),
    isPinned: z.boolean().optional(),
    pageId: z.string().min(1, "Page ID is required"),
    authorId: z.string().min(1, "Author ID is required"),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, "Content cannot be empty").optional(),
    isPinned: z.boolean().optional(),
});
