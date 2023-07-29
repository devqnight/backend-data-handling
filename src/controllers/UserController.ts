import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import { getUser, findUsers } from "../services/UserService";
import ApiError from "../utils/ApiError";
import { UpdateUserInput } from "../schemas/UserSchema";


// GET USERS
/**
 * Finds all users, according to the query, if query is undefined or null, the entirety of users is returned
 * @param req request, contains query, to precise the search for users
 * @param res response, contains status, status code, and data of search
 * @param next 
 */
export const findAllUsersHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const users: User[] = await findUsers(req.query);

        res.status(200).json({
            status: 'success',
            data: {
                users
            }
        });
    } catch (error: any) {
        next(error);
    }
};
// END GET USERS

// GET USER
/**
 * Finds a user matching the parameter id
 * @param req request, contains id parameter, to find a user
 * @param res response, contains status, status code, and data of search
 * @param next 
 * @returns 
 */
export const getUserHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await getUser(req.params.id);

        if(!user) return next(new ApiError(404, 'User not found'));
        
        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });

    } catch (error: any) {
        next(error);
    }
};
// END GET USERS

// UPDATE USER
/**
 * Updates a user according the id parameter
 * @param req request, contains id parameter of the user to update, as well as new values to update
 * @param res response, contains status, status code, and data of updated user
 * @param next 
 * @returns 
 */
export const updateUserHandler = async (
    req: Request<{id: string}, {}, UpdateUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await getUser(req.params.id);

        if (!user) return next(new ApiError(404, 'User not found'));

        Object.assign(user, req.body);

        const updUser = await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user: updUser
            }
        });
    } catch (error: any) {
        next(error);
    }
};
// END UPDATE USER

// DELETE USER
/**
 * Deletes the user with the id passed in parameter
 * @param req request, contains id parameter of the user to delete
 * @param res response, contains status, status code
 * @param next 
 * @returns 
 */
export const removeUserHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await getUser(req.params.id);

        if (!user) return next(new ApiError(404, 'User not found'));

        await user.remove();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error: any) {
        next(error);
    }
};
// END DELETE USER