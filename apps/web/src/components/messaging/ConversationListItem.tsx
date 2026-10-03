import React from 'react';
import { User, Calendar, Ticket } from 'lucide-react';
import { Conversation } from '../../features/messaging/types';
import { ConversationStatusBadge } from './ConversationStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { UnreadBadge } from './UnreadBadge';

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
  showCustomerName?: boolean;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  showCustomerName = true,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const hasUnread = (conversation.unread_count || 0) > 0;

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`w-full text-left p-3.5 border-b border-[#E5E7EB] transition-all flex flex-col gap-1.5 ${
        isSelected
          ? 'bg-[#F8F9FA] border-l-4 border-l-[#111111]'
          : 'hover:bg-[#F9FAFB] border-l-4 border-l-transparent bg-white'
      }`}
    >
      {/* Top row: Name/Facility + Time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-[#E5E7EB] text-[#111111] flex items-center justify-center text-[10px] font-bold shrink-0">
            {conversation.customer?.full_name ? (
              conversation.customer.full_name.charAt(0).toUpperCase()
            ) : (
              <User className="w-3 h-3" />
            )}
          </div>
          <span
            className={`text-xs truncate ${
              hasUnread ? 'font-bold text-[#111111]' : 'font-semibold text-[#374151]'
            }`}
          >
            {showCustomerName
              ? conversation.customer?.full_name || 'Customer'
              : conversation.facility?.name || 'Facility Query'}
          </span>
        </div>

        <span className="text-[11px] text-[#9CA3AF] tabular-nums shrink-0">
          {formatTime(conversation.last_message_at || conversation.created_at)}
        </span>
      </div>

      {/* Subject */}
      <div className="flex items-center justify-between gap-2">
        <h4
          className={`text-sm truncate ${
            hasUnread ? 'font-semibold text-[#111111]' : 'font-medium text-[#4B5563]'
          }`}
        >
          {conversation.subject}
        </h4>
        {hasUnread && <UnreadBadge count={conversation.unread_count || 0} variant="primary" />}
      </div>

      {/* Last message preview */}
      <p className="text-xs text-[#6B7280] truncate leading-relaxed">
        {conversation.last_message?.content || 'No messages yet'}
      </p>

      {/* Context pill & Status / Priority */}
      <div className="flex items-center justify-between gap-1.5 pt-1 mt-0.5">
        <div className="flex items-center gap-1 overflow-hidden">
          {conversation.appointment && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate">
              <Calendar className="w-2.5 h-2.5 shrink-0" />
              <span>{conversation.appointment.booking_reference}</span>
            </span>
          )}

          {conversation.queue_ticket && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 truncate">
              <Ticket className="w-2.5 h-2.5 shrink-0" />
              <span>{conversation.queue_ticket.ticket_number}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {conversation.priority === 'urgent' || conversation.priority === 'high' ? (
            <PriorityBadge priority={conversation.priority} />
          ) : null}
          <ConversationStatusBadge status={conversation.status} showDot={false} />
        </div>
      </div>
    </button>
  );
};
