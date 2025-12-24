// ==================== Dashboard Feature ====================
// Combines all role-specific dashboard routes into a single router
import { Router, type IRouter } from "express";
import { PROFILE_ROUTES } from "@/shared-types/dashboard/shared.js";
import { authMiddleware, anyRoleMiddleware } from "../auth/middleware.js";
import { SharedDashboardController } from "./shared.controller.js";
import { adminDashboardRouter } from "./admin/index.js";
import { studentDashboardRouter } from "./student/index.js";
import { tutorDashboardRouter } from "./tutor/index.js";

const router = Router();

// ==================== Shared Profile Routes (Any authenticated role) ====================
router.get(
    PROFILE_ROUTES.GET,
    authMiddleware,
    anyRoleMiddleware,
    SharedDashboardController.getProfile
);
router.patch(
    PROFILE_ROUTES.UPDATE,
    authMiddleware,
    anyRoleMiddleware,
    SharedDashboardController.updateProfile
);

// ==================== Mount Role-Specific Routers ====================
// Mount under root - each router has its own path prefix in its routes
router.use("/admin", adminDashboardRouter);
router.use("/student", studentDashboardRouter);
router.use("/tutor", tutorDashboardRouter);

export const dashboardRouter: IRouter = router;

// Re-export role-specific exports
export { AdminDashboardController } from "./admin/index.js";
export { StudentDashboardController } from "./student/index.js";
export { TutorDashboardController } from "./tutor/index.js";
export { SharedDashboardController } from "./shared.controller.js";
export { adminDashboardRouter, studentDashboardRouter, tutorDashboardRouter };
