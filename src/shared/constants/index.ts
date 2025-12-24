// ==================== Shared Constants ====================
// HTTP Status, Error Messages, Success Messages

// ==================== HTTP Status Codes ====================
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// ==================== Error Messages ====================
export const ERROR_MESSAGES = {
    UNAUTHORIZED: "Unauthorized. Please log in to continue.",
    FORBIDDEN: "You do not have permission to perform this action.",
    NOT_FOUND: "Resource not found.",
    INVALID_TOKEN: "Invalid or expired token.",
    NO_TOKEN: "No token provided.",
    INVALID_CREDENTIALS: "Invalid credentials.",
    USER_EXISTS: "User already exists with this email.",
    INVALID_ROLE: "Invalid role. Must be student, tutor, or admin.",
    VALIDATION_ERROR: "Validation error. Please check your input.",
    SERVER_ERROR: "Internal server error. Please try again later.",
    DATABASE_ERROR: "Database error. Please try again later.",
} as const;

// ==================== Success Messages ====================
export const SUCCESS_MESSAGES = {
    LOGIN: "Login successful.",
    REGISTER: "Registration successful.",
    LOGOUT: "Logout successful.",
    CREATED: "Resource created successfully.",
    UPDATED: "Resource updated successfully.",
    DELETED: "Resource deleted successfully.",
    FETCHED: "Data fetched successfully.",
    PROFILE_UPDATE: "Profile updated successfully.",
    ROLE_UPDATE: "User role updated successfully.",
    TUITION_CREATED: "Tuition posted successfully.",
    TUITION_UPDATED: "Tuition updated successfully.",
    TUITION_DELETED: "Tuition deleted successfully.",
    TUITIONS_FETCHED: "Tuitions fetched successfully.",
    APPLICATION_SUBMITTED: "Application submitted successfully.",
    APPLICATION_UPDATED: "Application updated successfully.",
    PAYMENT_SUCCESS: "Payment completed successfully.",
} as const;
