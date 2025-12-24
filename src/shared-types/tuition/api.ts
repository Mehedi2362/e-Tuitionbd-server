export const TUITION_ROUTES = {
    // Public routes
    ALL: "/tuitions",
    FEATURED: "/tuitions/featured",
    BY_ID: (id: string) => `/tuitions/${id}`,

    // Student routes
    MY: "/student/tuitions",
    CREATE: "/student/tuitions/create",
    UPDATE: (id: string) => `/student/tuitions/${id}/update`,
    DELETE: (id: string) => `/student/tuitions/${id}/delete`,

    // Admin routes
    APPROVE: (id: string) => `/admin/tuitions/${id}/status/approve`,
    REJECT: (id: string) => `/admin/tuitions/${id}/status/reject`,
} as const;
