import { z } from "zod";

export const createSubscriptionSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    comicId: z.string().min(1, "Comic ID is required"),
});

export const updateSubscriptionSchema = z.object({
    userId: z.string().min(1, "User ID cannot be empty").optional(),
    comicId: z.string().min(1, "Comic ID cannot be empty").optional(),
});
