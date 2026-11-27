import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';
import { env } from '../config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  const errors = err instanceof AppError ? err.errors : undefined;

  if (env.nodeEnv !== 'production') {
    console.error(`[Error] ${req.method} ${req.url} - ${statusCode}:`, err);
  }

  return sendError(res, message, statusCode, errors);
}

export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
