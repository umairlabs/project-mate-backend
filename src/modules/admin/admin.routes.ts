import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, authorize('admin'));

// ============================================================================
// PLATFORM METRICS
// GET /api/admin/metrics
// ============================================================================
adminRouter.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalConnections,
      activeConnections,
      openHelpRequests,
      totalSubjects,
      totalReports,
      openReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.connection.count(),
      prisma.connection.count({ where: { status: 'active' } }),
      prisma.helpRequest.count({ where: { status: 'open' } }),
      prisma.subject.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'pending' } }),
    ]);

    sendSuccess(res, {
      users: { total: totalUsers, verified: verifiedUsers, unverified: totalUsers - verifiedUsers },
      connections: { total: totalConnections, active: activeConnections },
      helpRequests: { open: openHelpRequests },
      subjects: { total: totalSubjects },
      reports: { total: totalReports, open: openReports },
    }, 'Platform metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LIST ALL USERS
// GET /api/admin/users?role=&search=&verified=&page=&limit=
// ============================================================================
adminRouter.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, verified, page = '1', limit = '20' } = req.query;

    const pageNum  = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const where: any = {};
    if (verified !== undefined) where.verified = verified === 'true';
    if (search) {
      where.OR = [
        { name:       { contains: search as string, mode: 'insensitive' } },
        { email:      { contains: search as string, mode: 'insensitive' } },
        { university: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true,
          university: true, major: true, year: true,
          verified: true, createdAt: true,
          _count: {
            select: {
              tutorListings:   true,
              helpRequests:    true,
              receivedReviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, {
      users,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// VERIFY / UNVERIFY A USER
// PATCH /api/admin/users/:id/verify
// ============================================================================
adminRouter.patch('/users/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return sendError(res, '`verified` must be a boolean', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendError(res, 'User not found', 404);

    const updated = await prisma.user.update({
      where: { id },
      data: { verified },
      select: { id: true, name: true, email: true, role: true, verified: true },
    });

    sendSuccess(res, updated, `User ${verified ? 'verified' : 'unverified'} successfully`);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE A USER  (hard delete; cascades via Prisma)
// DELETE /api/admin/users/:id
// ============================================================================
adminRouter.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id }     = req.params;
    const adminId    = req.user!.id;

    if (id === adminId) return sendError(res, 'Cannot delete your own account', 400);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendError(res, 'User not found', 404);

    await prisma.user.delete({ where: { id } });
    sendSuccess(res, { id }, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LIST ALL SUBJECTS  (with counts)
// GET /api/admin/subjects
// ============================================================================
adminRouter.get('/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: { select: { tutorListings: true, helpRequests: true } },
      },
      orderBy: { category: 'asc' },
    });
    sendSuccess(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CREATE SUBJECT
// POST /api/admin/subjects
// ============================================================================
adminRouter.post('/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, description } = req.body;
    if (!name || !category) return sendError(res, 'name and category are required', 400);

    const existing = await prisma.subject.findUnique({ where: { name } });
    if (existing) return sendError(res, 'A subject with this name already exists', 409);

    const subject = await prisma.subject.create({
      data: { name, category, description: description || null },
    });
    sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE SUBJECT
// PATCH /api/admin/subjects/:id
// ============================================================================
adminRouter.patch('/subjects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, category, description } = req.body;

    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return sendError(res, 'Subject not found', 404);

    const data: any = {};
    if (name        !== undefined) data.name        = name;
    if (category    !== undefined) data.category    = category;
    if (description !== undefined) data.description = description;

    const updated = await prisma.subject.update({ where: { id }, data });
    sendSuccess(res, updated, 'Subject updated successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE SUBJECT
// DELETE /api/admin/subjects/:id
// ============================================================================
adminRouter.delete('/subjects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { tutorListings: true, helpRequests: true } } },
    });
    if (!subject) return sendError(res, 'Subject not found', 404);

    if (subject._count.tutorListings > 0 || subject._count.helpRequests > 0) {
      return sendError(
        res,
        `Cannot delete: subject is used by ${subject._count.tutorListings} tutor listing(s) and ${subject._count.helpRequests} help request(s)`,
        409
      );
    }

    await prisma.subject.delete({ where: { id } });
    sendSuccess(res, { id }, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LIST ALL CONNECTIONS  (overview)
// GET /api/admin/connections?status=&page=&limit=
// ============================================================================
adminRouter.get('/connections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum  = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status as string;

    const [connections, total] = await Promise.all([
      prisma.connection.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, university: true } },
          tutor:   { select: { id: true, name: true, email: true, university: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.connection.count({ where }),
    ]);

    sendSuccess(res, {
      connections,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    }, 'Connections retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LIST REPORTS
// GET /api/admin/reports?status=&page=&limit=
// ============================================================================
adminRouter.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum  = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status as string;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.report.count({ where }),
    ]);

    sendSuccess(res, {
      reports,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    }, 'Reports retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE REPORT STATUS
// PATCH /api/admin/reports/:id
// ============================================================================
adminRouter.patch('/reports/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return sendError(res, `status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return sendError(res, 'Report not found', 404);

    const data: any = {};
    if (status     !== undefined) data.status     = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;

    const updated = await prisma.report.update({ where: { id }, data });
    sendSuccess(res, updated, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
});
