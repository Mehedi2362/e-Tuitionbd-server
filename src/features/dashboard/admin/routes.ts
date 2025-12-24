// ==================== Admin Dashboard Routes ====================
import { Router, type IRouter } from "express";
import {
    ADMIN_ROUTES,
    ADMIN_USER_ROUTES,
    ADMIN_TUITION_ROUTES,
    ADMIN_APPLICATION_ROUTES,
    ADMIN_PAYMENT_ROUTES,
} from "@/shared-types/dashboard/admin.js";
import { authMiddleware, adminMiddleware } from "../../auth/middleware.js";
import { AdminDashboardController } from "./controller.js";

const router = Router();

// ==================== All routes require admin authentication ====================
router.use(authMiddleware, adminMiddleware);

// ==================== Dashboard Stats ====================
router.get(
    ADMIN_ROUTES.DASHBOARD,
    AdminDashboardController.getDashboard
);

router.get(
    ADMIN_ROUTES.ANALYTICS,
    AdminDashboardController.getAnalytics
);

// ==================== User Management ====================
router.get(
    ADMIN_USER_ROUTES.ALL,
    AdminDashboardController.getUsers
);
router.get(
    ADMIN_USER_ROUTES.BY_ID(":email"),
    AdminDashboardController.getUserByEmail
);
router.patch(
    ADMIN_USER_ROUTES.UPDATE_ROLE(":email"),
    AdminDashboardController.updateUserRole
);
router.patch(
    `${ADMIN_USER_ROUTES.ALL}/:email/status`,
    AdminDashboardController.updateUserStatus
);
router.delete(
    ADMIN_USER_ROUTES.DELETE(":email"),
    AdminDashboardController.deleteUser
);

// ==================== Tuition Management ====================
router.get(
    ADMIN_TUITION_ROUTES.ALL,
    AdminDashboardController.getTuitions
);
router.patch(
    `${ADMIN_TUITION_ROUTES.ALL}/:id/status`,
    AdminDashboardController.updateTuitionStatus
);

// ==================== Application Management ====================
router.get(
    ADMIN_APPLICATION_ROUTES.ALL,
    AdminDashboardController.getApplications
);

// ==================== Payment Management ====================
router.get(
    ADMIN_PAYMENT_ROUTES.ALL,
    AdminDashboardController.getPayments
);

export const adminDashboardRouter: IRouter = router;
