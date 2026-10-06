import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../lib/supabase';
import {
  Conversation,
  Message,
  ConversationParticipant,
  MessageReaction,
  MessageAttachment,
  CreateConversationInput,
  SendMessageInput,
  ConversationStatus,
  ConversationPriority,
  CreateAttachmentInput,
} from './types';
import { NotFoundError } from '../../middleware/errorHandler';

// Seed in-memory store for development/demo resiliency
const DEMO_FACILITY_ID = '00000000-0000-0000-0000-000000000010';
const DEMO_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_STAFF_ID = '00000000-0000-0000-0000-000000000002';

const mockConversations: Conversation[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    customer_id: DEMO_CUSTOMER_ID,
    facility_id: DEMO_FACILITY_ID,
    assigned_staff_id: DEMO_STAFF_ID,
    appointment_id: 'a0000000-0000-0000-0000-000000000001',
    queue_ticket_id: 'q0000000-0000-0000-0000-000000000001',
    service_id: 's0000000-0000-0000-0000-000000000001',
    subject: 'Appointment timing & early check-in',
    category: 'appointment',
    status: 'open',
    priority: 'normal',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    last_message_at: new Date(Date.now() - 1800000).toISOString(),
    customer: {
      id: DEMO_CUSTOMER_ID,
      full_name: 'Rahul Patel',
      email: 'customer@demo.com',
      phone: '+1 (555) 234-5678',
    },
    facility: {
      id: DEMO_FACILITY_ID,
      name: 'Metro Health Downtown Center',
      address: '100 Medical Center Blvd',
      city: 'Metropolis',
    },
    assigned_staff: {
      id: DEMO_STAFF_ID,
      full_name: 'Dr. Sarah Chen',
      email: 'staff@demo.com',
    },
    appointment: {
      id: 'a0000000-0000-0000-0000-000000000001',
      booking_reference: 'EZQ-1042',
      date: new Date().toISOString().split('T')[0],
      start_time: '15:00',
      status: 'confirmed',
      service_name: 'General Consultation',
    },
    queue_ticket: {
      id: 'q0000000-0000-0000-0000-000000000001',
      ticket_number: 'A-104',
      status: 'waiting',
      position: 6,
      estimated_wait_minutes: 24,
      service_name: 'General Consultation',
    },
    unread_count: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    customer_id: '00000000-0000-0000-0000-000000000099',
    facility_id: DEMO_FACILITY_ID,
    assigned_staff_id: null,
    appointment_id: null,
    queue_ticket_id: null,
    service_id: null,
    subject: 'Required documents for registration',
    category: 'documents',
    status: 'waiting_for_customer',
    priority: 'low',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    last_message_at: new Date(Date.now() - 43200000).toISOString(),
    customer: {
      id: '00000000-0000-0000-0000-000000000099',
      full_name: 'Priya Shah',
      email: 'priya.s@example.com',
      phone: '+1 (555) 987-6543',
    },
    facility: {
      id: DEMO_FACILITY_ID,
      name: 'Metro Health Downtown Center',
      address: '100 Medical Center Blvd',
      city: 'Metropolis',
    },
    unread_count: 0,
  },
];

const mockMessages: Message[] = [
  {
    id: 'm0000000-0000-0000-0000-000000000001',
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    sender_id: DEMO_CUSTOMER_ID,
    sender_role: 'customer',
    sender_name: 'Rahul Patel',
    content: 'Can I arrive 15 minutes early for my 3:00 PM appointment?',
    message_type: 'customer_message',
    status: 'read',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'm0000000-0000-0000-0000-000000000002',
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    sender_id: DEMO_STAFF_ID,
    sender_role: 'staff',
    sender_name: 'Dr. Sarah Chen',
    content: 'Yes! Please arrive 10-15 minutes prior to check in at Counter 2.',
    message_type: 'staff_reply',
    status: 'read',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm0000000-0000-0000-0000-000000000003',
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    sender_id: DEMO_CUSTOMER_ID,
    sender_role: 'customer',
    sender_name: 'Rahul Patel',
    content: 'Thank you! Is there any parking validation available at reception?',
    message_type: 'customer_message',
    status: 'sent',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

const mockParticipants: ConversationParticipant[] = [
  {
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    user_id: DEMO_CUSTOMER_ID,
    role: 'customer',
    joined_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    last_read_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    user_id: DEMO_STAFF_ID,
    role: 'staff',
    joined_at: new Date(Date.now() - 3600000).toISOString(),
    last_read_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockReactions: MessageReaction[] = [];
const mockAttachments: MessageAttachment[] = [];

export class MessagingRepository {
  /**
   * List conversations with filtering, search, pagination, and unread computation.
   */
  async listConversations(params: {
    userId: string;
    role: string;
    facilityId?: string;
    status?: ConversationStatus;
    category?: string;
    priority?: ConversationPriority;
    search?: string;
    assigned_to_me?: boolean;
    unread_only?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: Conversation[]; total: number; unreadTotal: number }> {
    try {
      // Attempt database query first
      let query = supabaseAdmin
        .from('conversations')
        .select(`
          *,
          customer:profiles!customer_id(id, full_name, email, phone, avatar_url),
          facility:facilities(id, name, address, city),
          assigned_staff:profiles!assigned_staff_id(id, full_name, email),
          appointment:appointments(id, booking_reference, date, start_time, status),
          queue_ticket:queue_tickets(id, ticket_number, status, position, estimated_wait_minutes)
        `, { count: 'exact' });

      if (params.role === 'customer') {
        query = query.eq('customer_id', params.userId);
      } else if (params.role === 'staff' || params.role === 'facility_admin') {
        if (params.facilityId) {
          query = query.eq('facility_id', params.facilityId);
        }
        if (params.assigned_to_me) {
          query = query.eq('assigned_staff_id', params.userId);
        }
      }

      if (params.status) query = query.eq('status', params.status);
      if (params.category) query = query.eq('category', params.category);
      if (params.priority) query = query.eq('priority', params.priority);
      if (params.search) {
        query = query.or(`subject.ilike.%${params.search}%`);
      }

      query = query.order('last_message_at', { ascending: false });

      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (!error && data) {
        return {
          items: data as Conversation[],
          total: count || data.length,
          unreadTotal: 0,
        };
      }
    } catch {
      // Fallback to in-memory store
    }

    // In-memory fallback
    let list = [...mockConversations];

    if (params.role === 'customer') {
      list = list.filter((c) => c.customer_id === params.userId);
    } else if (params.role === 'staff' || params.role === 'facility_admin') {
      if (params.facilityId) {
        list = list.filter((c) => c.facility_id === params.facilityId);
      }
      if (params.assigned_to_me) {
        list = list.filter((c) => c.assigned_staff_id === params.userId);
      }
    }

    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }
    if (params.category) {
      list = list.filter((c) => c.category === params.category);
    }
    if (params.priority) {
      list = list.filter((c) => c.priority === params.priority);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.customer?.full_name.toLowerCase().includes(q) ||
          c.appointment?.booking_reference.toLowerCase().includes(q) ||
          c.queue_ticket?.ticket_number.toLowerCase().includes(q)
      );
    }

    // Calculate unread counts dynamically
    list = list.map((c) => {
      const p = mockParticipants.find(
        (part) => part.conversation_id === c.id && part.user_id === params.userId
      );
      const lastRead = p ? new Date(p.last_read_at).getTime() : 0;
      const unreadCount = mockMessages.filter(
        (m) =>
          m.conversation_id === c.id &&
          m.sender_id !== params.userId &&
          new Date(m.created_at).getTime() > lastRead &&
          (params.role !== 'customer' || m.message_type !== 'internal_note')
      ).length;

      const convMessages = mockMessages.filter((m) => m.conversation_id === c.id);
      const lastMessage = convMessages[convMessages.length - 1];

      return {
        ...c,
        unread_count: unreadCount,
        last_message: lastMessage,
      };
    });

    if (params.unread_only) {
      list = list.filter((c) => (c.unread_count || 0) > 0);
    }

    // Sort by last message desc
    list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    const totalUnread = list.reduce((acc, c) => acc + (c.unread_count || 0), 0);

    return {
      items: list,
      total: list.length,
      unreadTotal: totalUnread,
    };
  }

  /**
   * Find conversation by ID.
   */
  async findById(id: string): Promise<Conversation> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          customer:profiles!customer_id(id, full_name, email, phone, avatar_url),
          facility:facilities(id, name, address, city),
          assigned_staff:profiles!assigned_staff_id(id, full_name, email),
          appointment:appointments(id, booking_reference, date, start_time, status),
          queue_ticket:queue_tickets(id, ticket_number, status, position, estimated_wait_minutes)
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Conversation;
      }
    } catch {
      // Fallback
    }

    const found = mockConversations.find((c) => c.id === id);
    if (!found) {
      throw new NotFoundError('Conversation');
    }
    return found;
  }

  /**
   * Create a new conversation with initial customer message and participants.
   */
  async createConversation(
    input: CreateConversationInput,
    customerId: string,
    customerProfile: { full_name: string; email: string; phone?: string }
  ): Promise<{ conversation: Conversation; message: Message }> {
    const conversationId = uuidv4();
    const messageId = uuidv4();
    const now = new Date().toISOString();

    const newConversation: Conversation = {
      id: conversationId,
      customer_id: customerId,
      facility_id: input.facility_id,
      assigned_staff_id: null,
      appointment_id: input.appointment_id || null,
      queue_ticket_id: input.queue_ticket_id || null,
      service_id: input.service_id || null,
      subject: input.subject,
      category: input.category,
      status: 'open',
      priority: input.priority || 'normal',
      created_at: now,
      updated_at: now,
      last_message_at: now,
      customer: {
        id: customerId,
        full_name: customerProfile.full_name,
        email: customerProfile.email,
        phone: customerProfile.phone,
      },
      unread_count: 0,
    };

    const newMessage: Message = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: customerId,
      sender_role: 'customer',
      sender_name: customerProfile.full_name,
      content: input.message,
      message_type: 'customer_message',
      status: 'sent',
      created_at: now,
      updated_at: now,
    };

    try {
      await supabaseAdmin.from('conversations').insert({
        id: newConversation.id,
        customer_id: newConversation.customer_id,
        facility_id: newConversation.facility_id,
        appointment_id: newConversation.appointment_id,
        queue_ticket_id: newConversation.queue_ticket_id,
        service_id: newConversation.service_id,
        subject: newConversation.subject,
        category: newConversation.category,
        status: newConversation.status,
        priority: newConversation.priority,
        created_at: now,
        updated_at: now,
        last_message_at: now,
      });

      await supabaseAdmin.from('messages').insert({
        id: newMessage.id,
        conversation_id: newMessage.conversation_id,
        sender_id: newMessage.sender_id,
        sender_role: newMessage.sender_role,
        content: newMessage.content,
        message_type: newMessage.message_type,
        status: newMessage.status,
        created_at: now,
        updated_at: now,
      });

      await supabaseAdmin.from('conversation_participants').insert([
        {
          conversation_id: conversationId,
          user_id: customerId,
          role: 'customer',
          joined_at: now,
          last_read_at: now,
        },
      ]);
    } catch {
      // In-memory fallback
    }

    mockConversations.unshift(newConversation);
    mockMessages.push(newMessage);
    mockParticipants.push({
      conversation_id: conversationId,
      user_id: customerId,
      role: 'customer',
      joined_at: now,
      last_read_at: now,
    });

    return { conversation: newConversation, message: newMessage };
  }

  /**
   * List messages in a conversation, filtering out internal notes for customers.
   */
  async listMessages(conversationId: string, userRole: string): Promise<Message[]> {
    try {
      let query = supabaseAdmin
        .from('messages')
        .select(`
          *,
          reactions:message_reactions(*),
          attachments:message_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (userRole === 'customer') {
        query = query.neq('message_type', 'internal_note');
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as Message[];
      }
    } catch {
      // Fallback
    }

    let messages = mockMessages.filter((m) => m.conversation_id === conversationId);
    if (userRole === 'customer') {
      messages = messages.filter((m) => m.message_type !== 'internal_note');
    }

    // Attach mock reactions
    return messages.map((m) => ({
      ...m,
      reactions: mockReactions.filter((r) => r.message_id === m.id),
      attachments: mockAttachments.filter((a) => a.message_id === m.id),
    }));
  }

  /**
   * Create message in conversation.
   */
  async createMessage(
    conversationId: string,
    sender: { id: string; role: 'customer' | 'staff' | 'facility_admin' | 'system_admin'; name: string },
    input: SendMessageInput
  ): Promise<Message> {
    const messageId = uuidv4();
    const now = new Date().toISOString();

    const newMessage: Message = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: sender.id,
      sender_role: sender.role,
      sender_name: sender.name,
      content: input.content,
      message_type: input.message_type || (sender.role === 'customer' ? 'customer_message' : 'staff_reply'),
      status: 'sent',
      reply_to_message_id: input.reply_to_message_id || null,
      created_at: now,
      updated_at: now,
    };

    try {
      await supabaseAdmin.from('messages').insert({
        id: newMessage.id,
        conversation_id: newMessage.conversation_id,
        sender_id: newMessage.sender_id,
        sender_role: newMessage.sender_role,
        content: newMessage.content,
        message_type: newMessage.message_type,
        status: newMessage.status,
        reply_to_message_id: newMessage.reply_to_message_id,
        created_at: now,
        updated_at: now,
      });

      // Update last_message_at on conversation
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message_at: now,
          updated_at: now,
          ...(sender.role === 'staff' || sender.role === 'facility_admin'
            ? { status: 'waiting_for_customer' }
            : { status: 'in_progress' }),
        })
        .eq('id', conversationId);
    } catch {
      // In-memory fallback
    }

    mockMessages.push(newMessage);

    // Update in-memory conversation
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.last_message_at = now;
      conv.updated_at = now;
      if (sender.role === 'staff' || sender.role === 'facility_admin') {
        if (newMessage.message_type !== 'internal_note') {
          conv.status = 'waiting_for_customer';
        }
      } else if (sender.role === 'customer') {
        conv.status = 'in_progress';
      }
    }

    return newMessage;
  }

  /**
   * Mark conversation read for a participant.
   */
  async markConversationRead(conversationId: string, userId: string, userRole: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('conversation_participants')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: userId,
            role: userRole,
            last_read_at: now,
          },
          { onConflict: 'conversation_id,user_id' }
        );

      await supabaseAdmin
        .from('messages')
        .update({ status: 'read', read_at: now })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('status', 'sent');
    } catch {
      // In-memory fallback
    }

    const participant = mockParticipants.find(
      (p) => p.conversation_id === conversationId && p.user_id === userId
    );
    if (participant) {
      participant.last_read_at = now;
    } else {
      mockParticipants.push({
        conversation_id: conversationId,
        user_id: userId,
        role: userRole as any,
        joined_at: now,
        last_read_at: now,
      });
    }

    mockMessages
      .filter((m) => m.conversation_id === conversationId && m.sender_id !== userId)
      .forEach((m) => {
        m.status = 'read';
        m.read_at = now;
      });
  }

  /**
   * Update status.
   */
  async updateStatus(id: string, status: ConversationStatus): Promise<Conversation> {
    const now = new Date().toISOString();
    const closed_at = status === 'closed' || status === 'resolved' ? now : null;

    try {
      await supabaseAdmin
        .from('conversations')
        .update({ status, updated_at: now, closed_at })
        .eq('id', id);
    } catch {
      // In-memory
    }

    const conv = mockConversations.find((c) => c.id === id);
    if (!conv) throw new NotFoundError('Conversation');
    conv.status = status;
    conv.updated_at = now;
    conv.closed_at = closed_at;
    return conv;
  }

  /**
   * Update priority.
   */
  async updatePriority(id: string, priority: ConversationPriority): Promise<Conversation> {
    const now = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('conversations')
        .update({ priority, updated_at: now })
        .eq('id', id);
    } catch {
      // In-memory
    }

    const conv = mockConversations.find((c) => c.id === id);
    if (!conv) throw new NotFoundError('Conversation');
    conv.priority = priority;
    conv.updated_at = now;
    return conv;
  }

  /**
   * Assign staff.
   */
  async assignStaff(id: string, staffId: string | null): Promise<Conversation> {
    const now = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('conversations')
        .update({ assigned_staff_id: staffId, updated_at: now })
        .eq('id', id);
    } catch {
      // In-memory
    }

    const conv = mockConversations.find((c) => c.id === id);
    if (!conv) throw new NotFoundError('Conversation');
    conv.assigned_staff_id = staffId;
    conv.updated_at = now;
    if (staffId === DEMO_STAFF_ID) {
      conv.assigned_staff = {
        id: DEMO_STAFF_ID,
        full_name: 'Dr. Sarah Chen',
        email: 'staff@demo.com',
      };
    } else if (!staffId) {
      conv.assigned_staff = undefined;
    }
    return conv;
  }

  /**
   * Get unread count for user across all authorized conversations.
   */
  async getUnreadCount(userId: string, role: string, facilityId?: string): Promise<number> {
    const { unreadTotal } = await this.listConversations({
      userId,
      role,
      facilityId,
    });
    return unreadTotal;
  }

  /**
   * Add reaction.
   */
  async addReaction(messageId: string, userId: string, reaction: string): Promise<MessageReaction> {
    const newReaction: MessageReaction = {
      id: uuidv4(),
      message_id: messageId,
      user_id: userId,
      reaction,
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from('message_reactions').insert(newReaction);
    } catch {
      // In-memory
    }

    mockReactions.push(newReaction);
    return newReaction;
  }

  /**
   * Remove reaction.
   */
  async removeReaction(reactionId: string, userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('message_reactions')
        .delete()
        .eq('id', reactionId)
        .eq('user_id', userId);
    } catch {
      // In-memory
    }

    const index = mockReactions.findIndex((r) => r.id === reactionId && r.user_id === userId);
    if (index >= 0) {
      mockReactions.splice(index, 1);
    }
  }

  /**
   * Create attachment metadata.
   */
  async createAttachment(input: CreateAttachmentInput): Promise<MessageAttachment> {
    const attachment: MessageAttachment = {
      id: uuidv4(),
      ...input,
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from('message_attachments').insert(attachment);
    } catch {
      // In-memory
    }

    mockAttachments.push(attachment);
    return attachment;
  }
}
