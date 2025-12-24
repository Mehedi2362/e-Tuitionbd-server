// ==================== Admin Dashboard Controller ====================
import type { Response } from "express";
import { WithId } from "mongodb";
import {
    parsePagination,
    sendNotFound,
    sendPaginated,
    sendSuccess,
    toObjectId,
} from "../../../shared/utils/index.js";
import {
    UserModel,
    TuitionModel,
    type IPayment,
    PaymentModel,
    ApplicationModel,
} from "../../../shared/models/index.js";
import type { AuthRequest } from "../../auth/types.js";

// ==================== Types ====================
export interface DashboardStats {
    totalUsers: number;
    totalTuitions: number;
    totalApplications: number;
    totalPayments: number;
    totalRevenue: number;
    recentTransactions: WithId<IPayment>[];
}

// ==================== Admin Dashboard Controller Class ====================
export class AdminDashboardController {
    // ==================== Get Dashboard Stats ====================
    static async getDashboard(_req: AuthRequest, res: Response): Promise<void> {
        const [
            { total: totalUsers },
            { total: totalTuitions },
            { total: totalApplications },
            { data: recentTransactions, total: totalPayments },
            totalRevenue,
        ] = await Promise.all([
            UserModel.findAll({}, { limit: 0 }),
            TuitionModel.findAll({}, { limit: 0 }),
            ApplicationModel.findAll({}, { limit: 0 }),
            PaymentModel.findAll({}, { limit: 10, sort: { createdAt: -1 } }),
            PaymentModel.getPlatformEarnings(),
        ]);

        const stats: DashboardStats = {
            totalUsers,
            totalTuitions,
            totalApplications,
            totalPayments,
            totalRevenue,
            recentTransactions,
        };

        sendSuccess(res, stats, "Dashboard stats fetched successfully");
    }

    // ==================== Get Analytics Data ====================
    static async getAnalytics(_req: AuthRequest, res: Response): Promise<void> {
        sendSuccess(
            res,
            {
                revenue: await PaymentModel.revenue(),
                usersByRole: await UserModel.usersByRole(),
                tuitionsByStatus: await TuitionModel.countByStatus(),
                applicationsByStatus: await ApplicationModel.countByStatus(),
            },
            "Analytics data fetched successfully"
        );
    }

    // ==================== Get All Users ====================
    static async getUsers(req: AuthRequest, res: Response): Promise<void> {
        const { page, limit, skip, sort } = parsePagination(
            req.query as Record<string, string>
        );
        const { role, status, search } = req.query as Record<string, string>;

        const query: Record<string, unknown> = {};

        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const { data: users, total } = await UserModel.findAll(query as Parameters<typeof UserModel.findAll>[0], { skip, limit, sort });

        sendPaginated(res, users, page, limit, total);
    }

    // ==================== Get User by Email ====================
    static async getUserByEmail(req: AuthRequest, res: Response): Promise<void> {
        const { email } = req.params;
        const user = await UserModel.findByEmail(email);

        if (!user) {
            sendNotFound(res, "User not found");
            return;
        }

        sendSuccess(res, user, "User fetched successfully");
    }

    // ==================== Update User Role ====================
    static async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
        const { email } = req.params;
        const { role } = req.body;

        const user = await UserModel.updateRole(email, role);

        if (!user) {
            sendNotFound(res, "User not found");
            return;
        }

        sendSuccess(res, user, "User role updated successfully");
    }

    // ==================== Update User Status (Ban/Unban) ====================
    static async updateUserStatus(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { email } = req.params;
        const { status } = req.body;

        const user = await UserModel.updateStatus(email, status);

        if (!user) {
            sendNotFound(res, "User not found");
            return;
        }

        sendSuccess(res, user, "User status updated successfully");
    }

    // ==================== Delete User ====================
    static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
        const { email } = req.params;
        const deleted = await UserModel.deleteByEmail(email);

        if (!deleted) {
            sendNotFound(res, "User not found");
            return;
        }

        sendSuccess(res, null, "User deleted successfully");
    }

    // ==================== Get All Tuitions ====================
    static async getTuitions(req: AuthRequest, res: Response): Promise<void> {
        const { page, limit, skip, sort } = parsePagination(
            req.query as Record<string, string>
        );
        const { status, search } = req.query as Record<string, string>;

        const query: Record<string, unknown> = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { studentName: { $regex: search, $options: "i" } },
            ];
        }

        const { data: tuitions, total } = await TuitionModel.findAll(query as Parameters<typeof TuitionModel.findAll>[0], { skip, limit, sort });

        sendPaginated(res, tuitions, page, limit, total);
    }

    // ==================== Update Tuition Status (Approve/Reject) ====================
    static async updateTuitionStatus(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { status } = req.body;

        const objectId = toObjectId(id);
        if (!objectId) {
            sendNotFound(res, "Invalid tuition ID");
            return;
        }

        const tuition = await TuitionModel.updateStatus(objectId, status);

        if (!tuition) {
            sendNotFound(res, "Tuition not found");
            return;
        }

        sendSuccess(res, tuition, "Tuition status updated successfully");
    }

    // ==================== Get All Applications ====================
    static async getApplications(
        req: AuthRequest,
        res: Response
    ): Promise<void> {
        const { page, limit, skip, sort } = parsePagination(
            req.query as Record<string, string>
        );
        const { status } = req.query as Record<string, string>;

        const query: Record<string, unknown> = {};

        if (status) query.status = status;

        const { data: applications, total } = await ApplicationModel.findAll(query as Parameters<typeof ApplicationModel.findAll>[0], { skip, limit, sort });

        sendPaginated(res, applications, page, limit, total);
    }

    // ==================== Get All Payments ====================
    static async getPayments(req: AuthRequest, res: Response): Promise<void> {
        const { page, limit, skip, sort } = parsePagination(
            req.query as Record<string, string>
        );
        const { status } = req.query as Record<string, string>;

        const query: Record<string, unknown> = {};

        if (status) query.status = status;

        const { data: payments, total } = await PaymentModel.findAll(query as Parameters<typeof PaymentModel.findAll>[0], { skip, limit, sort });

        sendPaginated(res, payments, page, limit, total);
    }
}
