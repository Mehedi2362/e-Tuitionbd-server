// ==================== Tuition Model ====================
import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import type { ITuition, TuitionStatus } from "./types.js";
import { db } from "@/config/db.js";
import { TUITION_LIST_PROJECTION } from "./constants.js";

const DEFAULT_TUITION_STATUS: TuitionStatus = "pending";

// ==================== Tuition Model Class ====================
export class TuitionModel {
    private static get collection() {
        return db.getDB().collection<ITuition>('tuitions');
    }

    // Create new tuition
    static async create(data: Omit<ITuition, 'status' | 'applicationsCount' | 'createdAt' | 'updatedAt'> & Partial<Pick<ITuition, 'status' | 'applicationsCount'>>): Promise<WithId<ITuition>> {
        const newTuition: ITuition = {
            student: data.student,
            subject: data.subject,
            class: data.class,
            location: data.location,
            budget: data.budget,
            schedule: data.schedule,
            description: data.description || "",
            requirements: data.requirements || "",
            status: data.status || DEFAULT_TUITION_STATUS,
            applicationsCount: data.applicationsCount || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await this.collection.insertOne(newTuition);
        return { ...newTuition, _id: result.insertedId };
    }

    // Find by ID
    static async findById(id: string | ObjectId): Promise<WithId<ITuition> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        return this.collection.findOne({ _id: objectId });
    }

    // Find all with pagination and filters
    static async findAll(
        filter: Filter<ITuition> = {},
        options: {
            skip?: number;
            limit?: number;
            sort?: Record<string, 1 | -1>;
        } = {}
    ): Promise<{ data: WithId<ITuition>[]; total: number }> {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;

        const [data, total] = await Promise.all([
            this.collection
                .find(filter, { projection: TUITION_LIST_PROJECTION })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .toArray(),
            this.collection.countDocuments(filter),
        ]);

        return { data, total };
    }

    // Find by student ID
    static async findByStudentId(
        studentId: string,
        options: { skip?: number; limit?: number } = {}
    ): Promise<{ data: WithId<ITuition>[]; total: number }> {
        return this.findAll({ studentId }, options);
    }

    // Update by ID
    static async updateById(
        id: string | ObjectId,
        data: Partial<ITuition>
    ): Promise<WithId<ITuition> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const updateData: UpdateFilter<ITuition> = {
            $set: { ...data, updatedAt: new Date() },
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: objectId },
            updateData,
            { returnDocument: "after" }
        );

        return result;
    }

    // Update status
    static async updateStatus(
        id: string | ObjectId,
        status: TuitionStatus
    ): Promise<WithId<ITuition> | null> {
        return this.updateById(id, { status });
    }

    // Increment applications count
    static async incrementApplicationsCount(
        id: string | ObjectId
    ): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const result = await this.collection.updateOne(
            { _id: objectId },
            { $inc: { applicationsCount: 1 }, $set: { updatedAt: new Date() } }
        );
        return result.modifiedCount > 0;
    }

    // Decrement applications count
    static async decrementApplicationsCount(
        id: string | ObjectId
    ): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const result = await this.collection.updateOne(
            { _id: objectId },
            { $inc: { applicationsCount: -1 }, $set: { updatedAt: new Date() } }
        );
        return result.modifiedCount > 0;
    }

    // Delete by ID
    static async deleteById(id: string | ObjectId): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const result = await this.collection.deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }

    // Check ownership
    static async isOwner(
        id: string | ObjectId,
        studentId: string
    ): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const count = await this.collection.countDocuments({
            _id: objectId,
            studentId,
        });
        return count > 0;
    }

    // Search tuitions
    static async search(
        query: string,
        options: { skip?: number; limit?: number } = {}
    ): Promise<{ data: WithId<ITuition>[]; total: number }> {
        const searchFilter: Filter<ITuition> = {
            $or: [
                { subject: { $regex: query, $options: "i" } },
                { location: { $regex: query, $options: "i" } },
                { class: { $regex: query, $options: "i" } },
            ],
        };
        return this.findAll(searchFilter, options);
    }

    // Get tuitions count grouped by status
    static async countByStatus(): Promise<{ status: TuitionStatus; count: number }[]> {
        return this.collection
            .aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } }
            ])
            .toArray() as Promise<{ status: TuitionStatus; count: number }[]>;
    }

    // Get distinct values for a field with filters using aggregation (API v1 compatible)
    static async getDistinctValues(field: keyof ITuition, filter: Filter<ITuition> = {}): Promise<string[]> {
        const results = await this.collection
            .aggregate([
                { $match: filter },
                { $group: { _id: `$${String(field)}` } },
                { $sort: { _id: 1 } }
            ])
            .toArray();

        return results
            .map(doc => doc._id)
            .filter(value => value != null && value !== '')
            .map(v => String(v));
    }
}
