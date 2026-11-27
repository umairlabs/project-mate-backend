import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export type Role = 'student' | 'tutor' | 'admin';

/**
 * Role-based authorization middleware factory.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' lacks permission for this action`,
          403
        )
      );
    }

    return next();
  };
}
