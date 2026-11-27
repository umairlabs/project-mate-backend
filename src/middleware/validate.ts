import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export type ValidatorFn = (req: Request) => string[] | null;

/**
 * Lightweight request validation middleware.
 * Easily integrates with schema libraries (Zod, Joi) or custom validators in feature phases.
 */
export function validate(validator: ValidatorFn) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validator(req);
    if (errors && errors.length > 0) {
      return next(new AppError('Validation failed', 400, errors));
    }
    return next();
  };
}
