// ==================== Student Dashboard Routes ====================
export const STUDENT_TUITION_ROUTES = {
    ALL: "/student/tuitions",
    MY: "/student/tuitions/my",
    BY_ID: (id: string) => `/student/tuitions/${id}`,
    CREATE: "/student/tuitions/create",
    UPDATE: (id: string) => `/student/tuitions/${id}/update`,
    DELETE: (id: string) => `/student/tuitions/${id}/delete`,
} as const;

export const STUDENT_APPLICATION_ROUTES = {
    BY_TUITION: (tuitionId: string) => `/student/tuitions/${tuitionId}/applications`,
    ACCEPT: (applicationId: string) => `/student/applications/${applicationId}/accept`,
    REJECT: (applicationId: string) => `/student/applications/${applicationId}/reject`,
} as const;

export const STUDENT_PAYMENT_ROUTES = {
    ALL: "/student/payments",
    BY_ID: (id: string) => `/student/payments/${id}`,
} as const;
