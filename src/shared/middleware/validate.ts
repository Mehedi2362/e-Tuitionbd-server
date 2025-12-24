// ==================== Validation Middleware ====================
import type { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { HTTP_STATUS } from "../constants/index.js";

// ==================== Validate Request Body ====================
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {

        const result = schema.safeParse(req.body);

        if (!result.success) {
            const zodError = result.error as ZodError;
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Validation error",
                errors: zodError.issues.map((err: ZodIssue) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        req.body = result.data;
        next();
    };
};

// ==================== Validate Request Params ====================
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            const zodError = result.error as ZodError;
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Invalid parameters",
                errors: zodError.issues.map((err: ZodIssue) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        next();
    };
};

// ==================== Validate Request Query ====================
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            const zodError = result.error as ZodError;
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Invalid query parameters",
                errors: zodError.issues.map((err: ZodIssue) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        next();
    };
};
