// ==================== Reviews Routes ====================
export const REVIEW_ROUTES = {
    CREATE: "/reviews",
    GET_BY_TUTOR: (tutorId: string) => `/reviews/tutor/${tutorId}`,
    GET_STUDENT_REVIEW: (tutorId: string, studentId: string) => `/reviews/tutor/${tutorId}/student/${studentId}`,
    UPDATE: (reviewId: string) => `/reviews/${reviewId}`,
    DELETE: (reviewId: string) => `/reviews/${reviewId}`,
} as const;

// ==================== Exports ====================
export * from "./types.js";
export * from "./validators.js";
