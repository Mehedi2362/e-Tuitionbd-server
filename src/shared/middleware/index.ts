// ==================== Shared Middleware Exports ====================
export {
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
} from "./error.js";

export { validateBody, validateParams, validateQuery } from "./validate.js";

// Re-export auth middleware from auth feature
export {
  adminMiddleware,
  anyRoleMiddleware,
  authMiddleware,
  generateJWT,
  optionalAuth,
  requireRole,
  studentMiddleware,
  studentOrTutorMiddleware,
  tutorMiddleware,
  verifyJWT,
} from "../../features/auth/middleware.js";
