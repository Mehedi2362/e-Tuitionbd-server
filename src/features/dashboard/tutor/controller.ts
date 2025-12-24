// ==================== Tutor Dashboard Controller ====================
import type { Response } from "express";
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
    PaymentModel,
    type IApplication,
} from "../../../shared/models/index.js";
import type { AuthRequest } from "../../auth/types.js";

// ==================== Tutor Dashboard Controller Class ====================
export class TutorDashboardController {
    // ==================== Create Application ====================
    static async createApplication(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const {
            tuitionId,
            qualifications,
            experience,
            expectedSalary,
            coverLetter,
        } = req.body;
        const { email, name, picture } = req.user!;

        const objectId = toObjectId(tuitionId);
        if (!objectId) {
            sendError(res, "Invalid tuition ID");
            return;
        }

        // Check if tuition exists
        const tuition = await TuitionModel.findById(objectId);
        if (!tuition) {
            sendNotFound(res, "Tuition not found");
            return;
        }

        // Check if tuition is approved
        if (tuition.status !== "approved") {
            sendError(res, "You can only apply to approved tuitions", 400);
            return;
        }

        // Check if already applied
        const hasApplied = await ApplicationModel.hasApplied(objectId, email);
        if (hasApplied) {
            sendError(res, "You have already applied to this tuition", 400);
            return;
        }

        // Create application
        const application = await ApplicationModel.create({
            tuitionId: objectId,
            tutorId: email,
            tutorEmail: email,
            tutorName: name || "Unknown",
            tutorPhotoUrl: picture,
            qualifications,
            experience,
            expectedSalary: Number(expectedSalary),
            coverLetter,
        });

        // Increment applications count
        await TuitionModel.incrementApplicationsCount(objectId);

        sendCreated(res, application, SUCCESS_MESSAGES.APPLICATION_SUBMITTED);
    }

    // ==================== Get My Applications ====================
    static async getMyApplications(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { skip, limit, page } = parsePagination(req.query);
        const { email } = req.user!;
        const { status } = req.query;

        const filter: Partial<IApplication> = { tutorId: email };
        if (status) filter.status = status as IApplication["status"];

        const { data: applications, total } = await ApplicationModel.findByTutorId(
            email,
            { skip, limit }
        );

        sendPaginated(
            res,
            applications,
            page,
            limit,
            total,
            "Your applications fetched successfully"
        );
    }

    // ==================== Get Application by ID ====================
    static async getApplicationById(
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

        const application = await ApplicationModel.findById(objectId);

        if (!application) {
            sendNotFound(res, "Application not found");
            return;
        }

        // Check ownership
        if (application.tutorId !== email) {
            sendError(res, "You can only view your own applications", 403);
            return;
        }

        sendSuccess(res, application, "Application fetched successfully");
    }

    // ==================== Update Application ====================
    static async updateApplication(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { email } = req.user!;
        const { qualifications, experience, expectedSalary, coverLetter } =
            req.body;

        const objectId = toObjectId(id);
        if (!objectId) {
            sendError(res, "Invalid application ID");
            return;
        }

        // Check ownership
        const isOwner = await ApplicationModel.isOwner(objectId, email);
        if (!isOwner) {
            sendError(res, "You can only update your own applications", 403);
            return;
        }

        const updateData: Partial<IApplication> = {};
        if (qualifications !== undefined)
            updateData.qualifications = qualifications;
        if (experience !== undefined) updateData.experience = experience;
        if (expectedSalary !== undefined)
            updateData.expectedSalary = Number(expectedSalary);
        if (coverLetter !== undefined) updateData.coverLetter = coverLetter;

        const application = await ApplicationModel.updateById(objectId, updateData);

        if (!application) {
            sendNotFound(res, "Application not found");
            return;
        }

        sendSuccess(res, application, "Application updated successfully");
    }

    // ==================== Delete Application ====================
    static async deleteApplication(
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

        // Get application first
        const application = await ApplicationModel.findById(objectId);
        if (!application) {
            sendNotFound(res, "Application not found");
            return;
        }

        // Check ownership
        if (application.tutorId !== email) {
            sendError(res, "You can only delete your own applications", 403);
            return;
        }

        // Delete application
        await ApplicationModel.deleteById(objectId);

        // Decrement applications count
        await TuitionModel.decrementApplicationsCount(application.tuitionId);

        sendSuccess(res, null, "Application deleted successfully");
    }

    // ==================== Get Ongoing Tuitions ====================
    static async getOngoingTuitions(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { skip, limit, page } = parsePagination(req.query);
        const { email } = req.user!;

        // Get approved applications for this tutor
        const { data: applications, total } = await ApplicationModel.findByTutorId(
            email,
            { skip, limit }
        );

        // Filter only approved applications and get tuition details
        const approvedApplications = applications.filter(app => app.status === 'approved');

        // Get tuition details for each approved application
        const tuitionsWithDetails = await Promise.all(
            approvedApplications.map(async (app) => {
                const tuition = await TuitionModel.findById(app.tuitionId);
                return tuition;
            })
        );

        // Filter out null tuitions
        const tuitions = tuitionsWithDetails.filter(t => t !== null);

        sendPaginated(
            res,
            tuitions,
            page,
            limit,
            tuitions.length,
            "Ongoing tuitions fetched successfully"
        );
    }

    // ==================== Get Earnings ====================
    static async getEarnings(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { email } = req.user!;

        // Get all payments for this tutor
        const { data: payments } = await PaymentModel.findByTutorId(email);

        // Calculate earnings
        const completedPayments = payments.filter(p => p.status === 'completed');
        const pendingPayments = payments.filter(p => p.status === 'pending');

        const totalEarnings = completedPayments.reduce((sum, p) => sum + (p.tutorEarnings || p.amount), 0);
        const pendingEarnings = pendingPayments.reduce((sum, p) => sum + (p.tutorEarnings || p.amount), 0);
        const paidEarnings = totalEarnings;

        sendSuccess(res, {
            totalEarnings,
            pendingEarnings,
            paidEarnings,
            transactions: payments,
        }, "Earnings fetched successfully");
    }

    // ==================== Get Payments ====================
    static async getPayments(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { skip, limit, page } = parsePagination(req.query);
        const { email } = req.user!;

        const { data: payments, total } = await PaymentModel.findByTutorId(email, { skip, limit });

        sendPaginated(
            res,
            payments,
            page,
            limit,
            total,
            "Payments fetched successfully"
        );
    }
}
