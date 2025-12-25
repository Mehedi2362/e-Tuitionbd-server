// ==================== Response Helpers ====================
import type { Response } from "express";
import { HTTP_STATUS } from "../constants/index.js";

// ==================== Success Response ====================
export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = "Success"
): void => {
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message,
        data,
    });
};

// ==================== Created Response ====================
export const sendCreated = <T>(
    res: Response,
    data: T,
    message: string = "Created successfully"
): void => {
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message,
        data,
    });
};

// ==================== Paginated Response ====================
export const sendPaginated = <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = "Data fetched successfully"
): void => {
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
};

// ==================== Error Response ====================
export const sendError = (
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.BAD_REQUEST
): void => {
    res.status(statusCode).json({
        success: false,
        message,
    });
};

// ==================== Not Found Response ====================
export const sendNotFound = (
    res: Response,
    message: string = "Resource not found"
): void => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message,
    });
};
