import { z } from "zod";

// ==================== Application Form Schema ====================
export type ApplicationFormData = z.infer<typeof applicationFormSchema>;
export const applicationFormSchema = z.object({
    tuitionId: z.string().min(1, "Tuition ID is required"),
    qualifications: z
        .string()
        .min(10, "Qualifications are required")
        .max(1000),
    experience: z
        .string()
        .min(10, "Experience is required")
        .max(1000),
    expectedSalary: z.number().min(0, "Expected salary must be positive"),
    coverLetter: z.string().max(2000).optional(),
});