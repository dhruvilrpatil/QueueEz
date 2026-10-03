import { MessagingRepository } from './repository';
import { MessagingPolicies, UserContext } from './policies';
import {
  Conversation,
  Message,
  CreateConversationInput,
  SendMessageInput,
  ConversationStatus,
  ConversationPriority,
  CreateAttachmentInput,
} from './types';
import { supabaseAdmin } from '../../lib/supabase';
import { BadRequestError } from '../../middleware/errorHandler';

export class MessagingService {
  private repo: MessagingRepository;

  constructor(repo?: MessagingRepository) {
    this.repo = repo || new MessagingRepository();
  }

  /**
   * List conversations for the authenticated user based on role and facility scope.
   */
  async listConversations(
    user: UserContext,
    params: {
      status?: ConversationStatus;
      category?: string;
      priority?: ConversationPriority;
      search?: string;
      assigned_to_me?: boolean;
      unread_only?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    return this.repo.listConversations({
      userId: user.id,
      role: user.role,
      facilityId: user.facilityId,
      ...params,
    });
  }

  /**
   * Get single conversation with full context and verify view authorization.
   */
  async getConversation(user: UserContext, conversationId: string): Promise<Conversation> {
    const conversation = await this.repo.findById(conversationId);
    MessagingPolicies.assertCanViewConversation(user, conversation);
    return conversation;
  }

  /**
   * Create a new customer query with associated contextual references (appointment, queue ticket, facility).
   */
  async createCustomerQuery(user: UserContext, input: CreateConversationInput) {
    if (user.role !== 'customer') {
      // While customers normally initiate queries, staff/admins can open tickets if needed
    }

    // Sanitize input content
    const sanitizedSubject = input.subject.trim();
    const sanitizedMessage = input.message.trim();

    if (!sanitizedMessage) {
      throw new BadRequestError('Query message cannot be empty');
    }

    // Fetch user profile name
    let profile = {
      full_name: 'Customer',
      email: user.email,
      phone: undefined as string | undefined,
    };

    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();
      if (data) {
        profile = {
          full_name: data.full_name || 'Customer',
          email: data.email || user.email,
          phone: data.phone,
        };
      }
    } catch {
      // In demo/mock fallback
      if (user.id === '00000000-0000-0000-0000-000000000001') {
        profile = {
          full_name: 'Rahul Patel',
          email: 'customer@demo.com',
          phone: '+1 (555) 234-5678',
        };
      }
    }

    const result = await this.repo.createConversation(
      {
        ...input,
        subject: sanitizedSubject,
        message: sanitizedMessage,
      },
      user.id,
      profile
    );

    // Create system notification for facility staff
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: user.facilityId || input.facility_id,
        type: 'new_customer_query',
        title: `New Query: ${sanitizedSubject}`,
        message: `${profile.full_name} submitted a question regarding ${input.category}`,
        data: { conversation_id: result.conversation.id },
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch {
      // notification logging error ignored
    }

    return result;
  }

  /**
   * List messages in conversation, respecting internal note visibility rules.
   */
  async getMessages(user: UserContext, conversationId: string): Promise<Message[]> {
    const conversation = await this.repo.findById(conversationId);
    MessagingPolicies.assertCanViewConversation(user, conversation);
    return this.repo.listMessages(conversationId, user.role);
  }

  /**
   * Post a message to conversation.
   */
  async sendMessage(user: UserContext, conversationId: string, input: SendMessageInput) {
    const conversation = await this.repo.findById(conversationId);
    const messageType = input.message_type || (user.role === 'customer' ? 'customer_message' : 'staff_reply');

    MessagingPolicies.assertCanSendMessage(user, conversation, messageType);

    const sanitizedContent = input.content.trim();
    if (!sanitizedContent) {
      throw new BadRequestError('Message cannot be empty');
    }

    let senderName = user.role === 'customer' ? 'Customer' : 'Staff Member';
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data?.full_name) senderName = data.full_name;
    } catch {
      if (user.role === 'customer') senderName = 'Rahul Patel';
      if (user.role === 'staff') senderName = 'Dr. Sarah Chen';
      if (user.role === 'facility_admin') senderName = 'Facility Admin';
    }

    const message = await this.repo.createMessage(
      conversationId,
      {
        id: user.id,
        role: user.role as any,
        name: senderName,
      },
      {
        ...input,
        content: sanitizedContent,
        message_type: messageType,
      }
    );

    // Notify counterpart (customer if staff replied, staff if customer replied)
    if (messageType !== 'internal_note') {
      try {
        const recipientId = user.role === 'customer' ? conversation.assigned_staff_id : conversation.customer_id;
        if (recipientId) {
          await supabaseAdmin.from('notifications').insert({
            user_id: recipientId,
            type: 'message_reply',
            title: `Reply from ${senderName}`,
            message: sanitizedContent.slice(0, 100),
            data: { conversation_id: conversationId },
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } catch {
        // notification error ignored
      }
    }

    return message;
  }

  /**
   * Mark conversation read for the current user.
   */
  async markRead(user: UserContext, conversationId: string): Promise<void> {
    const conversation = await this.repo.findById(conversationId);
    MessagingPolicies.assertCanViewConversation(user, conversation);
    await this.repo.markConversationRead(conversationId, user.id, user.role);
  }

  /**
   * Change conversation status (with state machine validation).
   */
  async updateStatus(user: UserContext, conversationId: string, status: ConversationStatus): Promise<Conversation> {
    const conversation = await this.repo.findById(conversationId);
    MessagingPolicies.assertCanViewConversation(user, conversation);
    MessagingPolicies.assertCanTransitionStatus(user, conversation.status, status);

    return this.repo.updateStatus(conversationId, status);
  }

  /**
   * Change conversation priority.
   */
  async updatePriority(user: UserContext, conversationId: string, priority: ConversationPriority): Promise<Conversation> {
    const conversation = await this.repo.findById(conversationId);
    MessagingPolicies.assertCanViewConversation(user, conversation);
    MessagingPolicies.assertCanUpdatePriority(user, conversation);

    return this.repo.updatePriority(conversationId, priority);
  }

  /**
   * Assign staff member to conversation.
   */
  async assignStaff(user: UserContext, conversationId: string, staffId: string | null): Promise<Conversation> {
    const conversation = await this.repo.findById(conversationId);
    MessagingPolicies.assertCanViewConversation(user, conversation);
    MessagingPolicies.assertCanAssign(user, conversation);

    return this.repo.assignStaff(conversationId, staffId);
  }

  /**
   * Get unread conversation count for user.
   */
  async getUnreadCount(user: UserContext): Promise<number> {
    return this.repo.getUnreadCount(user.id, user.role, user.facilityId);
  }

  /**
   * Add message reaction.
   */
  async addReaction(user: UserContext, messageId: string, reaction: string) {
    return this.repo.addReaction(messageId, user.id, reaction);
  }

  /**
   * Remove message reaction.
   */
  async removeReaction(user: UserContext, reactionId: string) {
    return this.repo.removeReaction(reactionId, user.id);
  }

  /**
   * Record message attachment.
   */
  async createAttachment(user: UserContext, input: CreateAttachmentInput) {
    return this.repo.createAttachment(input);
  }
}
