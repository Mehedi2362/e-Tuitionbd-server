// ==================== Tutor Dashboard Routes ====================
import { Router, type IRouter } from "express";
import { TUTOR_APPLICATION_ROUTES } from "@/shared-types/dashboard/tutor.js";
import { authMiddleware, tutorMiddleware } from "../../auth/middleware.js";
import { TutorDashboardController } from "./controller.js";

const router = Router();

// ==================== All routes require tutor authentication ====================
router.use(authMiddleware, tutorMiddleware);

// ==================== Application Management ====================
router.post(
    TUTOR_APPLICATION_ROUTES.CREATE,
    TutorDashboardController.createApplication
);
router.get(
    TUTOR_APPLICATION_ROUTES.MY,
    TutorDashboardController.getMyApplications
);
router.get(
    TUTOR_APPLICATION_ROUTES.BY_ID(":id"),
    TutorDashboardController.getApplicationById
);
router.patch(
    TUTOR_APPLICATION_ROUTES.UPDATE(":id"),
    TutorDashboardController.updateApplication
);
router.delete(
    TUTOR_APPLICATION_ROUTES.DELETE(":id"),
    TutorDashboardController.deleteApplication
);

export const tutorDashboardRouter: IRouter = router;
