// ==================== Pagination Helpers ====================
import type { PaginationQuery } from "../types/index.js";

// ==================== Parse Pagination ====================
export const parsePagination = (
    query: PaginationQuery
): {
    page: number;
    limit: number;
    skip: number;
    sort: Record<string, 1 | -1>;
} => {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "10", 10)));
    const skip = (page - 1) * limit;

    const sortField = query.sort || "createdAt";
    const sortOrder = query.order === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    return { page, limit, skip, sort };
};
