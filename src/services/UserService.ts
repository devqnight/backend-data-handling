import config from 'config';
import { User } from '../entities/User';
import { AppDataSource } from '../utils/data-source';
import { signJWT } from '../utils/Jwt';
import redisClient from '../utils/ConnectRedis';
import { CreateUserInput } from '../schemas/UserSchema';

const userRepository = AppDataSource.getRepository(User);

export const createUser = async (input: CreateUserInput) => {
    return (await AppDataSource.manager.save(
        AppDataSource.manager.create(User, input)
    )) as User;
};


export const findUserByEmail = async ({ email }: { email: string }) => {
    return await userRepository.findOneBy({ email });
};

export const getUser = async (userId: string) => {
    return await userRepository.findOneBy({ id: userId });
};

export const findUsers = async (query: Object) => {
    return await userRepository.find(query);
};

export const findUser = async (query: Object) => {
    return await userRepository.findOneBy(query);
};

/**
 * Generate and sign access and refresh tokens for given user.
 * Create session in cache for user
 * @param user 
 * @returns 
 */
export const signTokens = async (user: User) => {
    //redis session creation for user
    redisClient.set(user.id, JSON.stringify(user), {
        EX: config.get<number>('redisCacheExpiresIn') * 60,
    });

    //access token creation
    const accessToken = signJWT({ sub: user.id }, 'accessTokenPrivateKey', {
        expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
    });

    //refresh token creation
    const refreshToken = signJWT({ sub: user.id }, 'accessTokenPrivateKey', {
        expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
    });

    return { accessToken, refreshToken };
}