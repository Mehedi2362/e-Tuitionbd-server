// ==================== Auth Controller ====================
// Authentication methods for register, login, logout, token refresh
import type { Response } from "express";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../shared/constants/index.js";
import {
    sendCreated,
    sendError,
    sendNotFound,
    sendSuccess,
} from "../../shared/utils/index.js";
import { UserModel, type IUser } from "../../shared/models/index.js";
import type { AuthRequest } from "./types.js";
import { firebase } from "@/config/firebase.js";


// ==================== Auth Controller Class ====================
export class AuthController {
    // ==================== Register ====================
    static async signUp(req: AuthRequest, res: Response): Promise<void> {
        const { name, email, phone, role, password } = req.body;

        // Check if user exists
        const existingUser = await UserModel.findByEmail(email);

        if (existingUser) {
            res.status(409).json({ error: "Email already registered. Please login." });
            return
        }

        // Create new user
        const newUser = await UserModel.create({ email, name, phone, role, password, status: "active", createdAt: new Date(), updatedAt: new Date() });

        const token = jwt.sign(
            { email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        // Set HttpOnly cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: "User registered successfully",
            user: { email, name, phone, role }
        });
    }

    // ==================== Login ====================

    static async signIn(req: AuthRequest, res: Response): Promise<void> {
        const { email, password } = req.body;

        // Find user
        const user: IUser | null = await UserModel.findByEmail(email);
        if (!user) {
            sendError(res, "Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
            return;
        }

        // Check banned status
        if (user.status === "banned") {
            sendError(res, "Your account has been banned.", HTTP_STATUS.FORBIDDEN);
            return;
        }

        // Verify password (assuming bcrypt hash)
        const isMatch = bcrypt.compare(password, user.password!);
        if (!isMatch) {
            sendError(res, "Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
            return;
        }

        const { name, phone, role } = user

        // Generate JWT
        const token = jwt.sign(
            { email, role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        // Set HttpOnly cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Response (safe user object)
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: { name, email, phone, role }

        });
    }

    static async signInWithGooglePopup(req: AuthRequest, res: Response): Promise<void> {
        try {
            console.log('🔍 Google sign-in attempt started');
            // Token header থেকে বের করো
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                console.log('❌ No Bearer token found');
                sendError(res, "No Google token provided.", HTTP_STATUS.BAD_REQUEST);
                return;
            }
            const token = authHeader.split(" ")[1];
            console.log('✅ Token extracted, verifying...');

            const { email, name } = await firebase.verifyToken(token);
            console.log('✅ Token verified, email:', email, 'name:', name);
            if (!email) {
                console.log('❌ No email in token');
                sendError(res, "Token does not contain an email.", HTTP_STATUS.BAD_REQUEST);
                return;
            }
            let user = await UserModel.findByEmail(email);
            if (!user) {
                console.log('🔍 Creating new user for:', email);
                user = await UserModel.create({
                    name,
                    email,
                    role: 'student',
                    status: "active",
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                console.log('✅ Existing user found:', email);
            }

            // Generate JWT (minimal claims only)
            const jwtToken = jwt.sign(
                { email, role: 'student' },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );
            console.log('✅ JWT generated');

            // Set HttpOnly cookie
            res.cookie("auth_token", jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            // Response
            res.status(200).json({
                success: true,
                message: "Google sign-in successful",
                data: {
                    user: { name, email, role: 'student' }
                }
            });
            console.log('✅ Response sent successfully');
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            sendError(res, "Google sign-in failed.", HTTP_STATUS.UNAUTHORIZED);
        }
    }

    // ==================== Logout ====================
    static async signOut(_req: AuthRequest, res: Response): Promise<void> {
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax"
        });

        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }


    // ==================== Get Current User (Me) ====================
    static async getMe(req: AuthRequest, res: Response): Promise<void> {
        const user = await UserModel.findByEmail(req.user!.email);

        if (!user) {
            sendNotFound(res, "User not found");
            return;
        }
        const { name, email, phone, role } = user;
        sendSuccess(res, { user: { name, email, phone, role } }, "User fetched successfully");
    }
}
