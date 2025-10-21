"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("./ApiError"));
class JWTUtils {
    // Generate Access Token
    static generateAccessToken(payload) {
        const options = {
            expiresIn: '15m',
            issuer: 'roommate-finder',
            audience: 'roommate-finder-api',
        };
        return jsonwebtoken_1.default.sign({
            id: payload.id,
            email: payload.email,
            role: payload.role,
        }, process.env.JWT_SECRET, options);
    }
    // Generate Refresh Token
    static generateRefreshToken(payload) {
        const options = {
            expiresIn: '7d',
            issuer: 'roommate-finder',
            audience: 'roommate-finder-api',
        };
        return jsonwebtoken_1.default.sign({
            id: payload.id,
            email: payload.email,
            role: payload.role,
        }, process.env.JWT_REFRESH_SECRET, options);
    }
    // Verify Access Token
    static verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
                issuer: 'roommate-finder',
                audience: 'roommate-finder-api',
            });
            return decoded;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError_1.default(401, 'Access token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError_1.default(401, 'Invalid access token');
            }
            throw new ApiError_1.default(401, 'Token verification failed');
        }
    }
    // Verify Refresh Token
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET, {
                issuer: 'roommate-finder',
                audience: 'roommate-finder-api',
            });
            return decoded;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError_1.default(401, 'Refresh token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError_1.default(401, 'Invalid refresh token');
            }
            throw new ApiError_1.default(401, 'Token verification failed');
        }
    }
    // Generate Both Tokens
    static generateTokens(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }
    // Decode Token Without Verification (for debugging)
    static decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.JWTUtils = JWTUtils;
//# sourceMappingURL=jwt.utils.js.map