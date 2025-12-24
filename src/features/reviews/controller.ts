// ==================== Review Controller ====================
import type { Response } from "express";
import { ReviewModel, UserModel } from "../../shared/models/index.js";
import {
    sendCreated,
    sendError,
    sendNotFound,
    sendSuccess,
} from "../../shared/utils/index.js";
import { HTTP_STATUS } from "../../shared/constants/index.js";
import type { AuthRequest } from "../auth/types.js";

// ==================== Review Controller Class ====================
export class ReviewController {
    // ==================== Create Review ====================
    static async createReview(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { tutorId, rating, comment } = req.body;
            const studentId = req.user?.email;

            if (!studentId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Verify tutor exists
            const tutor = await UserModel.findById(tutorId);
            if (!tutor) {
                sendNotFound(res, "Tutor not found");
                return;
            }

            // Get student info
            const student = await UserModel.findByEmail(studentId);
            if (!student) {
                sendNotFound(res, "Student not found");
                return;
            }

            // Check if student already reviewed this tutor
            const existingReview = await ReviewModel.findByTutorAndStudent(tutorId, studentId);
            if (existingReview) {
                res.status(409).json({ error: "You have already reviewed this tutor" });
                return;
            }

            // Create review
            const review = await ReviewModel.create({
                tutorId,
                studentId,
                studentName: student.name || 'Anonymous',
                studentPhoto: student.photoUrl || undefined,
                rating,
                comment,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            sendCreated(res, { review });
        } catch (error) {
            sendError(res, "Failed to create review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== Get Reviews by Tutor ====================
    static async getReviewsByTutor(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { tutorId } = req.params;
            const skip = parseInt(req.query.skip as string) || 0;
            const limit = parseInt(req.query.limit as string) || 10;

            // Verify tutor exists
            const tutor = await UserModel.findById(tutorId);
            if (!tutor) {
                sendNotFound(res, "Tutor not found");
                return;
            }

            const { data, total } = await ReviewModel.findByTutor(tutorId, { skip, limit });

            // Format response
            const reviews = data.map((review) => ({
                _id: review._id?.toString(),
                student: {
                    name: review.studentName,
                    photo: review.studentPhoto,
                },
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt?.toISOString(),
            }));

            sendSuccess(res, { reviews, total, skip, limit });
        } catch (error) {
            sendError(res, "Failed to fetch reviews", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== Get Student's Review for Tutor ====================
    static async getStudentReview(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { tutorId, studentId } = req.params;

            const review = await ReviewModel.findByTutorAndStudent(tutorId, studentId);

            if (!review) {
                sendNotFound(res, "Review not found");
                return;
            }

            const formattedReview = {
                _id: review._id?.toString(),
                student: {
                    name: review.studentName,
                    photo: review.studentPhoto,
                },
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt?.toISOString(),
            };

            sendSuccess(res, { review: formattedReview });
        } catch (error) {
            sendError(res, "Failed to fetch review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== Update Review ====================
    static async updateReview(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { reviewId } = req.params;
            const { rating, comment } = req.body;
            const studentId = req.user?.email;

            if (!studentId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Get review
            const review = await ReviewModel.findById(reviewId);
            if (!review) {
                sendNotFound(res, "Review not found");
                return;
            }

            // Check ownership
            if (review.studentId !== studentId) {
                res.status(403).json({ error: "You can only update your own review" });
                return;
            }

            // Update review
            const updatedReview = await ReviewModel.updateById(reviewId, {
                rating: rating !== undefined ? rating : review.rating,
                comment: comment !== undefined ? comment : review.comment,
            });

            sendSuccess(res, { review: updatedReview });
        } catch (error) {
            sendError(res, "Failed to update review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== Delete Review ====================
    static async deleteReview(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { reviewId } = req.params;
            const studentId = req.user?.email;

            if (!studentId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Get review
            const review = await ReviewModel.findById(reviewId);
            if (!review) {
                sendNotFound(res, "Review not found");
                return;
            }

            // Check ownership
            if (review.studentId !== studentId) {
                res.status(403).json({ error: "You can only delete your own review" });
                return;
            }

            // Delete review
            const deleted = await ReviewModel.deleteById(reviewId);
            if (!deleted) {
                sendNotFound(res, "Review not found");
                return;
            }

            sendSuccess(res, { message: "Review deleted successfully" });
        } catch (error) {
            sendError(res, "Failed to delete review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== Get Tutor Rating Stats ====================
    static async getTutorRatingStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { tutorId } = req.params;

            // Verify tutor exists
            const tutor = await UserModel.findById(tutorId);
            if (!tutor) {
                sendNotFound(res, "Tutor not found");
                return;
            }

            const avgRating = await ReviewModel.getAverageRating(tutorId);
            const reviewCount = await ReviewModel.getReviewCount(tutorId);

            sendSuccess(res, { avgRating, reviewCount });
        } catch (error) {
            sendError(res, "Failed to fetch rating stats", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}
