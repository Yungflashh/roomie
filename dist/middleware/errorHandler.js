"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.errorConverter = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const logger_1 = require("../utils/logger");
const apiResponse_1 = require("../utils/apiResponse");
const errorConverter = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError_1.default)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError_1.default(statusCode, message, false, err.stack);
    }
    next(error);
};
exports.errorConverter = errorConverter;
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Internal Server Error';
    }
    res.locals.errorMessage = message;
    const response = {
        code: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
    if (process.env.NODE_ENV === 'development') {
        logger_1.logger.error(err);
    }
    apiResponse_1.ApiResponse.error(res, message, statusCode);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map