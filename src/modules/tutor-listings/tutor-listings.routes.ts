import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { PrismaClient, TutorListingStatus } from '@prisma/client';

const prisma = new PrismaClient();
export const tutorListingsRouter = Router();

// ============================================================================
// GET ALL TUTOR LISTINGS (Public, with filters)
// ============================================================================
tutorListingsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, search, status = 'active' } = req.query;

    const where: any = {
      status: status as TutorListingStatus
    };

    if (subjectId) {
      where.subjectId = subjectId as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { courseCode: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const listings = await prisma.tutorListing.findMany({
      where,
      include: {
        tutor: {
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

    sendSuccess(res, listings, 'Tutor listings retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET MY LISTINGS (authenticated tutor's own listings)
// ============================================================================
tutorListingsRouter.get('/my-listings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const listings = await prisma.tutorListing.findMany({
      where: { tutorId: userId },
      include: {
        tutor: {
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

    sendSuccess(res, listings, 'My tutor listings retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE TUTOR LISTING
// ============================================================================
tutorListingsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const listing = await prisma.tutorListing.findUnique({
      where: { id },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            university: true,
            major: true,
            year: true,
            bio: true,
            verified: true,
            _count: {
              select: {
                receivedReviews: true
              }
            }
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

    if (!listing) {
      return sendError(res, 'Tutor listing not found', 404);
    }

    sendSuccess(res, listing, 'Tutor listing retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CREATE TUTOR LISTING
// ============================================================================
tutorListingsRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { subjectId, title, description, courseCode, ratePerHour, availability, format } = req.body;

    // Validation
    if (!subjectId || !title || !description || !ratePerHour) {
      return sendError(res, 'subjectId, title, description, and ratePerHour are required', 400);
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return sendError(res, 'Subject not found', 404);
    }

    const listing = await prisma.tutorListing.create({
      data: {
        tutorId: userId,
        subjectId,
        title,
        description,
        courseCode: courseCode || null,
        ratePerHour: parseFloat(ratePerHour),
        availability: availability || null,
        format: format || 'online',
        status: TutorListingStatus.active
      },
      include: {
        tutor: {
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

    sendSuccess(res, listing, 'Tutor listing created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE TUTOR LISTING
// ============================================================================
tutorListingsRouter.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, courseCode, ratePerHour, availability, format, status } = req.body;

    // Check if listing exists and belongs to user
    const existing = await prisma.tutorListing.findUnique({
      where: { id }
    });

    if (!existing) {
      return sendError(res, 'Tutor listing not found', 404);
    }

    if (existing.tutorId !== userId) {
      return sendError(res, 'Unauthorized to update this listing', 403);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (courseCode !== undefined) updateData.courseCode = courseCode;
    if (ratePerHour !== undefined) updateData.ratePerHour = parseFloat(ratePerHour);
    if (availability !== undefined) updateData.availability = availability;
    if (format !== undefined) updateData.format = format;
    if (status !== undefined) updateData.status = status;

    const updatedListing = await prisma.tutorListing.update({
      where: { id },
      data: updateData,
      include: {
        tutor: {
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

    sendSuccess(res, updatedListing, 'Tutor listing updated successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE TUTOR LISTING
// ============================================================================
tutorListingsRouter.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if listing exists and belongs to user
    const existing = await prisma.tutorListing.findUnique({
      where: { id }
    });

    if (!existing) {
      return sendError(res, 'Tutor listing not found', 404);
    }

    if (existing.tutorId !== userId) {
      return sendError(res, 'Unauthorized to delete this listing', 403);
    }

    await prisma.tutorListing.delete({
      where: { id }
    });

    sendSuccess(res, { id }, 'Tutor listing deleted successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATUS ENDPOINT
// ============================================================================
tutorListingsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'tutor-listings', status: 'initialized' }, 'Tutor listings module ready');
});
