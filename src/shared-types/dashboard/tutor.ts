// ==================== Tutor Dashboard Routes ====================
export const TUTOR_APPLICATION_ROUTES = {
    ALL: "/applications",
    MY: "/applications/my",
    BY_ID: (id: string) => `/applications/${id}`,
    CREATE: "/applications/create",
    UPDATE: (id: string) => `/applications/${id}/update`,
    DELETE: (id: string) => `/applications/${id}/delete`,
} as const;

export const TUTOR_TUITION_ROUTES = {
    ONGOING: "/tuitions/ongoing",
} as const;

export const TUTOR_PAYMENT_ROUTES = {
    EARNINGS: "/earnings",
    HISTORY: "/payments",
} as const;
