// ==================== Tutor Dashboard Routes ====================
export const TUTOR_APPLICATION_ROUTES = {
    ALL: "/tutor/applications",
    MY: "/tutor/applications/my",
    BY_ID: (id: string) => `/tutor/applications/${id}`,
    CREATE: "/tutor/applications/create",
    UPDATE: (id: string) => `/tutor/applications/${id}/update`,
    DELETE: (id: string) => `/tutor/applications/${id}/delete`,
} as const;

export const TUTOR_TUITION_ROUTES = {
    ONGOING: "/tutor/tuitions/ongoing",
} as const;

export const TUTOR_PAYMENT_ROUTES = {
    EARNINGS: "/tutor/earnings",
    HISTORY: "/tutor/payments",
} as const;
