import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { env } from '../../config/env';
import {
  generateOtp,
  otpExpiresAt,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../../services/email.service';

const prisma = new PrismaClient();
export const authRouter = Router();

// ============================================================================
// HELPERS
// ============================================================================
function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

function safeUser(user: {
  id: string; email: string; name: string; role: string;
  university: string | null; major: string | null; year: number | null;
  bio: string | null; avatar: string | null; phone: string | null;
  verified: boolean; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    university: user.university,
    major: user.major,
    year: user.year,
    bio: user.bio,
    avatarUrl: user.avatar,
    phone: user.phone,
    verified: user.verified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ============================================================================
// POST /api/auth/register
// ============================================================================
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, university, major, year } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'name, email, password and role are required', 400);
    }

    if (!['student', 'tutor'].includes(role)) {
      return sendError(res, 'role must be "student" or "tutor"', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        university: university || null,
        major: major || null,
        year: year ? parseInt(year) : null,
        verified: false, // must verify email via OTP before accessing the app
      }
    });

    // Generate OTP, hash it, store it, and send the verification email
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        email: user.email,
        code: hashedOtp,
        type: 'email_verification',
        expiresAt: otpExpiresAt(),
      },
    });

    await sendVerificationEmail(user.email, user.name, otp);

    // Return user + token — frontend will route to /auth/verify-email
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return sendSuccess(res, { user: safeUser(user), token, expiresAt }, 'Account created. Check your email for the verification code.', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/auth/login
// ============================================================================
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return sendSuccess(res, { user: safeUser(user), token, expiresAt }, 'Login successful');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/auth/me  — returns current user from token
// ============================================================================
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, safeUser(user), 'User fetched');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/auth/verify-email
// Body: { email, otp }
// Verifies the OTP and marks the user as verified.
// ============================================================================
authRouter.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendError(res, 'email and otp are required', 400);

    const record = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'email_verification',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return sendError(res, 'Invalid or expired code. Request a new one.', 400);

    const valid = await bcrypt.compare(otp, record.code);
    if (!valid) return sendError(res, 'Incorrect code. Please try again.', 400);

    // Mark OTP used and verify user in one transaction
    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { email: email.toLowerCase() }, data: { verified: true } }),
    ]);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return sendError(res, 'User not found', 404);

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return sendSuccess(res, { user: safeUser(user), token, expiresAt }, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/auth/resend-otp
// Body: { email }
// Resends the email verification OTP (rate-limited: 1 per minute).
// ============================================================================
authRouter.post('/resend-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'email is required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return sendError(res, 'No account found with this email', 404);
    if (user.verified) return sendError(res, 'This account is already verified', 400);

    // Rate limit: block if a code was sent in the last 60 seconds
    const recent = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'email_verification',
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) return sendError(res, 'Please wait a moment before requesting another code.', 429);

    const otp = generateOtp();
    const hashed = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        email: email.toLowerCase(),
        code: hashed,
        type: 'email_verification',
        expiresAt: otpExpiresAt(),
      },
    });

    await sendVerificationEmail(user.email, user.name, otp);
    return sendSuccess(res, null, 'Verification code sent');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/auth/forgot-password
// Body: { email }
// Sends a password-reset OTP if the account exists.
// ============================================================================
authRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'email is required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return sendError(res, 'No account found with this email address.', 404);
    }

    // Rate limit: 60 seconds between requests
    const recent = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'password_reset',
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) return sendError(res, 'Please wait a moment before requesting another code.', 429);

    const otp = generateOtp();
    const hashed = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        email: email.toLowerCase(),
        code: hashed,
        type: 'password_reset',
        expiresAt: otpExpiresAt(),
      },
    });

    await sendPasswordResetEmail(user.email, user.name, otp);
    return sendSuccess(res, null, 'If an account exists with that email, a reset code has been sent.');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/auth/reset-password
// Body: { email, otp, newPassword }
// Verifies the reset OTP and updates the password.
// ============================================================================
authRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return sendError(res, 'email, otp and newPassword are required', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const record = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'password_reset',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return sendError(res, 'Invalid or expired code. Request a new one.', 400);

    const valid = await bcrypt.compare(otp, record.code);
    if (!valid) return sendError(res, 'Incorrect code. Please try again.', 400);

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { email: email.toLowerCase() }, data: { password: hashed } }),
    ]);

    return sendSuccess(res, null, 'Password reset successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/auth/status
// ============================================================================
authRouter.get('/status', (_req, res) => {
  sendSuccess(res, { module: 'auth', status: 'active' }, 'Auth module ready');
});
