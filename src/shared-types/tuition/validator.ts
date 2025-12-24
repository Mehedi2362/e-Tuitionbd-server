import { z } from "zod";

// ==================== Create Tuition Schema ====================
export type CreateTuitionInput = z.infer<typeof TuitionSchema>;
export const TuitionSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    class: z.string().min(1, "Class is required"),
    location: z.string().min(1, "Location is required"),
    budget: z
        .number()
        .min(500, `Budget must be at least 500`)
        .max(100000, `Budget cannot exceed 100000`),
    schedule: z
        .string()
        .min(2, "Schedule is required")
        .max(200),
    description: z.string().max(2000).optional(),
    requirements: z.string().max(1000).optional(),
});