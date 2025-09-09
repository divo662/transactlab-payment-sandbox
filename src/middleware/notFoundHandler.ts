import { Request, Response } from 'express';
import { ResponseHelper } from '../utils/helpers/responseHelper';

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseHelper.notFound(
    res,
    `Route ${req.originalUrl} not found`
  );
}; 