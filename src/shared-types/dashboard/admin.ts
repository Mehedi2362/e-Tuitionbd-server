// ==================== Admin Dashboard Routes ====================
export const ADMIN_ROUTES = {
    DASHBOARD: "/admin/dashboard",
    ANALYTICS: "/admin/analytics",
} as const;

export const ADMIN_USER_ROUTES = {
    ALL: "/admin/users",
    BY_ID: (uid: string) => `/admin/users/${uid}`,
    UPDATE_ROLE: (uid: string) => `/admin/users/${uid}/role`,
    DELETE: (uid: string) => `/admin/users/${uid}`,
} as const;

export const ADMIN_TUITION_ROUTES = {
    ALL: "/admin/tuitions",
    BY_ID: (id: string) => `/admin/tuitions/${id}`,
    UPDATE_STATUS: (id: string) => `/admin/tuitions/${id}/status`,
} as const;

export const ADMIN_APPLICATION_ROUTES = {
    ALL: "/admin/applications",
    BY_ID: (id: string) => `/admin/applications/${id}`,
} as const;

export const ADMIN_PAYMENT_ROUTES = {
    ALL: "/admin/payments",
    BY_ID: (id: string) => `/admin/payments/${id}`,
} as const;
