import { Conversation, ConversationStatus, MessageType } from './types';
import { ForbiddenError, BadRequestError } from '../../middleware/errorHandler';

export interface UserContext {
  id: string;
  email: string;
  role: string;
  facilityId?: string;
}

export class MessagingPolicies {
  /**
   * Validates if a user can view a given conversation.
   */
  static assertCanViewConversation(user: UserContext, conversation: Conversation): void {
    if (user.role === 'system_admin') {
      return;
    }

    if (user.role === 'customer') {
      if (conversation.customer_id !== user.id) {
        throw new ForbiddenError('You can only view your own conversations');
      }
      return;
    }

    if (user.role === 'facility_admin' || user.role === 'staff') {
      if (user.facilityId && conversation.facility_id !== user.facilityId) {
        throw new ForbiddenError('You can only view conversations for your facility');
      }
      return;
    }

    throw new ForbiddenError('Unauthorized to view this conversation');
  }

  /**
   * Validates if a user can send a message to this conversation.
   */
  static assertCanSendMessage(user: UserContext, conversation: Conversation, messageType: MessageType): void {
    if (conversation.status === 'closed') {
      throw new BadRequestError('Cannot send messages to a closed conversation. Reopen it first.');
    }

    if (user.role === 'customer') {
      if (conversation.customer_id !== user.id) {
        throw new ForbiddenError('You can only post to your own conversations');
      }
      if (messageType === 'internal_note') {
        throw new ForbiddenError('Customers cannot create internal notes');
      }
      return;
    }

    if (user.role === 'facility_admin' || user.role === 'staff' || user.role === 'system_admin') {
      if (user.facilityId && user.role !== 'system_admin' && conversation.facility_id !== user.facilityId) {
        throw new ForbiddenError('You can only post to conversations within your authorized facility');
      }
      return;
    }

    throw new ForbiddenError('Unauthorized to post messages to this conversation');
  }

  /**
   * Validates whether a requested status transition is allowed.
   */
  static assertCanTransitionStatus(
    user: UserContext,
    currentStatus: ConversationStatus,
    newStatus: ConversationStatus
  ): void {
    if (currentStatus === newStatus) {
      return;
    }

    // Customers can only request close or reopen their own conversations
    if (user.role === 'customer') {
      if (newStatus === 'closed' && (currentStatus === 'resolved' || currentStatus === 'open')) {
        return;
      }
      if (newStatus === 'reopened' && currentStatus === 'resolved') {
        return;
      }
      throw new ForbiddenError(`Customers cannot change conversation status from ${currentStatus} to ${newStatus}`);
    }

    // Staff and Admin state machine rules
    const allowedTransitions: Record<ConversationStatus, ConversationStatus[]> = {
      open: ['in_progress', 'waiting_for_customer', 'resolved', 'closed'],
      in_progress: ['waiting_for_customer', 'resolved', 'closed', 'open'],
      waiting_for_customer: ['in_progress', 'resolved', 'closed'],
      resolved: ['reopened', 'closed', 'in_progress'],
      closed: ['reopened'],
      reopened: ['in_progress', 'waiting_for_customer', 'resolved', 'closed'],
    };

    const validNextStates = allowedTransitions[currentStatus] || [];
    if (!validNextStates.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Valid targets: ${validNextStates.join(', ')}`
      );
    }
  }

  /**
   * Validates staff assignment permissions.
   */
  static assertCanAssign(user: UserContext, conversation: Conversation): void {
    if (user.role === 'customer') {
      throw new ForbiddenError('Customers cannot assign conversations');
    }

    if (user.facilityId && user.role !== 'system_admin' && conversation.facility_id !== user.facilityId) {
      throw new ForbiddenError('You can only assign conversations within your facility');
    }
  }

  /**
   * Validates priority modification permissions.
   */
  static assertCanUpdatePriority(user: UserContext, conversation: Conversation): void {
    if (user.role === 'customer') {
      throw new ForbiddenError('Customers cannot alter conversation priority');
    }

    if (user.facilityId && user.role !== 'system_admin' && conversation.facility_id !== user.facilityId) {
      throw new ForbiddenError('You can only update priority for conversations within your facility');
    }
  }

  /**
   * Filters messages based on viewer role (e.g. masking internal notes from customers).
   */
  static canViewMessageType(userRole: string, messageType: MessageType): boolean {
    if (messageType === 'internal_note') {
      return userRole === 'staff' || userRole === 'facility_admin' || userRole === 'system_admin';
    }
    return true;
  }
}
