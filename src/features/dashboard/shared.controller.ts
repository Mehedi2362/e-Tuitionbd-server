// ==================== Shared Dashboard Controller ====================
// Methods shared across all dashboard roles (student, tutor, admin)
import type { Response } from "express";
import { SUCCESS_MESSAGES } from "../../shared/constants/index.js";
import { sendNotFound, sendSuccess } from "../../shared/utils/index.js";
import { UserModel, type IUser } from "../../shared/models/index.js";
import type { AuthRequest } from "../auth/types.js";

// ==================== Shared Dashboard Controller Class ====================
export class SharedDashboardController {
    // ==================== Get Profile ====================
    static async getProfile(req: AuthRequest, res: Response): Promise<void> {
        const user = await UserModel.findByEmail(req.user!.email);

        if (!user) {
            sendNotFound(res, "User not found");
            return;
        }

        sendSuccess(res, user, "Profile fetched successfully");
    }

    // ==================== Update Profile ====================
    static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        const { name, phone, qualifications, experience, subjects, bio } = req.body;

        const updateData: Partial<IUser> = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (qualifications !== undefined)
            updateData.qualifications = qualifications;
        if (experience !== undefined) updateData.experience = experience;
        if (subjects !== undefined) updateData.subjects = subjects;
        if (bio !== undefined) updateData.bio = bio;

        const user = await UserModel.updateByEmail(req.user!.email, updateData);

        if (!user) {
            sendNotFound(res, "User not found");
            return;
        }

        sendSuccess(res, user, SUCCESS_MESSAGES.PROFILE_UPDATE);
    }
}
