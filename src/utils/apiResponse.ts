import { Response } from 'express';

interface ApiResponseData {
  success: boolean;
  message?: string;
  data?: any;
  meta?: any;
  errors?: any;
}

export class ApiResponse {
  static success(res: Response, data: any = null, message = 'Success', statusCode = 200, meta?: any) {
    const response: ApiResponseData = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static error(res: Response, message = 'Error', statusCode = 500, errors: any = null) {
    const response: ApiResponseData = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static created(res: Response, data: any = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static paginated(
    res: Response,
    data: any[],
    page: number,
    limit: number,
    total: number,
    message = 'Success'
  ) {
    const totalPages = Math.ceil(total / limit);

    return this.success(
      res,
      data,
      message,
      200,
      {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      }
    );
  }
}