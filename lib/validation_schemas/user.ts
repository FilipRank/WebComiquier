import { z } from "zod";

export const createUserSchema = z.object({
    username: z.string().min(1, "Username is required"),
    description: z.string().optional(),
    imageUri: z.url().optional(),
});

export const updateUserSchema = z.object({
    username: z.string().min(1, "Username cannot be empty").optional(),
    description: z.string().optional(),
    imageUri: z.url().optional(),
});
