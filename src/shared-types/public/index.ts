// ==================== Public Routes ====================
export const PUBLIC_TUITION_ROUTES = {
    ALL: "/tuitions",
    FEATURED: "/tuitions/featured",
    BY_ID: (id: string) => `/tuitions/${id}`,
    SEARCH: "/tuitions/search",
} as const;

export const PUBLIC_TUTOR_ROUTES = {
    ALL: "/tutors",
    FEATURED: "/tutors/featured",
    BY_ID: (id: string) => `/tutors/${id}`,
} as const;
