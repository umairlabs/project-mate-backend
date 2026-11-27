import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const subjectsRouter = Router();

// ============================================================================
// GET ALL SUBJECTS
// ============================================================================
subjectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;

    const where: any = {};

    if (category) {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    sendSuccess(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE SUBJECT
// ============================================================================
subjectsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tutorListings: true,
            helpRequests: true
          }
        }
      }
    });

    if (!subject) {
      return sendError(res, 'Subject not found', 404);
    }

    sendSuccess(res, subject, 'Subject retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CREATE SUBJECT (Admin only)
// ============================================================================
subjectsRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user!.role;
    const { name, category, description } = req.body;

    // Check if user is admin
    if (userRole !== 'admin') {
      return sendError(res, 'Unauthorized. Admin access required.', 403);
    }

    // Validation
    if (!name || !category) {
      return sendError(res, 'name and category are required', 400);
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        category,
        description: description || null
      }
    });

    sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATUS ENDPOINT
// ============================================================================
subjectsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'subjects', status: 'initialized' }, 'Subjects module ready');
});
