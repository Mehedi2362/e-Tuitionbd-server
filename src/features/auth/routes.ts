// ==================== Auth Routes ====================
import { AUTH_ROUTES } from "@/shared-types/auth/index.js";
import { Router } from "express";
import {
  anyRoleMiddleware,
  asyncHandler,
  authMiddleware,
  validateBody,
} from "../../shared/middleware/index.js";
import { AuthController } from "./controller.js";
import { SignUpSchema } from "@/shared-types/auth/index.js";
import { guestMiddleware } from "./middleware.js";

const router: Router = Router();

// ==================== Public Routes ====================
router.post(
  AUTH_ROUTES.SIGNUP,
  guestMiddleware,
  validateBody(SignUpSchema),
  asyncHandler(AuthController.signUp)
);

router.post(
  AUTH_ROUTES.SIGNIN,
  guestMiddleware,
  asyncHandler(AuthController.signIn)
);

router.post(
  AUTH_ROUTES.GOOGLE,
  guestMiddleware,
  asyncHandler(AuthController.signInWithGooglePopup)
);

// ==================== Token Routes ====================
router.post(
  AUTH_ROUTES.SIGNOUT,
  authMiddleware,
  asyncHandler(AuthController.signOut)
);

// ==================== Protected Routes ====================
router.get(
  AUTH_ROUTES.ME,
  authMiddleware,
  asyncHandler(AuthController.getMe)
);


export default router;
