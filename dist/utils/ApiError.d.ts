declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    constructor(statusCode: number, message: string, isOperational?: boolean, details?: any, stack?: string);
}
export default ApiError;
//# sourceMappingURL=ApiError.d.ts.map