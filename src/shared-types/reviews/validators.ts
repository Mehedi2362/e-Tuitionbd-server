// ==================== Review Validators ====================
import { z } from "zod";

export const CreateReviewSchema = z.object({
    tutorId: z.string().min(1, "Tutor ID is required"),
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z.string().min(5, "Comment must be at least 5 characters").max(500, "Comment cannot exceed 500 characters"),
});

export const UpdateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(5).max(500).optional(),
});
