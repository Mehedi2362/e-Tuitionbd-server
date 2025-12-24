// ==================== General Helpers ====================
import { ObjectId } from "mongodb";

// ==================== ObjectId Helpers ====================
export const toObjectId = (id: string): ObjectId | null => {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
};

export const isValidObjectId = (id: string): boolean => {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

// ==================== Search Query Builder ====================
export const buildSearchQuery = (
    search: string,
    fields: string[]
): Record<string, unknown> => {
    const regex = { $regex: search, $options: "i" };
    return {
        $or: fields.map((field) => ({ [field]: regex })),
    };
};
