// ==================== Payment Routes ====================
import { Router } from "express";
import { PAYMENT_ROUTES } from "@/shared-types/payments/index.js";
import {
  adminMiddleware,
  asyncHandler,
  authMiddleware,
  studentMiddleware,
  tutorMiddleware,
} from "../../shared/middleware/index.js";
import { PaymentController } from "./controller.js";

const router: Router = Router();

// ==================== Student Routes ====================
router.post(
  PAYMENT_ROUTES.CREATE_CHECKOUT,
  authMiddleware,
  studentMiddleware,
  asyncHandler(PaymentController.createCheckoutSession)
);

router.get(
  PAYMENT_ROUTES.MY,
  authMiddleware,
  studentMiddleware,
  asyncHandler(PaymentController.getMyPayments)
);

router.get(
  PAYMENT_ROUTES.SUCCESS(":sessionId"),
  authMiddleware,
  asyncHandler(PaymentController.verifyPayment)
);

// ==================== Tutor Routes ====================
router.get(
  PAYMENT_ROUTES.EARNINGS,
  authMiddleware,
  tutorMiddleware,
  asyncHandler(PaymentController.getTutorEarnings)
);

// ==================== Admin Routes ====================
router.get(
  PAYMENT_ROUTES.ALL,
  authMiddleware,
  adminMiddleware,
  asyncHandler(PaymentController.getAllPayments)
);

// ==================== Common Routes ====================
router.get(
  PAYMENT_ROUTES.BY_ID(":id"),
  authMiddleware,
  asyncHandler(PaymentController.getById)
);

export default router;
