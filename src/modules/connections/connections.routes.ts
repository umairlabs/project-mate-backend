import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authenticate } from '../../middleware/authenticate';
import { PrismaClient, ConnectionStatus, MessageType } from '@prisma/client';

const prisma = new PrismaClient();
export const connectionsRouter = Router();

// ============================================================================
// CREATE CONNECTION
// POST /api/connections
// ============================================================================
connectionsRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { tutorId, studentId, initiatedBy, subject, requestId, proposedRate, proposalMessage } = req.body;

    if (!tutorId || !studentId || !initiatedBy) {
      return sendError(res, 'tutorId, studentId, and initiatedBy are required', 400);
    }
    if (initiatedBy !== 'student' && initiatedBy !== 'tutor') {
      return sendError(res, 'initiatedBy must be "student" or "tutor"', 400);
    }
    if (tutorId === studentId) {
      return sendError(res, "You can't connect with yourself.", 400);
    }
    if (userId !== studentId && userId !== tutorId) {
      return sendError(res, 'Unauthorized to create this connection', 403);
    }

    // Block duplicate active connections
    const existing = await prisma.connection.findFirst({
      where: {
        studentId,
        tutorId,
        status: { in: ['pending_negotiation', 'active'] }
      }
    });
    if (existing) {
      return sendError(res, 'A connection already exists between these users', 409);
    }

    const connection = await prisma.connection.create({
      data: {
        studentId,
        tutorId,
        initiatedBy,
        subject: subject || null,
        requestId: requestId || null,
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        proposalMessage: proposalMessage || null,
        status: ConnectionStatus.pending_negotiation,
      },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, university: true } },
        tutor:   { select: { id: true, name: true, email: true, avatar: true, university: true } },
      }
    });

    // Create opening message
    await prisma.message.create({
      data: {
        connectionId: connection.id,
        senderId: userId,
        messageText: proposalMessage || `Hi, I'd like to connect with you regarding this request.`,
        messageType: MessageType.text,
      }
    });

    sendSuccess(res, connection, 'Connection created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET USER CONNECTIONS
// GET /api/connections?mode=learner|tutor
// ============================================================================
connectionsRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { mode } = req.query;

    const where = mode === 'tutor' ? { tutorId: userId } : { studentId: userId };

    const connections = await prisma.connection.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, university: true } },
        tutor:   { select: { id: true, name: true, email: true, avatar: true, university: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, messageText: true, createdAt: true, isRead: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    sendSuccess(res, connections, 'Connections retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE CONNECTION
// GET /api/connections/:id
// ============================================================================
connectionsRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, university: true } },
        tutor:   { select: { id: true, name: true, email: true, avatar: true, university: true } },
      }
    });

    if (!connection) return sendError(res, 'Connection not found', 404);
    if (connection.studentId !== userId && connection.tutorId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    sendSuccess(res, connection, 'Connection retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET MESSAGES
// GET /api/connections/:id/messages
// ============================================================================
connectionsRouter.get('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id },
      select: { studentId: true, tutorId: true }
    });

    if (!connection) return sendError(res, 'Connection not found', 404);
    if (connection.studentId !== userId && connection.tutorId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    const messages = await prisma.message.findMany({
      where: { connectionId: id },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: { connectionId: id, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    sendSuccess(res, messages, 'Messages retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SEND MESSAGE
// POST /api/connections/:id/messages
// ============================================================================
connectionsRouter.post('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { messageText, messageType, attachmentUrl } = req.body;

    if (!messageText) return sendError(res, 'messageText is required', 400);

    const connection = await prisma.connection.findUnique({
      where: { id },
      select: { studentId: true, tutorId: true, status: true }
    });

    if (!connection) return sendError(res, 'Connection not found', 404);
    if (connection.studentId !== userId && connection.tutorId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    const message = await prisma.message.create({
      data: {
        connectionId: id,
        senderId: userId,
        messageText,
        messageType: messageType || MessageType.text,
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    await prisma.connection.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    sendSuccess(res, message, 'Message sent successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE CONNECTION STATUS
// PATCH /api/connections/:id/status
// ============================================================================
connectionsRouter.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status, agreedRate } = req.body;

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) return sendError(res, 'Connection not found', 404);
    if (connection.studentId !== userId && connection.tutorId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    const data: any = {};
    if (status)     data.status     = status;
    if (agreedRate) data.agreedRate = parseFloat(agreedRate);

    const updated = await prisma.connection.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, name: true, email: true } },
        tutor:   { select: { id: true, name: true, email: true } },
      }
    });

    sendSuccess(res, updated, 'Connection updated successfully');
  } catch (error) {
    next(error);
  }
});
