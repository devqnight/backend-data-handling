require('dotenv').config();
import express, { NextFunction, Response, Request } from 'express';
import cookieParser from 'cookie-parser';
import config from 'config';
import validateEnv from './utils/ValidateEnv';
import { AppDataSource } from './utils/data-source';
import redisClient from "./utils/ConnectRedis";
import authRouter from './routes/AuthRoutes';
import userRouter from './routes/UserRoutes';
import ApiError from './utils/ApiError';

AppDataSource.initialize()
    .then(async () => {
        // VALIDATE ENV
        validateEnv();

        const app = express();

        // MIDDLEWARE

        // 1. Body parser
        app.use(express.json({limit: '10kb'}));

        // 2. Logger

        // 3. Cookie Parser
        app.use(cookieParser());
        // 4. Cors

        // ROUTES
        app.use('/api/auth', authRouter);
        app.use('/api/users', userRouter);

        // HEALTH CHECKER
        app.get('/api/healthchecker', async (_, res: Response) => {
            const message = await redisClient.get('try');
            res.status(200).json({
                status: 'success',
                message,
            });
        });

        // UNHANDLED ROUTE
        app.all('*', (req: Request, res: Response, next: NextFunction) => {
           next(new ApiError(404, `Route ${req.originalUrl} not found`)); 
        });
        // GLOBAL ERROR HANDLER
        app.use(
            (error: ApiError, req: Request, res: Response, next: NextFunction) => {
                error.status = error.status || 'error';
                error.statusCode = error.statusCode || 500;

                res.status(error.statusCode).json({
                    status: error.status,
                    message: error.message,
                });
            }
        );


        const port = config.get<number>('port');
        app.listen(port);

        console.log(`Server started on port: ${port}`);
    })
    .catch((error) => console.log(error));

