// ==================== Student Dashboard Controller ====================
import type { Response } from "express";
import { Filter } from "mongodb";
import { SUCCESS_MESSAGES } from "../../../shared/constants/index.js";
import {
    parsePagination,
    sendCreated,
    sendError,
    sendNotFound,
    sendPaginated,
    sendSuccess,
    toObjectId,
} from "../../../shared/utils/index.js";
import {
    TuitionModel,
    ApplicationModel,
    type ITuition,
    type ApplicationStatus,
} from "../../../shared/models/index.js";
import type { AuthRequest } from "../../auth/types.js";

// ==================== Student Dashboard Controller Class ====================
export class StudentDashboardController {
    // ==================== Create Tuition ====================
    static async createTuition(req: AuthRequest, res: Response): Promise<void> {
        const {
            subject,
            class: className,
            location,
            budget,
            schedule,
            description,
            requirements,
        } = req.body;
        const { email, name } = req.user!;

        const tuition = await TuitionModel.create({
            student: { email },
            subject,
            class: className,
            location,
            budget: Number(budget),
            schedule,
            description,
            requirements,
        });

        sendCreated(res, tuition, SUCCESS_MESSAGES.TUITION_CREATED);
    }

    // ==================== Get My Tuitions ====================
    static async getMyTuitions(req: AuthRequest, res: Response): Promise<void> {
        const { skip, limit, page } = parsePagination(req.query);
        const { email } = req.user!;
        const {
            subject,
            class: className,
            location,
            status,
            search,
        } = req.query;

        // Build filter
        const filter: Filter<ITuition> = { studentId: email };

        if (subject) filter.subject = { $regex: subject as string, $options: "i" };
        if (className) filter.class = className as string;
        if (location)
            filter.location = { $regex: location as string, $options: "i" };
        if (status) filter.status = status as ITuition["status"];
        if (search) {
            filter.$or = [
                { subject: { $regex: search as string, $options: "i" } },
                { location: { $regex: search as string, $options: "i" } },
                { class: { $regex: search as string, $options: "i" } },
            ];
        }

        const { data: tuitions, total } = await TuitionModel.findByStudentId(email, {
            skip,
            limit,
        });

        sendPaginated(
            res,
            tuitions,
            page,
            limit,
            total,
            "Your tuitions fetched successfully"
        );
    }

    // ==================== Update Tuition ====================
    static async updateTuition(req: AuthRequest, res: Response): Promise<void> {
        const { id } = req.params;
        const { email } = req.user!;
        const {
            subject,
            class: className,
            location,
            budget,
            schedule,
            description,
            requirements,
        } = req.body;

        const objectId = toObjectId(id);
        if (!objectId) {
            sendError(res, "Invalid tuition ID");
            return;
        }

        // Check ownership
        const isOwner = await TuitionModel.isOwner(objectId, email);
        if (!isOwner) {
            sendError(res, "You can only update your own tuitions", 403);
            return;
        }

        const updateData: Partial<ITuition> = {};
        if (subject !== undefined) updateData.subject = subject;
        if (className !== undefined) updateData.class = className;
        if (location !== undefined) updateData.location = location;
        if (budget !== undefined) updateData.budget = Number(budget);
        if (schedule !== undefined) updateData.schedule = schedule;
        if (description !== undefined) updateData.description = description;
        if (requirements !== undefined) updateData.requirements = requirements;

        const tuition = await TuitionModel.updateById(objectId, updateData);

        if (!tuition) {
            sendNotFound(res, "Tuition not found");
            return;
        }

        sendSuccess(res, tuition, SUCCESS_MESSAGES.TUITION_UPDATED);
    }

    // ==================== Delete Tuition ====================
    static async deleteTuition(req: AuthRequest, res: Response): Promise<void> {
        const { id } = req.params;
        const { email } = req.user!;

        const objectId = toObjectId(id);
        if (!objectId) {
            sendError(res, "Invalid tuition ID");
            return;
        }

        // Check ownership
        const isOwner = await TuitionModel.isOwner(objectId, email);
        if (!isOwner) {
            sendError(res, "You can only delete your own tuitions", 403);
            return;
        }

        // Delete associated applications
        await ApplicationModel.deleteByTuitionId(objectId);

        const deleted = await TuitionModel.deleteById(objectId);

        if (!deleted) {
            sendNotFound(res, "Tuition not found");
            return;
        }

        sendSuccess(res, null, SUCCESS_MESSAGES.TUITION_DELETED);
    }

    // ==================== Get Applications For My Tuition ====================
    static async getApplicationsForTuition(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { tuitionId } = req.params;
        const { email } = req.user!;
        const { skip, limit, page } = parsePagination(req.query);

        const objectId = toObjectId(tuitionId);
        if (!objectId) {
            sendError(res, "Invalid tuition ID");
            return;
        }

        // Check if tuition belongs to this student
        const isOwner = await TuitionModel.isOwner(objectId, email);
        if (!isOwner) {
            sendError(res, "You can only view applications for your own tuitions", 403);
            return;
        }

        const { data: applications, total } = await ApplicationModel.findByTuitionId(objectId, { skip, limit });

        sendPaginated(res, applications, page, limit, total, "Applications fetched successfully");
    }

    // ==================== Accept Application ====================
    static async acceptApplication(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { email } = req.user!;

        const objectId = toObjectId(id);
        if (!objectId) {
            sendError(res, "Invalid application ID");
            return;
        }

        // Get application
        const application = await ApplicationModel.findById(objectId);
        if (!application) {
            sendNotFound(res, "Application not found");
            return;
        }

        // Check if tuition belongs to this student
        const tuition = await TuitionModel.findById(application.tuitionId);
        if (!tuition || tuition.student.email !== email) {
            sendError(res, "You can only accept applications for your own tuitions", 403);
            return;
        }

        const updated = await ApplicationModel.updateStatus(objectId, "accepted" as ApplicationStatus);

        sendSuccess(res, updated, "Application accepted successfully");
    }

    // ==================== Reject Application ====================
    static async rejectApplication(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { email } = req.user!;

        const objectId = toObjectId(id);
        if (!objectId) {
            sendError(res, "Invalid application ID");
            return;
        }

        // Get application
        const application = await ApplicationModel.findById(objectId);
        if (!application) {
            sendNotFound(res, "Application not found");
            return;
        }

        // Check if tuition belongs to this student
        const tuition = await TuitionModel.findById(application.tuitionId);
        if (!tuition || tuition.student.email !== email) {
            sendError(res, "You can only reject applications for your own tuitions", 403);
            return;
        }

        const updated = await ApplicationModel.updateStatus(objectId, "rejected" as ApplicationStatus);

        sendSuccess(res, updated, "Application rejected successfully");
    }
}
