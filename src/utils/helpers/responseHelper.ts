import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta
    };

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = 'Error occurred',
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    error?: string
  ): Response {
    return this.error(res, message, 400, error);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    error?: string
  ): Response {
    return this.error(res, message, 401, error);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    error?: string
  ): Response {
    return this.error(res, message, 403, error);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    error?: string
  ): Response {
    return this.error(res, message, 404, error);
  }

  static conflict(
    res: Response,
    message: string = 'Conflict',
    error?: string
  ): Response {
    return this.error(res, message, 409, error);
  }

  static validationError(
    res: Response,
    message: string = 'Validation failed',
    error?: string
  ): Response {
    return this.error(res, message, 422, error);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Too many requests',
    error?: string
  ): Response {
    return this.error(res, message, 429, error);
  }

  static internalServerError(
    res: Response,
    message: string = 'Internal server error',
    error?: string
  ): Response {
    return this.error(res, message, 500, error);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): Response {
    const totalPages = Math.ceil(total / limit);
    
    return this.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages
    });
  }
} 