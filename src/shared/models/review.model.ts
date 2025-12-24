// ==================== Review Model ====================
import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import type { IReview } from "@/shared-types/reviews/index.js";
import { db } from "@/config/db.js";

// ==================== Review Model Class ====================
export class ReviewModel {
    private static get collection() {
        return db.getDB().collection<IReview>('reviews');
    }

    // Create new review
    static async create(data: IReview): Promise<WithId<IReview>> {
        const newReview: IReview = {
            tutorId: data.tutorId,
            studentId: data.studentId,
            studentName: data.studentName,
            studentPhoto: data.studentPhoto || undefined,
            rating: data.rating,
            comment: data.comment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await this.collection.insertOne(newReview);
        return { ...newReview, _id: result.insertedId };
    }

    // Find by ID
    static async findById(id: string | ObjectId): Promise<WithId<IReview> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        return this.collection.findOne({ _id: objectId } as any);
    }

    // Find reviews by tutor ID
    static async findByTutor(
        tutorId: string,
        options: { skip?: number; limit?: number } = {}
    ): Promise<{ data: WithId<IReview>[]; total: number }> {
        const { skip = 0, limit = 10 } = options;

        const [data, total] = await Promise.all([
            this.collection
                .find({ tutorId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            this.collection.countDocuments({ tutorId }),
        ]);

        return { data, total };
    }

    // Find review by tutor and student
    static async findByTutorAndStudent(
        tutorId: string,
        studentId: string
    ): Promise<WithId<IReview> | null> {
        return this.collection.findOne({ tutorId, studentId });
    }

    // Find all reviews
    static async findAll(
        filter: Filter<IReview> = {},
        options: { skip?: number; limit?: number } = {}
    ): Promise<{ data: WithId<IReview>[]; total: number }> {
        const { skip = 0, limit = 10 } = options;

        const [data, total] = await Promise.all([
            this.collection
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            this.collection.countDocuments(filter),
        ]);

        return { data, total };
    }

    // Update review by ID
    static async updateById(
        id: string | ObjectId,
        data: Partial<IReview>
    ): Promise<WithId<IReview> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const updateData: UpdateFilter<IReview> = {
            $set: { ...data, updatedAt: new Date() },
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: objectId } as any,
            updateData,
            { returnDocument: "after" }
        );

        return result;
    }

    // Delete review by ID
    static async deleteById(id: string | ObjectId): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const result = await this.collection.deleteOne({ _id: objectId } as any);
        return result.deletedCount > 0;
    }

    // Delete reviews by tutor (for cascading delete)
    static async deleteByTutor(tutorId: string): Promise<number> {
        const result = await this.collection.deleteMany({ tutorId });
        return result.deletedCount;
    }

    // Get average rating for tutor
    static async getAverageRating(tutorId: string): Promise<number> {
        const result = await this.collection
            .aggregate([
                { $match: { tutorId } },
                { $group: { _id: null, avgRating: { $avg: "$rating" } } },
            ])
            .toArray();

        return result.length > 0 ? Math.round((result[0].avgRating + Number.EPSILON) * 10) / 10 : 0;
    }

    // Get review count for tutor
    static async getReviewCount(tutorId: string): Promise<number> {
        return this.collection.countDocuments({ tutorId });
    }
}
