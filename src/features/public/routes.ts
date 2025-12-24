// ==================== Public Routes ====================
import { Router } from "express";
import { PUBLIC_TUITION_ROUTES, PUBLIC_TUTOR_ROUTES } from "@/shared-types/public/index.js";
import { asyncHandler, optionalAuth } from "../../shared/middleware/index.js";
import { PublicController } from "./controller.js";

const router: Router = Router();

// ==================== Tuition Routes ====================
router.get(
    PUBLIC_TUITION_ROUTES.ALL,
    optionalAuth,
    asyncHandler(PublicController.getTuitions)
);

router.get(
    PUBLIC_TUITION_ROUTES.FEATURED,
    asyncHandler(PublicController.getFeaturedTuitions)
);

router.get(
    PUBLIC_TUITION_ROUTES.FILTER_OPTIONS,
    asyncHandler(PublicController.getFilterOptions)
);

router.get(
    PUBLIC_TUITION_ROUTES.BY_ID(":id"),
    optionalAuth,
    asyncHandler(PublicController.getTuitionById)
);

// ==================== Tutor Routes ====================
router.get(
    PUBLIC_TUTOR_ROUTES.ALL,
    optionalAuth,
    asyncHandler(PublicController.getTutors)
);

router.get(
    PUBLIC_TUTOR_ROUTES.FEATURED,
    asyncHandler(PublicController.getFeaturedTutors)
);

router.get(
    PUBLIC_TUTOR_ROUTES.FILTER_OPTIONS,
    asyncHandler(PublicController.getTutorFilterOptions)
);

router.get(
    PUBLIC_TUTOR_ROUTES.BY_ID(":id"),
    optionalAuth,
    asyncHandler(PublicController.getTutorById)
);

export default router;
