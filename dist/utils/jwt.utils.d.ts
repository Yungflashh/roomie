import { TokenPayload } from '../types';
export declare class JWTUtils {
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(payload: TokenPayload): string;
    static verifyAccessToken(token: string): TokenPayload;
    static verifyRefreshToken(token: string): TokenPayload;
    static generateTokens(payload: TokenPayload): {
        accessToken: string;
        refreshToken: string;
    };
    static decodeToken(token: string): any;
}
//# sourceMappingURL=jwt.utils.d.ts.map