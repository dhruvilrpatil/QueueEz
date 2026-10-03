import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { MessagingService } from './service';
import { UserContext } from './policies';

const service = new MessagingService();

function getUserContext(req: AuthenticatedRequest): UserContext {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
    facilityId: req.user!.facilityId,
  };
}

export class MessagingController {
  /**
   * GET /api/v1/conversations
   */
  async listConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const {
        status,
        category,
        priority,
        search,
        assigned_to_me,
        unread_only,
        page,
        limit,
      } = req.query as Record<string, string>;

      const result = await service.listConversations(user, {
        status: status as any,
        category,
        priority: priority as any,
        search,
        assigned_to_me: assigned_to_me === 'true',
        unread_only: unread_only === 'true',
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          unread_total: result.unreadTotal,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/conversations/unread-count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const count = await service.getUnreadCount(user);
      res.json({
        success: true,
        data: { unread_count: count },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/conversations/:id
   */
  async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const conversation = await service.getConversation(user, req.params.id as string);
      res.json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/conversations
   */
  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const result = await service.createCustomerQuery(user, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/conversations/:id/messages
   */
  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const messages = await service.getMessages(user, req.params.id as string);
      res.json({
        success: true,
        data: messages,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/conversations/:id/messages
   */
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const message = await service.sendMessage(user, req.params.id as string, req.body);
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/conversations/:id/read
   */
  async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      await service.markRead(user, req.params.id as string);
      res.json({
        success: true,
        data: { message: 'Conversation marked as read' },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/conversations/:id/status
   */
  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const updated = await service.updateStatus(user, req.params.id as string, req.body.status);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/conversations/:id/priority
   */
  async updatePriority(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const updated = await service.updatePriority(user, req.params.id as string, req.body.priority);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/conversations/:id/assign
   */
  async assignStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const updated = await service.assignStaff(user, req.params.id as string, req.body.assigned_staff_id);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/messages/:id/reactions
   */
  async addReaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const reaction = await service.addReaction(user, req.params.id as string, req.body.reaction);
      res.status(201).json({
        success: true,
        data: reaction,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/messages/:id/reactions/:reactionId
   */
  async removeReaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      await service.removeReaction(user, req.params.reactionId as string);
      res.json({
        success: true,
        data: { message: 'Reaction removed' },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/conversations/:id/attachments
   */
  async createAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = getUserContext(req);
      const attachment = await service.createAttachment(user, req.body);
      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (err) {
      next(err);
    }
  }
}
