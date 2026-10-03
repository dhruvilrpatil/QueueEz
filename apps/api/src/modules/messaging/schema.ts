import { z } from 'zod';

export const conversationCategoryEnum = z.enum([
  'appointment',
  'queue',
  'service',
  'facility',
  'documents',
  'technical_issue',
  'payment_fees',
  'general_query',
]);

export const conversationStatusEnum = z.enum([
  'open',
  'in_progress',
  'waiting_for_customer',
  'resolved',
  'closed',
  'reopened',
]);

export const conversationPriorityEnum = z.enum([
  'low',
  'normal',
  'high',
  'urgent',
]);

export const messageTypeEnum = z.enum([
  'customer_message',
  'staff_reply',
  'system_event',
  'internal_note',
]);

export const createConversationSchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID format'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(200, 'Subject cannot exceed 200 characters'),
  category: conversationCategoryEnum,
  message: z.string().trim().min(1, 'Initial message cannot be empty').max(10000, 'Message cannot exceed 10,000 characters'),
  appointment_id: z.string().uuid('Invalid appointment ID format').optional().nullable(),
  queue_ticket_id: z.string().uuid('Invalid queue ticket ID format').optional().nullable(),
  service_id: z.string().uuid('Invalid service ID format').optional().nullable(),
  priority: conversationPriorityEnum.optional().default('normal'),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message content cannot be empty').max(10000, 'Message cannot exceed 10,000 characters'),
  message_type: messageTypeEnum.optional().default('customer_message'),
  reply_to_message_id: z.string().uuid('Invalid reply message ID format').optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: conversationStatusEnum,
});

export const updatePrioritySchema = z.object({
  priority: conversationPriorityEnum,
});

export const assignStaffSchema = z.object({
  assigned_staff_id: z.string().uuid('Invalid staff ID format').nullable(),
});

export const addReactionSchema = z.object({
  reaction: z.string().trim().min(1).max(32, 'Reaction emoji/code too long'),
});

export const createAttachmentSchema = z.object({
  message_id: z.string().uuid('Invalid message ID format'),
  file_name: z.string().trim().min(1).max(255),
  file_path: z.string().trim().min(1),
  mime_type: z.string().trim().min(1).max(100),
  file_size: z.number().int().positive().max(25 * 1024 * 1024, 'File size cannot exceed 25MB'),
});

export const queryConversationsSchema = z.object({
  status: conversationStatusEnum.optional(),
  category: conversationCategoryEnum.optional(),
  priority: conversationPriorityEnum.optional(),
  facility_id: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  assigned_to_me: z.enum(['true', 'false']).optional(),
  unread_only: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});
