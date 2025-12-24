// ==================== Student Dashboard Routes ====================
import { Router, type IRouter } from "express";
import {
    STUDENT_TUITION_ROUTES,
    STUDENT_APPLICATION_ROUTES,
} from "@/shared-types/dashboard/student.js";
import { authMiddleware, studentMiddleware } from "../../auth/middleware.js";
import { StudentDashboardController } from "./controller.js";

const router = Router();

// ==================== All routes require student authentication ====================
router.use(authMiddleware, studentMiddleware);


// ==================== Tuition Management ====================
router.post(
    STUDENT_TUITION_ROUTES.CREATE, 
    StudentDashboardController.createTuition
);
router.get(
    STUDENT_TUITION_ROUTES.MY, 
    StudentDashboardController.getMyTuitions
);
router.patch(
    STUDENT_TUITION_ROUTES.UPDATE(":id"),
    StudentDashboardController.updateTuition
);
router.delete(
    STUDENT_TUITION_ROUTES.DELETE(":id"),
    StudentDashboardController.deleteTuition
);


// ==================== Application Management ====================
router.get(
    STUDENT_APPLICATION_ROUTES.BY_TUITION(":tuitionId"),
    StudentDashboardController.getApplicationsForTuition
);
router.patch(
    STUDENT_APPLICATION_ROUTES.ACCEPT(":id"),
    StudentDashboardController.acceptApplication
);
router.patch(
    STUDENT_APPLICATION_ROUTES.REJECT(":id"),
    StudentDashboardController.rejectApplication
);

export const studentDashboardRouter: IRouter = router;
