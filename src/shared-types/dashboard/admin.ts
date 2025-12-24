// ==================== Admin Dashboard Routes ====================
export const ADMIN_ROUTES = {
    DASHBOARD: "/dashboard",
    ANALYTICS: "/analytics",
} as const;

export const ADMIN_USER_ROUTES = {
    ALL: "/users",
    BY_ID: (uid: string) => `/users/${uid}`,
    UPDATE_ROLE: (uid: string) => `/users/${uid}/role`,
    DELETE: (uid: string) => `/users/${uid}`,
} as const;

export const ADMIN_TUITION_ROUTES = {
    ALL: "/tuitions",
    BY_ID: (id: string) => `/tuitions/${id}`,
    UPDATE_STATUS: (id: string) => `/tuitions/${id}/status`,
} as const;

export const ADMIN_APPLICATION_ROUTES = {
    ALL: "/applications",
    BY_ID: (id: string) => `/applications/${id}`,
} as const;

export const ADMIN_PAYMENT_ROUTES = {
    ALL: "/payments",
    BY_ID: (id: string) => `/payments/${id}`,
} as const;
