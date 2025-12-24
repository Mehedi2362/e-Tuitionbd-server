// ==================== Payment Model ====================
import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import { PAYMENT_LIST_PROJECTION } from "./constants.js";
import type { IPayment, PaymentStatus } from "./types.js";
import { db } from "@/config/db.js";

const DEFAULT_PAYMENT_STATUS: PaymentStatus = "pending";

// ==================== Payment Model Class ====================
export class PaymentModel {
    private static get collection() {
        return db.getDB().collection<IPayment>('payments');
    }


    // Calculate platform fee and tutor earnings
    static calculateAmounts(amount: number): { platformFee: number; tutorEarnings: number; } {
        const platformFee = Math.round((amount * 10) / 100);
        const tutorEarnings = amount - platformFee;
        return { platformFee, tutorEarnings };
    }

    // Create new payment
    static async create(data: Omit<IPayment, 'platformFee' | 'tutorEarnings' | 'status' | 'createdAt' | 'updatedAt'> & Partial<Pick<IPayment, 'status' | 'stripePaymentIntentId' | 'stripeSessionId' | 'paidAt'>>): Promise<WithId<IPayment>> {
        const { platformFee, tutorEarnings } = this.calculateAmounts(data.amount);

        const newPayment: IPayment = {
            applicationId: data.applicationId,
            tuitionId: data.tuitionId,
            studentId: data.studentId,
            tutorId: data.tutorId,
            amount: data.amount,
            platformFee,
            tutorEarnings,
            stripePaymentIntentId: data.stripePaymentIntentId || undefined,
            stripeSessionId: data.stripeSessionId || undefined,
            status: data.status || DEFAULT_PAYMENT_STATUS,
            paidAt: data.paidAt || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await this.collection.insertOne(newPayment);
        return { ...newPayment, _id: result.insertedId };
    }

    // Find by ID
    static async findById(id: string | ObjectId): Promise<WithId<IPayment> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        return this.collection.findOne({ _id: objectId });
    }

    // Find by Stripe session ID
    static async findBySessionId(sessionId: string): Promise<WithId<IPayment> | null> {
        return this.collection.findOne({ stripeSessionId: sessionId });
    }

    // Find all with pagination
    static async findAll(filter: Filter<IPayment> = {}, options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1>; } = {}): Promise<{ data: WithId<IPayment>[]; total: number }> {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;

        const [data, total] = await Promise.all([
            this.collection.find(filter, { projection: PAYMENT_LIST_PROJECTION }).sort(sort).skip(skip).limit(limit).toArray(),
            this.collection.countDocuments(filter),
        ]);

        return { data, total };
    }

    // Find by student ID
    static async findByStudentId(studentId: string, options: { skip?: number; limit?: number } = {}): Promise<{ data: WithId<IPayment>[]; total: number }> {
        return this.findAll({ studentId }, options);
    }

    // Find by tutor ID
    static async findByTutorId(tutorId: string, options: { skip?: number; limit?: number } = {}): Promise<{ data: WithId<IPayment>[]; total: number }> {
        return this.findAll({ tutorId }, options);
    }

    // Update by ID
    static async updateById(id: string | ObjectId, data: Partial<IPayment>): Promise<WithId<IPayment> | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const updateData: UpdateFilter<IPayment> = {
            $set: { ...data, updatedAt: new Date() },
        };

        const result = await this.collection.findOneAndUpdate({ _id: objectId }, updateData, { returnDocument: "after" });
        return result;
    }

    // Update status
    static async updateStatus(id: string | ObjectId, status: PaymentStatus, paidAt?: Date): Promise<WithId<IPayment> | null> {
        const updateData: Partial<IPayment> = { status };
        if (paidAt) updateData.paidAt = paidAt;
        return this.updateById(id, updateData);
    }

    // Mark as completed
    static async markCompleted(id: string | ObjectId): Promise<WithId<IPayment> | null> {
        return this.updateStatus(id, "completed", new Date());
    }

    // Get total earnings for tutor
    static async getTutorEarnings(tutorId: string): Promise<number> {
        const result = await this.collection
            .aggregate<{ total: number }>([
                { $match: { tutorId, status: "completed" } },
                { $group: { _id: null, total: { $sum: "$tutorEarnings" } } },
            ]).toArray();

        return result[0]?.total || 0;
    }

    // Get platform total earnings
    static async getPlatformEarnings(): Promise<number> {
        const result = await this.collection
            .aggregate<{ total: number }>([
                { $match: { status: "completed" } },
                { $group: { _id: null, total: { $sum: "$platformFee" } } },
            ])
            .toArray();

        return result[0]?.total || 0;
    }

    static async revenue(
        startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ): Promise<number> {

        const result = await this.collection
            .aggregate<{ total: number }>([
                {
                    $match: {
                        status: "completed",
                        paidAt: { $gte: startDate, $lt: endDate },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$platformFee" },
                    },
                },
            ])
            .toArray();

        return result[0]?.total || 0;
    }
}
