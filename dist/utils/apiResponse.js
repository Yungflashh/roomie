"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200, meta) {
        const response = {
            success: true,
            message,
            data,
        };
        if (meta) {
            response.meta = meta;
        }
        return res.status(statusCode).json(response);
    }
    static error(res, message = 'Error', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
        };
        if (errors) {
            response.errors = errors;
        }
        return res.status(statusCode).json(response);
    }
    static created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
    static paginated(res, data, page, limit, total, message = 'Success') {
        const totalPages = Math.ceil(total / limit);
        return this.success(res, data, message, 200, {
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map