import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Validates user input with schema
 * @param schema 
 * @returns 
 */
export const validate = 
    (schema: AnyZodObject) =>
    (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            schema.parse({
                params: req.params,
                query: req.query,
                body: req.body
            });

            next();
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: 'fail',
                    errors: error.errors
                })
            }
            next(error);
        }
    }
