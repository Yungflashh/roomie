import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '../types';
import ApiError from './ApiError';

export class JWTUtils {
  // Generate Access Token
  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn:  '15m',
      issuer: 'roommate-finder',
      audience: 'roommate-finder-api',
    };

    return jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      },
      process.env.JWT_SECRET as string,
      options
    );
  }

  // Generate Refresh Token
  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: '7d',
      issuer: 'roommate-finder',
      audience: 'roommate-finder-api',
    };

    return jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      },
      process.env.JWT_REFRESH_SECRET as string,
      options
    );
  }

  // Verify Access Token
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
        {
          issuer: 'roommate-finder',
          audience: 'roommate-finder-api',
        }
      ) as TokenPayload;
      
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid access token');
      }
      throw new ApiError(401, 'Token verification failed');
    }
  }

  // Verify Refresh Token
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET as string,
        {
          issuer: 'roommate-finder',
          audience: 'roommate-finder-api',
        }
      ) as TokenPayload;
      
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid refresh token');
      }
      throw new ApiError(401, 'Token verification failed');
    }
  }

  // Generate Both Tokens
  static generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  // Decode Token Without Verification (for debugging)
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}