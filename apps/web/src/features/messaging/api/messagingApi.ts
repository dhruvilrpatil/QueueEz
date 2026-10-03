import { apiClient } from '../../../lib/api-client';
import {
  Conversation,
  Message,
  CreateConversationPayload,
  SendMessagePayload,
  ConversationStatus,
  ConversationPriority,
  ConversationFilters,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    unread_total: number;
  };
}

// Resilient local state for demo & offline mode
const LOCAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    customer_id: '00000000-0000-0000-0000-000000000001',
    facility_id: '00000000-0000-0000-0000-000000000010',
    assigned_staff_id: '00000000-0000-0000-0000-000000000002',
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
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Rahul Patel',
      email: 'customer@demo.com',
      phone: '+1 (555) 234-5678',
    },
    facility: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Metro Health Downtown Center',
      address: '100 Medical Center Blvd',
      city: 'Metropolis',
    },
    assigned_staff: {
      id: '00000000-0000-0000-0000-000000000002',
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
    last_message: {
      id: 'm0000000-0000-0000-0000-000000000003',
      conversation_id: 'c0000000-0000-0000-0000-000000000001',
      sender_id: '00000000-0000-0000-0000-000000000001',
      sender_role: 'customer',
      sender_name: 'Rahul Patel',
      content: 'Thank you! Is there any parking validation available at reception?',
      message_type: 'customer_message',
      status: 'sent',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    customer_id: '00000000-0000-0000-0000-000000000099',
    facility_id: '00000000-0000-0000-0000-000000000010',
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
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Metro Health Downtown Center',
      address: '100 Medical Center Blvd',
      city: 'Metropolis',
    },
    unread_count: 0,
    last_message: {
      id: 'm0000000-0000-0000-0000-000000000010',
      conversation_id: 'c0000000-0000-0000-0000-000000000002',
      sender_id: '00000000-0000-0000-0000-000000000002',
      sender_role: 'staff',
      sender_name: 'Dr. Sarah Chen',
      content: 'Please bring your photo ID and insurance policy card.',
      message_type: 'staff_reply',
      status: 'read',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
  },
];

const LOCAL_MESSAGES: Message[] = [
  {
    id: 'm0000000-0000-0000-0000-000000000001',
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000001',
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
    sender_id: '00000000-0000-0000-0000-000000000002',
    sender_role: 'staff',
    sender_name: 'Dr. Sarah Chen',
    content: 'Yes! Please arrive 10-15 minutes prior to check in at Counter 2 and reception.',
    message_type: 'staff_reply',
    status: 'read',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm0000000-0000-0000-0000-000000000003',
    conversation_id: 'c0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000001',
    sender_role: 'customer',
    sender_name: 'Rahul Patel',
    content: 'Thank you! Is there any parking validation available at reception?',
    message_type: 'customer_message',
    status: 'sent',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const messagingApi = {
  /**
   * Fetch conversations with optional filters
   */
  async getConversations(filters?: ConversationFilters): Promise<{ conversations: Conversation[]; unreadTotal: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.assigned_to_me) params.append('assigned_to_me', 'true');
      if (filters?.unread_only) params.append('unread_only', 'true');

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<ApiResponse<Conversation[]>>(`/conversations${queryString}`);
      if (res && res.data && res.data.length > 0) {
        return {
          conversations: res.data,
          unreadTotal: res.meta?.unread_total || 0,
        };
      }
    } catch {
      // Fallback to local high-fidelity state
    }

    let list = [...LOCAL_CONVERSATIONS];
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((c) => c.category === filters.category);
    }
    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter((c) => c.priority === filters.priority);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.customer?.full_name?.toLowerCase().includes(q) ||
          c.appointment?.booking_reference.toLowerCase().includes(q)
      );
    }
    if (filters?.unread_only) {
      list = list.filter((c) => (c.unread_count || 0) > 0);
    }

    const unreadSum = list.reduce((acc, c) => acc + (c.unread_count || 0), 0);
    return {
      conversations: list,
      unreadTotal: unreadSum,
    };
  },

  /**
   * Get single conversation details
   */
  async getConversation(id: string): Promise<Conversation> {
    try {
      const res = await apiClient.get<ApiResponse<Conversation>>(`/conversations/${id}`);
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    const found = LOCAL_CONVERSATIONS.find((c) => c.id === id);
    if (found) return found;
    return LOCAL_CONVERSATIONS[0];
  },

  /**
   * Create new customer query
   */
  async createConversation(payload: CreateConversationPayload): Promise<{ conversation: Conversation; message: Message }> {
    try {
      const res = await apiClient.post<ApiResponse<{ conversation: Conversation; message: Message }>>('/conversations', payload);
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    const newId = `c0000000-0000-0000-${Date.now().toString().slice(-4)}-000000000001`;
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: newId,
      customer_id: '00000000-0000-0000-0000-000000000001',
      facility_id: payload.facility_id,
      assigned_staff_id: null,
      appointment_id: payload.appointment_id || null,
      queue_ticket_id: payload.queue_ticket_id || null,
      service_id: payload.service_id || null,
      subject: payload.subject,
      category: payload.category,
      status: 'open',
      priority: payload.priority || 'normal',
      created_at: now,
      updated_at: now,
      last_message_at: now,
      customer: {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Rahul Patel',
        email: 'customer@demo.com',
        phone: '+1 (555) 234-5678',
      },
      facility: {
        id: payload.facility_id,
        name: 'Metro Health Downtown Center',
      },
      unread_count: 0,
    };

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversation_id: newId,
      sender_id: '00000000-0000-0000-0000-000000000001',
      sender_role: 'customer',
      sender_name: 'Rahul Patel',
      content: payload.message,
      message_type: 'customer_message',
      status: 'sent',
      created_at: now,
      updated_at: now,
    };

    LOCAL_CONVERSATIONS.unshift(newConv);
    LOCAL_MESSAGES.push(newMsg);

    return { conversation: newConv, message: newMsg };
  },

  /**
   * Fetch messages for conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const res = await apiClient.get<ApiResponse<Message[]>>(`/conversations/${conversationId}/messages`);
      if (res && res.data && res.data.length > 0) return res.data;
    } catch {
      // Fallback
    }

    return LOCAL_MESSAGES.filter((m) => m.conversation_id === conversationId);
  },

  /**
   * Send a message or staff reply
   */
  async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message> {
    try {
      const res = await apiClient.post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, payload);
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    const now = new Date().toISOString();
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: payload.message_type === 'staff_reply' || payload.message_type === 'internal_note'
        ? '00000000-0000-0000-0000-000000000002'
        : '00000000-0000-0000-0000-000000000001',
      sender_role: payload.message_type === 'internal_note' ? 'staff' : (payload.message_type === 'staff_reply' ? 'staff' : 'customer'),
      sender_name: payload.message_type === 'staff_reply' || payload.message_type === 'internal_note' ? 'Dr. Sarah Chen' : 'Rahul Patel',
      content: payload.content,
      message_type: payload.message_type || 'customer_message',
      status: 'sent',
      reply_to_message_id: payload.reply_to_message_id,
      created_at: now,
      updated_at: now,
    };

    LOCAL_MESSAGES.push(newMsg);

    const conv = LOCAL_CONVERSATIONS.find((c) => c.id === conversationId);
    if (conv) {
      conv.last_message_at = now;
      conv.last_message = newMsg;
      if (payload.message_type === 'staff_reply') {
        conv.status = 'waiting_for_customer';
      }
    }

    return newMsg;
  },

  /**
   * Mark conversation as read
   */
  async markRead(conversationId: string): Promise<void> {
    try {
      await apiClient.patch<ApiResponse<{ message: string }>>(`/conversations/${conversationId}/read`);
    } catch {
      // Fallback
    }

    const conv = LOCAL_CONVERSATIONS.find((c) => c.id === conversationId);
    if (conv) {
      conv.unread_count = 0;
    }
  },

  /**
   * Update conversation status
   */
  async updateStatus(conversationId: string, status: ConversationStatus): Promise<Conversation> {
    try {
      const res = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${conversationId}/status`, { status });
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    const conv = LOCAL_CONVERSATIONS.find((c) => c.id === conversationId);
    if (conv) {
      conv.status = status;
      conv.updated_at = new Date().toISOString();
      return conv;
    }
    throw new Error('Conversation not found');
  },

  /**
   * Update conversation priority
   */
  async updatePriority(conversationId: string, priority: ConversationPriority): Promise<Conversation> {
    try {
      const res = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${conversationId}/priority`, { priority });
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    const conv = LOCAL_CONVERSATIONS.find((c) => c.id === conversationId);
    if (conv) {
      conv.priority = priority;
      conv.updated_at = new Date().toISOString();
      return conv;
    }
    throw new Error('Conversation not found');
  },

  /**
   * Assign staff member
   */
  async assignStaff(conversationId: string, assignedStaffId: string | null): Promise<Conversation> {
    try {
      const res = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${conversationId}/assign`, {
        assigned_staff_id: assignedStaffId,
      });
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    const conv = LOCAL_CONVERSATIONS.find((c) => c.id === conversationId);
    if (conv) {
      conv.assigned_staff_id = assignedStaffId;
      if (assignedStaffId) {
        conv.assigned_staff = {
          id: assignedStaffId,
          full_name: 'Dr. Sarah Chen',
          email: 'staff@demo.com',
        };
      } else {
        conv.assigned_staff = undefined;
      }
      return conv;
    }
    throw new Error('Conversation not found');
  },

  /**
   * Get total unread count for current user
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<ApiResponse<{ unread_count: number }>>('/conversations/unread-count');
      if (res && res.data && typeof res.data.unread_count === 'number') {
        return res.data.unread_count;
      }
    } catch {
      // Fallback
    }

    return LOCAL_CONVERSATIONS.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  },

  /**
   * Add message reaction
   */
  async addReaction(messageId: string, reaction: string) {
    try {
      const res = await apiClient.post<ApiResponse<any>>(`/conversations/messages/${messageId}/reactions`, { reaction });
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }
    return { id: `r-${Date.now()}`, message_id: messageId, reaction };
  },

  /**
   * Remove message reaction
   */
  async removeReaction(messageId: string, reactionId: string) {
    try {
      await apiClient.delete<ApiResponse<any>>(`/conversations/messages/${messageId}/reactions/${reactionId}`);
    } catch {
      // Fallback
    }
  },
};
