// ==================== Shared Types ====================

// ==================== Pagination Query ====================
export interface PaginationQuery {
    page?: string;
    limit?: string;
    sort?: string;
    order?: "asc" | "desc";
}

// ==================== Paginated Response ====================
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
