export type ConversationCategory =
  | 'appointment'
  | 'queue'
  | 'service'
  | 'facility'
  | 'documents'
  | 'technical_issue'
  | 'payment_fees'
  | 'general_query';

export type ConversationStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_for_customer'
  | 'resolved'
  | 'closed'
  | 'reopened';

export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type MessageType =
  | 'customer_message'
  | 'staff_reply'
  | 'system_event'
  | 'internal_note';

export type MessageStatus = 'sent' | 'read' | 'failed';

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  role: 'customer' | 'staff' | 'facility_admin' | 'system_admin';
  joined_at: string;
  last_read_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'staff' | 'facility_admin' | 'system_admin' | 'system';
  sender_name?: string;
  content: string;
  message_type: MessageType;
  status: MessageStatus;
  reply_to_message_id?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  customer_id: string;
  facility_id: string;
  assigned_staff_id?: string | null;
  appointment_id?: string | null;
  queue_ticket_id?: string | null;
  service_id?: string | null;
  subject: string;
  category: ConversationCategory;
  status: ConversationStatus;
  priority: ConversationPriority;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  closed_at?: string | null;
  // Joined context
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  facility?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
  };
  assigned_staff?: {
    id: string;
    full_name: string;
    email: string;
  };
  appointment?: {
    id: string;
    booking_reference: string;
    date: string;
    start_time: string;
    status: string;
    service_name?: string;
  };
  queue_ticket?: {
    id: string;
    ticket_number: string;
    status: string;
    position: number;
    estimated_wait_minutes?: number;
    service_name?: string;
  };
  service?: {
    id: string;
    name: string;
  };
  unread_count?: number;
  last_message?: Message;
}

export interface CreateConversationInput {
  facility_id: string;
  subject: string;
  category: ConversationCategory;
  message: string;
  appointment_id?: string;
  queue_ticket_id?: string;
  service_id?: string;
  priority?: ConversationPriority;
}

export interface SendMessageInput {
  content: string;
  message_type?: MessageType;
  reply_to_message_id?: string;
}

export interface UpdateStatusInput {
  status: ConversationStatus;
}

export interface UpdatePriorityInput {
  priority: ConversationPriority;
}

export interface AssignStaffInput {
  assigned_staff_id: string | null;
}

export interface AddReactionInput {
  reaction: string;
}

export interface CreateAttachmentInput {
  message_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}
