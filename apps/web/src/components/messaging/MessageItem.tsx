import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { Message } from '../../features/messaging/types';
import { MessageStatus } from './MessageStatus';
import { MessageActions } from './MessageActions';
import { MessageReaction } from './MessageReaction';
import { MessageAttachment } from './MessageAttachment';
import { MessageReplyPreview } from './MessageReplyPreview';

interface MessageItemProps {
  message: Message;
  replyToMessage?: Message | null;
  isCurrentUser: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  replyToMessage,
  isCurrentUser,
  onReply,
  onReact,
  onRetry,
}) => {
  const [showActions, setShowActions] = useState(false);

  const isInternalNote = message.message_type === 'internal_note';
  const isSystemEvent = message.message_type === 'system_event';

  if (isSystemEvent) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-xs text-[#6B7280]">
          {message.content}
        </div>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`group relative flex gap-3 px-4 py-2 transition-colors ${
        isInternalNote ? 'bg-amber-50/70 border-y border-amber-200/60 my-1' : 'hover:bg-[#F9FAFB]'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border ${
            message.sender_role === 'customer'
              ? 'bg-[#F3F4F6] text-[#111111] border-[#E5E7EB]'
              : 'bg-[#111111] text-white border-[#111111]'
          }`}
        >
          {message.sender_name ? message.sender_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </div>
      </div>

      {/* Main message body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-[#111111] truncate">
            {message.sender_name || (message.sender_role === 'customer' ? 'Customer' : 'Staff')}
          </span>

          {message.sender_role !== 'customer' && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#111111] text-white">
              Staff
            </span>
          )}

          {isInternalNote && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
              <Lock className="w-2.5 h-2.5" />
              Internal Note
            </span>
          )}

          <span className="text-[11px] text-[#9CA3AF] tabular-nums">
            {formatTime(message.created_at)}
          </span>

          {isCurrentUser && (
            <MessageStatus
              status={message.status}
              onRetry={() => onRetry?.(message.id)}
            />
          )}
        </div>

        {/* Embedded Reply reference if applicable */}
        {replyToMessage && (
          <div className="mb-2">
            <MessageReplyPreview replyToMessage={replyToMessage} />
          </div>
        )}

        {/* Message Content */}
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isInternalNote ? 'text-amber-950 font-normal italic' : 'text-[#374151]'
          }`}
        >
          {message.content}
        </div>

        {/* Attachments */}
        <MessageAttachment attachments={message.attachments} />

        {/* Reactions */}
        <MessageReaction
          reactions={message.reactions}
          onToggleReaction={(emoji) => onReact?.(message.id, emoji)}
        />
      </div>

      {/* Floating Actions on Hover */}
      {showActions && (
        <div className="absolute right-4 top-2 z-10">
          <MessageActions
            content={message.content}
            isInternalNote={isInternalNote}
            onReply={() => onReply?.(message)}
            onReact={(emoji) => onReact?.(message.id, emoji)}
          />
        </div>
      )}
    </div>
  );
};
