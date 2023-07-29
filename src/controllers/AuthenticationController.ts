import config from "config";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import { createUser, findUserByEmail, getUser, signTokens } from '../services/UserService';
import ApiError from "../utils/ApiError";
import { signJWT, verifyJWT } from '../utils/Jwt';
import { CreateUserInput, LoginUserType as LoginUserInput, ChangePasswordUserInput } from "../schemas/UserSchema";
import redisClient from "../utils/ConnectRedis";



// COOKIE OPTIONS
const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax'
};

if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000
}

const refreshTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000
}
// END COOKIE OPTIONS


// REGISTER USER
/**
 * Creates a new user, and saved it in db
 * @param req request, contains user values, according to the CreateUserInput type
 * @param res response, contains status, status code, and created user
 * @param next
 * @returns 
 */
export const registerUserHandler = async (
    req: Request<{}, {}, CreateUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;
        const user = await createUser({name, email: email.toLocaleLowerCase(), password});

        res.status(201).json({
            status: 'success',
            data: {user}
        });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({
                status: 'fail',
                message: 'User with that email already exist',
            });
        }
        next(error);
    }
};
// END REGISTER USER


// LOGIN USER
/**
 * Logs in a user, if user exists in db and password is correct. 
 * Also creates and signs access and refresh tokens for the user
 * @param req request, contains login user values, according to the LoginUserInput type
 * @param res response, contains status, status code, and logged in user
 * @param next
 * @returns 
 */
export const loginUserHandler = async (
    req: Request<{}, {}, LoginUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail({email});

        if (!user  || !(await User.comparePasswords(password, user.password))){
            return next(new ApiError(400, 'Invalid email or password'));
        }

        const {accessToken, refreshToken} = await signTokens(user);

        createCookies(res, accessToken, refreshToken);

        res.status(200).json({
            status: 'success',
            accessToken,
        });
    } catch (error: any) {
        next(error);
    }
};
// END LOGIN USER


// LOGOUT USER
/**
 * Resets tokens and logged in boolean
 * @param res 
 */
const logout = (res: Response) => {
    res.cookie('access_token', '', { maxAge: -1 });
    res.cookie('refresh_token', '', { maxAge: -1 });
    res.cookie('logged_in', '', { maxAge: -1 });
};
/**
 * Logs out the currently connected user
 * @param req 
 * @param res response, contains status, status code
 * @param next
 */
export const logoutHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        
        await redisClient.del(user.id);
        logout(res);
        res.status(200).json({
            status:'success'
        });
    } catch (error: any) {
        next(error)
    }
};
// END LOGOUT USER


// REFRESH TOKEN
/**
 * Refreshes the access token of the connected user if their refresh token is still valid
 * @param req request, contains cookies with the refresh token of the connected user
 * @param res response, contains status, status code, and new acces token
 * @param next 
 * @returns 
 */
export const refreshAccessTokenHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const message = 'Could not refresh access token';

        // Get refresh token from request cookies
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) return next(new ApiError(403, message));

        // Get decoded token
        const decoded = verifyJWT<{sub: string}>(refreshToken, 'refreshTokenPublicKey');

        if (!decoded) return next(new ApiError(403, message));

        // Get cached session
        const session = await redisClient.get(decoded.sub);

        if (!session) return next(new ApiError(403, message));

        // Get user from session's user id
        const user = await getUser(JSON.parse(session).id);

        if (!user) return next(new ApiError(403, message));

        // Revalidate access token
        const accessToken = signJWT({sub: user.id}, 'accessTokenPrivateKey', {
            expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`
        });

        createCookies(res, accessToken);

        res.status(200).json({
            status: 'success',
            accessToken
        })

    } catch (error: any) {
        next(error);
    }
};
// END REFRESH TOKEN

// RESET PASSWORD
/**
 * Resets the password of the connected user if with the new password value
 * @param req request, contains new passwords according to the ChangePasswordUserInput type
 * @param res response, contains status, status code, and updated user data (password is still invisible to user)
 * @param next 
 * @returns 
 */
export const changePasswordUserHandler = async (
    req: Request<{}, {}, ChangePasswordUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await getUser(res.locals.id);

        if (!user) return next(new ApiError(403, 'User not found'));

        //if the old password given by the user is incorrect, return error
        if (!(await User.comparePasswords(req.body.oldPassword, user.password))) return next(new ApiError(403, 'Invalid password'));

        user.password = req.body.password;
        //hash password before saving it -> not an insert, so not automatically hashed
        await user.hashPassword();
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
// END RESET PASSWORD




// FUNCTION UTILS
/**
 * Updates the response object with the new access and refresh tokens
 * @param res Response Object 
 * @param access_token 
 * @param refresh_token Optional, used only in case of user login
 */
const createCookies = (res: Response, access_token: string, refresh_token: string = '') => {
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    if(!!refresh_token){
        res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);
    }
    res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false
    });
}
//END FUNCTION UTILS