// ==================== Authentication Middleware ====================
import type { CookieOptions, NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { ROLES } from "@/shared-types/auth/index.js";

import { ERROR_MESSAGES, HTTP_STATUS } from "../../shared/constants/index.js";
import type { IUser } from "../../shared/models/types.js";
import type { AuthRequest } from "./types.js";
import { firebase } from "@/config/firebase.js";
import { getEnv } from "@/shared/utils/getEnv.js";
import { db } from "@/config/db.js";

// ==================== Cookie Options ====================

// ==================== Extract Token ====================
const extractToken = (req: AuthRequest): string | null => {
	// Priority 1: HTTP-only cookie
	const cookieToken = req.cookies?.['auth_token'];
	if (cookieToken) return cookieToken;

	// Priority 2: Authorization header (for Firebase tokens and backward compatibility)
	const authHeader = req.headers.authorization;
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.split("Bearer ")[1];
	}

	return null;
};

// ==================== Verify Firebase or JWT Token ====================
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	const token = extractToken(req);

	if (!token) {
		res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: ERROR_MESSAGES.NO_TOKEN, });
		return;
	}

	try {
		req.user = jwt.verify(token, getEnv.string('JWT_SECRET')) as { email: string; role: "student" | "tutor" | "admin"; };
		return next();
	} catch {
		res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: ERROR_MESSAGES.INVALID_TOKEN, });
		return;
	}
};


type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const requireRole = (...roles: UserRole[]) => {
	return async (
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			if (!req.user || !req.user.email) {
				res.status(HTTP_STATUS.UNAUTHORIZED).json({
					success: false,
					message: ERROR_MESSAGES.UNAUTHORIZED,
				});
				return;
			}

			const database = await db.getDB();
			const user = await database
				.collection<IUser>('users')
				.findOne({ email: req.user.email });

			if (!user) {
				res.status(HTTP_STATUS.UNAUTHORIZED).json({
					success: false,
					message: "User not found in database.",
				});
				return;
			}

			if (!roles.includes(user.role)) {
				res.status(HTTP_STATUS.FORBIDDEN).json({
					success: false,
					message: ERROR_MESSAGES.FORBIDDEN,
				});
				return;
			}

			// Attach role safely
			req.user = { ...req.user, role: user.role };

			next();
		} catch (error) {
			res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: ERROR_MESSAGES.SERVER_ERROR,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};
};


export const adminMiddleware = requireRole(ROLES.ADMIN);
export const studentMiddleware = requireRole(ROLES.STUDENT);
export const tutorMiddleware = requireRole(ROLES.TUTOR);
export const studentOrTutorMiddleware = requireRole(ROLES.STUDENT, ROLES.TUTOR);
export const anyRoleMiddleware = requireRole(ROLES.STUDENT, ROLES.TUTOR, ROLES.ADMIN);
export const guestMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const cookieToken = req.cookies?.['auth_token'];
	if (cookieToken) {
		// Verify if token is valid
		try {
			jwt.verify(cookieToken, getEnv.string('JWT_SECRET'));
			// Token is valid, user is authenticated
			res.status(403).json({ message: `Already authenticated users cannot access this route` });
			return;
		} catch {
			// Token is invalid/expired, clear it and allow access
			res.clearCookie("auth_token", {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax"
			});
		}
	}
	next();
}

// ==================== Generate JWT ====================
export const generateJWT = (payload: { email: string; role: string }): string => {
	return jwt.sign(payload, getEnv.string('JWT_SECRET'), { expiresIn: '7d' });
};

// ==================== Verify JWT ====================
export const verifyJWT = (token: string): { email: string; role: string } | null => {
	try {
		return jwt.verify(token, getEnv.string('JWT_SECRET')) as { email: string; role: string };
	} catch {
		return null;
	}
};

// ==================== Optional Auth Middleware ====================
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
	const token = extractToken(req);
	if (token) {
		try {
			req.user = jwt.verify(token, getEnv.string('JWT_SECRET')) as { email: string; role: "student" | "tutor" | "admin" };
		} catch {
			// Token invalid, continue without user
		}
	}
	next();
};