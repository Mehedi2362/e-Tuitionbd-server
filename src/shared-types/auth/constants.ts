// ==================== User Roles ====================
export const ROLES = {
  STUDENT: "student",
  TUTOR: "tutor",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// ==================== User Status ====================
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

