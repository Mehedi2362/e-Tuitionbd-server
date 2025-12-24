// ==================== Student Dashboard Routes ====================
export const STUDENT_TUITION_ROUTES = {
    ALL: "/tuitions",
    MY: "/tuitions/my",
    BY_ID: (id: string) => `/tuitions/${id}`,
    CREATE: "/tuitions/create",
    UPDATE: (id: string) => `/tuitions/${id}/update`,
    DELETE: (id: string) => `/tuitions/${id}/delete`,
} as const;

export const STUDENT_APPLICATION_ROUTES = {
    BY_TUITION: (tuitionId: string) => `/tuitions/${tuitionId}/applications`,
    ACCEPT: (applicationId: string) => `/applications/${applicationId}/accept`,
    REJECT: (applicationId: string) => `/applications/${applicationId}/reject`,
} as const;

export const STUDENT_PAYMENT_ROUTES = {
    ALL: "/payments",
    BY_ID: (id: string) => `/payments/${id}`,
} as const;
