import { Request, Response, NextFunction } from 'express';
import { sendError } from '../lib/response';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
}

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled server error:', err);
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred on the server');
}
