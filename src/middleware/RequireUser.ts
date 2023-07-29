import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";

/**
 * Checks if the user is logged, if not, cannot access
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const requireUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;

        if (!user) {
            return next(new ApiError(400, `Session has expired or user doesn't exist`));
        }

        next();
    } catch (error: any) {
        next(error);
    }
};