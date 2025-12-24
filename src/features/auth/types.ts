// ==================== Auth Types ====================
import type { Request } from "express";

export type TUserRole = 'student' | 'tutor' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'banned'


// Auth User (from token)
export interface AuthUser {
    email: string;
    name?: string;
    picture?: string;
    role: TUserRole;
}

// Auth Request (extends Express Request)
export interface AuthRequest extends Request {
    user?: AuthUser;
}


