"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map((validation) => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        const extractedErrors = errors.array().map((err) => ({
            field: err.type === 'field' ? err.path : undefined,
            message: err.msg,
        }));
        throw new ApiError_1.default(400, 'Validation Error', true);
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map