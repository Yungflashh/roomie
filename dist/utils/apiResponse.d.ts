import { Response } from 'express';
export declare class ApiResponse {
    static success(res: Response, data?: any, message?: string, statusCode?: number, meta?: any): Response<any, Record<string, any>>;
    static error(res: Response, message?: string, statusCode?: number, errors?: any): Response<any, Record<string, any>>;
    static created(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
    static noContent(res: Response): Response<any, Record<string, any>>;
    static paginated(res: Response, data: any[], page: number, limit: number, total: number, message?: string): Response<any, Record<string, any>>;
}
//# sourceMappingURL=apiResponse.d.ts.map