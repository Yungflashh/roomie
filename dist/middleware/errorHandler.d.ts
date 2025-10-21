import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
export declare const errorConverter: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: ApiError, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map