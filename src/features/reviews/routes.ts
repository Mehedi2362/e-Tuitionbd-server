// ==================== Review Routes ====================
import { Router } from "express";
import { REVIEW_ROUTES, CreateReviewSchema, UpdateReviewSchema } from "@/shared-types/reviews/index.js";
import {
    asyncHandler,
    authMiddleware,
    validateBody,
} from "../../shared/middleware/index.js";
import { ReviewController } from "./controller.js";

const router: Router = Router();

// ==================== Review Routes ====================

// Create review (authenticated students only)
router.post(
    REVIEW_ROUTES.CREATE,
    authMiddleware,
    validateBody(CreateReviewSchema),
    asyncHandler(ReviewController.createReview)
);

// Get reviews by tutor (public)
router.get(
    REVIEW_ROUTES.GET_BY_TUTOR(":tutorId"),
    asyncHandler(ReviewController.getReviewsByTutor)
);

// Get specific student review for tutor (public)
router.get(
    REVIEW_ROUTES.GET_STUDENT_REVIEW(":tutorId", ":studentId"),
    asyncHandler(ReviewController.getStudentReview)
);

// Update review (authenticated, owner only)
router.put(
    REVIEW_ROUTES.UPDATE(":reviewId"),
    authMiddleware,
    validateBody(UpdateReviewSchema),
    asyncHandler(ReviewController.updateReview)
);

// Delete review (authenticated, owner only)
router.delete(
    REVIEW_ROUTES.DELETE(":reviewId"),
    authMiddleware,
    asyncHandler(ReviewController.deleteReview)
);

// Get tutor rating stats (public)
router.get(
    `/tutors/:tutorId/rating-stats`,
    asyncHandler(ReviewController.getTutorRatingStats)
);

export { router as reviewRouter };
