import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
export const usersRouter = Router();

// ============================================================================
// GET CURRENT USER PROFILE
// ============================================================================
usersRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        university: true,
        major: true,
        year: true,
        bio: true,
        avatar: true,
        phone: true,
        verified: true,
        createdAt: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE CURRENT USER PROFILE
// ============================================================================
usersRouter.patch('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, university, major, year, bio, avatar, phone } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (university !== undefined) updateData.university = university;
    if (major !== undefined) updateData.major = major;
    if (year !== undefined) updateData.year = year;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        university: true,
        major: true,
        year: true,
        bio: true,
        avatar: true,
        phone: true,
        verified: true,
        createdAt: true
      }
    });

    sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET USER BY ID (Public profile)
// ============================================================================
usersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        university: true,
        major: true,
        year: true,
        bio: true,
        avatar: true,
        verified: true,
        createdAt: true,
        // Include aggregated stats
        _count: {
          select: {
            tutorListings: true,
            helpRequests: true,
            sentReviews: true,
            receivedReviews: true
          }
        }
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATUS ENDPOINT
// ============================================================================
usersRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'users', status: 'initialized' }, 'Users module ready');
});
