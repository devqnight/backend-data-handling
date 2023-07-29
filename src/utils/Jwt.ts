import jwt, { SignOptions} from 'jsonwebtoken';
import config from 'config';

/**
 * Sign a new token
 * @param payload payload to be used to generate token
 * @param keyName type of token to generate
 * @param options 
 * @returns 
 */
export const signJWT = (
    payload: Object,
    keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',
    options: SignOptions
) => {
    const privateKey = Buffer.from(
        config.get<string>(keyName),
        'base64'
    ).toString('ascii');
    return jwt.sign(payload, privateKey, {
        ...(options && options),
        algorithm: 'RS256'
    });
};

/**
 * Verifies token
 * @param token Token to verify
 * @param keyName 'accessTokenPublicKey' or 'refreshTokenPublicKey', get from config the corresponding key
 * @returns 
 */
export const verifyJWT = <T>(
    token: string,
    keyName: 'accessTokenPublicKey' | 'refreshTokenPublicKey'
): T | null => {
    try {
        const publicKey = Buffer.from(
            config.get<string>(keyName),
            'base64'
        ).toString('ascii');
        const decoded = jwt.verify(token, publicKey) as T;

        return decoded;
    } catch (error) {
        return null;
    }
}