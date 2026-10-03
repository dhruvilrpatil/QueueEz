import React, { useEffect, useRef } from 'react';
import { Message } from '../../features/messaging/types';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  typingUsers?: string[];
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (messageId: string) => void;
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  typingUsers = [],
  onReply,
  onReact,
  onRetry,
  loading = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-[#6B7280]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <span>Loading message history...</span>
        </div>
      </div>
    );
  }

  // Create lookup for reply parents
  const messageMap = new Map<string, Message>();
  messages.forEach((m) => messageMap.set(m.id, m));

  // Group messages by date
  const formatDateHeader = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return 'Today';
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  let lastDateHeader = '';

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-4 space-y-1">
      {messages.map((message) => {
        const currentDateHeader = formatDateHeader(message.created_at);
        const showDateSeparator = currentDateHeader !== lastDateHeader;
        if (showDateSeparator) {
          lastDateHeader = currentDateHeader;
        }

        const replyParent = message.reply_to_message_id
          ? messageMap.get(message.reply_to_message_id)
          : null;

        return (
          <React.Fragment key={message.id}>
            {showDateSeparator && (
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-0.5 text-[11px] font-medium text-[#6B7280] bg-[#F3F4F6] rounded-full border border-[#E5E7EB]">
                  {currentDateHeader}
                </span>
              </div>
            )}
            <MessageItem
              message={message}
              replyToMessage={replyParent}
              isCurrentUser={message.sender_id === currentUserId}
              onReply={onReply}
              onReact={onReact}
              onRetry={onRetry}
            />
          </React.Fragment>
        );
      })}

      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
};
