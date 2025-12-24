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
        if (subject && subject !== "all") filter.subject = { $regex: subject, $options: "i" };
        if (className && className !== "all") filter.class = { $regex: className, $options: "i" };
        if (location && location !== "all") filter.location = { $regex: location, $options: "i" };
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
            // sort: sortOptions, 
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

    // ==================== Get Filter Options ====================
    static async getFilterOptions(req: Request, res: Response) {
        // Get distinct values from the database for approved tuitions only
        const filter = { status: "approved" as const };

        const [classes, subjects, locations] = await Promise.all([
            TuitionModel.getDistinctValues("class", filter),
            TuitionModel.getDistinctValues("subject", filter),
            TuitionModel.getDistinctValues("location", filter),
        ]);

        // Sort and format the options
        const classOptions = ["all", ...classes.sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            return numA - numB;
        })];

        const subjectOptions = ["all", ...subjects.sort()];
        const locationOptions = ["all", ...locations.sort()];

        res.json({
            success: true,
            data: {
                classes: classOptions,
                subjects: subjectOptions,
                locations: locationOptions,
            },
        });
    }

    // ==================== Get All Tutors ====================
    static async getTutors(req: Request, res: Response) {
        const {
            page = "1",
            limit = "10",
            sort = "createdAt",
            order = "desc",
            subject,
            location,
            experience,
            search,
        } = req.query as {
            page?: string;
            limit?: string;
            sort?: string;
            order?: string;
            subject?: string;
            location?: string;
            experience?: string;
            search?: string;
        };

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build filter - only active tutors are public
        const filter: Record<string, unknown> = { role: "tutor", status: "active" };

        // Subject filter
        if (subject && subject !== "all") {
            filter.subjects = { $regex: subject, $options: "i" };
        }

        // Location filter
        if (location && location !== "all") {
            filter.location = { $regex: location, $options: "i" };
        }

        // Experience filter
        if (experience && experience !== "all") {
            const experienceNum = parseInt(experience.split("-")[0] || "0", 10);
            filter.experience = { $gte: experienceNum.toString() };
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { subjects: { $regex: search, $options: "i" } },
                { qualifications: { $regex: search, $options: "i" } },
                { bio: { $regex: search, $options: "i" } },
            ];
        }

        // Sort options
        const sortOptions: Record<string, 1 | -1> = {
            [sort]: order === "asc" ? 1 : -1,
        };

        const { data, total } = await UserModel.findTutors(filter, {
            skip,
            limit: limitNum,
            // sort: sortOptions,
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

    // ==================== Get Tutor Filter Options ====================
    static async getTutorFilterOptions(req: Request, res: Response) {
        // Get distinct values from the database for active tutors only
        const filter = { role: "tutor" as const, status: "active" as const };

        const [subjects, locations] = await Promise.all([
            UserModel.getDistinctValues("subjects", filter),
            UserModel.getDistinctValues("location", filter),
        ]);

        // Format the options
        const subjectOptions = ["all", ...subjects.sort()];
        const locationOptions = ["all", ...locations.filter(Boolean).sort()];
        const experienceOptions = ["all", "0-1", "1-2", "3-5", "5+"];

        res.json({
            success: true,
            data: {
                subjects: subjectOptions,
                locations: locationOptions,
                experience: experienceOptions,
            },
        });
    }
}
