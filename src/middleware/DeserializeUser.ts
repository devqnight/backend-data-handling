import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { verifyJWT } from "../utils/Jwt";
import { getUser } from "../services/UserService";
import redisClient from "../utils/ConnectRedis";




export const deserializeUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let accessToken;

        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            accessToken = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.access_token){
            accessToken = req.cookies.access_token;
        }

        if(!accessToken){
            return next(new ApiError(401, 'You are not logged in'));
        }

        // ACCESS TOKEN VALIDATION
        const decoded = verifyJWT<{sub: string}>(accessToken, 'accessTokenPublicKey');

        if (!decoded){
            return next(new ApiError(401, `Invalid token or user doesn't exist`));
        }

        // CHECK IS THE USER HAS VALID SESSION
        const session = await redisClient.get(decoded.sub);

        if(!session) {
            return next(new ApiError(401, `Invalid token or session has expired`));
        }

        // CHECK IF USER STILL EXISTS
        const user = await getUser(JSON.parse(session).id);

        if (!user) {
            return next(new ApiError(401, `Invalid token or session has expired`));
        }

        // Add user to res.locals
        res.locals.user = user;

        next();
    } catch (error:any) {
        
    }
};