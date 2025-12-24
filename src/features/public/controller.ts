// ==================== Public Controller ====================
// Handles public routes (no auth required)
import { Request, Response } from "express";
import { TuitionModel, UserModel } from "../../shared/models/index.js";
import type { TuitionQuery } from "../../shared/models/types.js";

export class PublicController {
    // ==================== Get All Tuitions ====================
    static async getTuitions(req: Request, res: Response) {
        const {
            page = "1",
            limit = "10",
            sort = "createdAt",
            order = "desc",
            subject,
            class: className,
            location,
            minBudget,
            maxBudget,
            search,
        } = req.query as TuitionQuery;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build filter - only approved tuitions are public
        const filter: Record<string, unknown> = { status: "approved" };
        if (subject) filter.subject = { $regex: subject, $options: "i" };
        if (className) filter.class = { $regex: className, $options: "i" };
        if (location) filter.location = { $regex: location, $options: "i" };
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) (filter.budget as Record<string, number>).$gte = parseInt(minBudget, 10);
            if (maxBudget) (filter.budget as Record<string, number>).$lte = parseInt(maxBudget, 10);
        }
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { class: { $regex: search, $options: "i" } },
            ];
        }

        const sortOptions: Record<string, 1 | -1> = {
            [sort]: order === "asc" ? 1 : -1,
        };

        const { data, total } = await TuitionModel.findAll(filter, {
            skip,
            limit: limitNum,
            sort: sortOptions,
        });

        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }

    // ==================== Get Featured Tuitions ====================
    static async getFeaturedTuitions(req: Request, res: Response) {
        const { data } = await TuitionModel.findAll(
            { status: "approved" },
            { limit: 6, sort: { createdAt: -1 } }
        );

        res.json({ success: true, data });
    }

    // ==================== Get Tuition By ID ====================
    static async getTuitionById(req: Request, res: Response) {
        const { id } = req.params;
        const tuition = await TuitionModel.findById(id);

        if (!tuition) {
            res.status(404).json({
                success: false,
                message: "Tuition not found",
            });
            return;
        }

        res.json({ success: true, data: tuition });
    }

    // ==================== Get All Tutors ====================
    static async getTutors(req: Request, res: Response) {
        const { page = "1", limit = "10", search } = req.query as {
            page?: string;
            limit?: string;
            search?: string;
        };

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, unknown> = { status: "active" };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { subjects: { $regex: search, $options: "i" } },
                { qualifications: { $regex: search, $options: "i" } },
            ];
        }

        const { data, total } = await UserModel.findTutors(filter, {
            skip,
            limit: limitNum,
        });

        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }

    // ==================== Get Featured Tutors ====================
    static async getFeaturedTutors(req: Request, res: Response) {
        const { data } = await UserModel.findTutors(
            { status: "active" },
            { limit: 6 }
        );

        res.json({ success: true, data });
    }

    // ==================== Get Tutor By ID ====================
    static async getTutorById(req: Request, res: Response) {
        const { id } = req.params;
        const tutor = await UserModel.findById(id);

        if (!tutor || tutor.role !== "tutor") {
            res.status(404).json({
                success: false,
                message: "Tutor not found",
            });
            return;
        }

        res.json({ success: true, data: tutor });
    }
}
