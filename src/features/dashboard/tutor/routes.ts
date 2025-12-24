// ==================== Tutor Dashboard Routes ====================
import { Router, type IRouter } from "express";
import { TUTOR_APPLICATION_ROUTES, TUTOR_TUITION_ROUTES, TUTOR_PAYMENT_ROUTES } from "@/shared-types/dashboard/tutor.js";
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
    TUTOR_APPLICATION_ROUTES.ALL,
    TutorDashboardController.getMyApplications
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

// ==================== Ongoing Tuitions ====================
router.get(
    TUTOR_TUITION_ROUTES.ONGOING,
    TutorDashboardController.getOngoingTuitions
);

// ==================== Earnings & Payments ====================
router.get(
    TUTOR_PAYMENT_ROUTES.EARNINGS,
    TutorDashboardController.getEarnings
);
router.get(
    TUTOR_PAYMENT_ROUTES.HISTORY,
    TutorDashboardController.getPayments
);

export const tutorDashboardRouter: IRouter = router;
