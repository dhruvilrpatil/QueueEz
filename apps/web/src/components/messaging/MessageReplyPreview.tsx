import React from 'react';
import { CornerDownRight, X } from 'lucide-react';
import { Message } from '../../features/messaging/types';

interface MessageReplyPreviewProps {
  replyToMessage?: Message | null;
  onClearReply?: () => void;
  isComposer?: boolean;
  className?: string;
}

export const MessageReplyPreview: React.FC<MessageReplyPreviewProps> = ({
  replyToMessage,
  onClearReply,
  isComposer = false,
  className = '',
}) => {
  if (!replyToMessage) return null;

  return (
    <div
      className={`flex items-start justify-between gap-2 p-2 rounded-lg border-l-2 border-[#111111] bg-[#F8F9FA] text-xs ${className}`}
    >
      <div className="flex items-start gap-1.5 overflow-hidden">
        <CornerDownRight className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-[#111111] truncate">
            {replyToMessage.sender_name || (replyToMessage.sender_role === 'customer' ? 'Customer' : 'Staff')}
          </p>
          <p className="text-[#6B7280] truncate max-w-md">{replyToMessage.content}</p>
        </div>
      </div>
      {isComposer && onClearReply && (
        <button
          onClick={onClearReply}
          className="p-1 text-[#9CA3AF] hover:text-[#111111] rounded hover:bg-[#E5E7EB] transition-colors"
          title="Cancel reply"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
