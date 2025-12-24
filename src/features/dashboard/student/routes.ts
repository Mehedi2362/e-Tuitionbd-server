/**
 * Student Dashboard Routes
 * Handles all student-specific dashboard endpoints
 * Includes tuition posting, application management, and enrollment tracking
 * All routes require student role authentication
 */

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
// Apply authentication middleware to all routes in this router
router.use(authMiddleware, studentMiddleware);


// ==================== Tuition Management ====================
// POST /dashboard/student/tuitions - Create a new tuition posting
router.post(
    STUDENT_TUITION_ROUTES.CREATE,
    StudentDashboardController.createTuition
);
// GET /dashboard/student/tuitions - Get all student's tuitions
router.get(
    STUDENT_TUITION_ROUTES.MY,
    StudentDashboardController.getMyTuitions
);
// PATCH /dashboard/student/tuitions/:id - Update tuition details
router.patch(
    STUDENT_TUITION_ROUTES.UPDATE(":id"),
    StudentDashboardController.updateTuition
);
// DELETE /dashboard/student/tuitions/:id - Delete tuition posting
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
