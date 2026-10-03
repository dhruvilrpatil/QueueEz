import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validation';
import { MessagingController } from './controller';
import {
  createConversationSchema,
  sendMessageSchema,
  updateStatusSchema,
  updatePrioritySchema,
  assignStaffSchema,
  addReactionSchema,
  createAttachmentSchema,
  queryConversationsSchema,
} from './schema';

const router = Router();
const controller = new MessagingController();

// Conversation queries
router.get(
  '/',
  authenticate,
  validateQuery(queryConversationsSchema),
  controller.listConversations.bind(controller)
);

router.get(
  '/unread-count',
  authenticate,
  controller.getUnreadCount.bind(controller)
);

router.get(
  '/:id',
  authenticate,
  controller.getConversation.bind(controller)
);

router.post(
  '/',
  authenticate,
  validateBody(createConversationSchema),
  controller.createConversation.bind(controller)
);

// Message queries
router.get(
  '/:id/messages',
  authenticate,
  controller.getMessages.bind(controller)
);

router.post(
  '/:id/messages',
  authenticate,
  validateBody(sendMessageSchema),
  controller.sendMessage.bind(controller)
);

// State transitions and management
router.patch(
  '/:id/read',
  authenticate,
  controller.markRead.bind(controller)
);

router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateStatusSchema),
  controller.updateStatus.bind(controller)
);

router.patch(
  '/:id/priority',
  authenticate,
  validateBody(updatePrioritySchema),
  controller.updatePriority.bind(controller)
);

router.patch(
  '/:id/assign',
  authenticate,
  validateBody(assignStaffSchema),
  controller.assignStaff.bind(controller)
);

// Reactions
router.post(
  '/messages/:id/reactions',
  authenticate,
  validateBody(addReactionSchema),
  controller.addReaction.bind(controller)
);

router.delete(
  '/messages/:id/reactions/:reactionId',
  authenticate,
  controller.removeReaction.bind(controller)
);

// Attachments
router.post(
  '/:id/attachments',
  authenticate,
  validateBody(createAttachmentSchema),
  controller.createAttachment.bind(controller)
);

export default router;
