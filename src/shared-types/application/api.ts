export const APPLICATION_ROUTES = {
  // Tutor's my applications
  ALL: "/tutor/applications",

  // Tutor application by ID
  BY_ID: (id: string) => `/tutor/applications/${id}`,

  // Student can view tutor applications for a specific tuition
  BY_TUITION: (tuitionId: string) => `/student/tuitions/${tuitionId}/applications`,

  // Tutor creates a new application
  CREATE: "/tutor/applications/create",

  // Tutor updates application
  UPDATE: (id: string) => `/tutor/applications/${id}/update`,

  // Tutor deletes application
  DELETE: (id: string) => `/tutor/applications/${id}/delete`,

  // Student accepts tutor application
  ACCEPT: (applicationId: string) => `/student/applications/${applicationId}/accept`,

  // Student rejects tutor application
  REJECT: (applicationId: string) => `/student/applications/${applicationId}/reject`,
} as const;
