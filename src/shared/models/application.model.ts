// ==================== Application Model ====================
import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import { APPLICATION_LIST_PROJECTION } from "./constants.js";
import type { ApplicationStatus, IApplication } from "./types.js";
import { db } from "@/config/db.js";

const DEFAULT_APPLICATION_STATUS: ApplicationStatus = "pending";

// ==================== Application Model Class ====================
export class ApplicationModel {
    private static get collection() {
        return db.getDB().collection<IApplication>('applications');
    }

    // Create new application
    static async create(data: Omit<IApplication, 'status' | 'createdAt' | 'updatedAt'> & Partial<Pick<IApplication, 'status'>>): Promise<WithId<IApplication>> {
        const newApplication: IApplication = {
            tuitionId: data.tuitionId,
            tutorId: data.tutorId,
            tutorEmail: data.tutorEmail,
            tutorName: data.tutorName,
            tutorPhotoUrl: data.tutorPhotoUrl || null,
            qualifications: data.qualifications,
            experience: data.experience,
            expectedSalary: data.expectedSalary,
            coverLetter: data.coverLetter || "",
            status: data.status || DEFAULT_APPLICATION_STATUS,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await this.collection.insertOne(newApplication);
        return { ...newApplication, _id: result.insertedId };
    }

    // Find by ID
    static async findById(id: string | ObjectId): Promise<WithId<IApplication> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        return this.collection.findOne({ _id: objectId });
    }

    // Find all with pagination
    static async findAll(filter: Filter<IApplication> = {}, options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1>; } = {}): Promise<{ data: WithId<IApplication>[]; total: number }> {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;

        const [data, total] = await Promise.all([
            this.collection.find(filter, { projection: APPLICATION_LIST_PROJECTION }).sort(sort).skip(skip).limit(limit).toArray(),
            this.collection.countDocuments(filter),
        ]);

        return { data, total };
    }

    // Find by tuition ID
    static async findByTuitionId(tuitionId: string | ObjectId, options: { skip?: number; limit?: number } = {}): Promise<{ data: WithId<IApplication>[]; total: number }> {
        const objectId = typeof tuitionId === "string" ? new ObjectId(tuitionId) : tuitionId;
        return this.findAll({ tuitionId: objectId }, options);
    }

    // Find by tutor ID
    static async findByTutorId(tutorId: string, options: { skip?: number; limit?: number } = {}): Promise<{ data: WithId<IApplication>[]; total: number }> {
        return this.findAll({ tutorId }, options);
    }

    // Update by ID
    static async updateById(id: string | ObjectId, data: Partial<IApplication>): Promise<WithId<IApplication> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const updateData: UpdateFilter<IApplication> = {
            $set: { ...data, updatedAt: new Date() },
        };

        const result = await this.collection.findOneAndUpdate({ _id: objectId }, updateData, { returnDocument: "after" });
        return result;
    }

    // Update status
    static async updateStatus(id: string | ObjectId, status: ApplicationStatus): Promise<WithId<IApplication> | null> {
        return this.updateById(id, { status });
    }

    // Delete by ID
    static async deleteById(id: string | ObjectId): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const result = await this.collection.deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }

    // Delete by tuition ID (when tuition is deleted)
    static async deleteByTuitionId(tuitionId: string | ObjectId): Promise<number> {
        const objectId = typeof tuitionId === "string" ? new ObjectId(tuitionId) : tuitionId;
        const result = await this.collection.deleteMany({ tuitionId: objectId });
        return result.deletedCount;
    }

    // Check if tutor already applied
    static async hasApplied(tuitionId: string | ObjectId, tutorId: string): Promise<boolean> {
        const objectId = typeof tuitionId === "string" ? new ObjectId(tuitionId) : tuitionId;
        const count = await this.collection.countDocuments({ tuitionId: objectId, tutorId, });
        return count > 0;
    }

    // Check ownership
    static async isOwner(id: string | ObjectId, tutorId: string): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const count = await this.collection.countDocuments({ _id: objectId, tutorId, });
        return count > 0;
    }

    // Get applications count grouped by status
    static async countByStatus(): Promise<{ status: ApplicationStatus; count: number }[]> {
        const result = await this.collection
            .aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
            .toArray();

        return result.map(item => ({ status: item._id, count: item.count }));
    }
}