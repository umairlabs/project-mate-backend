import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { PrismaClient, HelpRequestStatus, HelpRequestUrgency } from '@prisma/client';

const prisma = new PrismaClient();
export const helpRequestsRouter = Router();

// ============================================================================
// GET ALL HELP REQUESTS (Public, with filters)
// ============================================================================
helpRequestsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, search, status = 'open', urgency } = req.query;

    const where: any = {
      status: status as HelpRequestStatus
    };

    if (subjectId) {
      where.subjectId = subjectId as string;
    }

    if (urgency) {
      where.urgency = urgency as HelpRequestUrgency;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { courseCode: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const requests = await prisma.helpRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            university: true,
            verified: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccess(res, requests, 'Help requests retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE HELP REQUEST
// ============================================================================
helpRequestsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const request = await prisma.helpRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            university: true,
            major: true,
            year: true,
            verified: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        }
      }
    });

    if (!request) {
      return sendError(res, 'Help request not found', 404);
    }

    sendSuccess(res, request, 'Help request retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CREATE HELP REQUEST
// ============================================================================
helpRequestsRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { subjectId, title, description, courseCode, budget, urgency } = req.body;

    // Validation
    if (!subjectId || !title || !description || !courseCode || !budget) {
      return sendError(res, 'subjectId, title, description, courseCode, and budget are required', 400);
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return sendError(res, 'Subject not found', 404);
    }

    const helpRequest = await prisma.helpRequest.create({
      data: {
        studentId: userId,
        subjectId,
        title,
        description,
        courseCode,
        budget: parseFloat(budget),
        urgency: urgency || HelpRequestUrgency.medium,
        status: HelpRequestStatus.open
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            university: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    sendSuccess(res, helpRequest, 'Help request created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE HELP REQUEST
// ============================================================================
helpRequestsRouter.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, courseCode, budget, urgency, status } = req.body;

    // Check if request exists and belongs to user
    const existing = await prisma.helpRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return sendError(res, 'Help request not found', 404);
    }

    if (existing.studentId !== userId) {
      return sendError(res, 'Unauthorized to update this request', 403);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (courseCode !== undefined) updateData.courseCode = courseCode;
    if (budget !== undefined) updateData.budget = parseFloat(budget);
    if (urgency !== undefined) updateData.urgency = urgency;
    if (status !== undefined) updateData.status = status;

    const updatedRequest = await prisma.helpRequest.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            university: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    sendSuccess(res, updatedRequest, 'Help request updated successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE HELP REQUEST
// ============================================================================
helpRequestsRouter.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if request exists and belongs to user
    const existing = await prisma.helpRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return sendError(res, 'Help request not found', 404);
    }

    if (existing.studentId !== userId) {
      return sendError(res, 'Unauthorized to delete this request', 403);
    }

    await prisma.helpRequest.delete({
      where: { id }
    });

    sendSuccess(res, { id }, 'Help request deleted successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// INCREMENT PROPOSALS COUNT (Internal use by connections)
// ============================================================================
helpRequestsRouter.post('/:id/increment-proposals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const updatedRequest = await prisma.helpRequest.update({
      where: { id },
      data: {
        proposalsCount: {
          increment: 1
        }
      }
    });

    sendSuccess(res, updatedRequest, 'Proposals count incremented');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATUS ENDPOINT
// ============================================================================
helpRequestsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'help-requests', status: 'initialized' }, 'Help requests module ready');
});
