import React, { useState } from 'react';
import { Reply, Copy, Check, ThumbsUp, Heart, CheckCircle2, Bookmark } from 'lucide-react';

interface MessageActionsProps {
  onReply?: () => void;
  onReact?: (reaction: string) => void;
  content: string;
  isInternalNote?: boolean;
}

const QUICK_REACTIONS = [
  { id: 'thumbs_up', label: 'Like', icon: ThumbsUp, color: 'text-primary' },
  { id: 'heart', label: 'Helpful', icon: Heart, color: 'text-rose-500' },
  { id: 'check', label: 'Done', icon: CheckCircle2, color: 'text-emerald-600' },
  { id: 'bookmark', label: 'Save', icon: Bookmark, color: 'text-blue-600' },
];

export const MessageActions: React.FC<MessageActionsProps> = ({
  onReply,
  onReact,
  content,
  isInternalNote,
}) => {
  const [copied, setCopied] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-flex items-center gap-0.5 bg-white border border-[#E5E7EB] rounded-lg p-0.5 shadow-xs">
      {/* Quick reaction picker */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="p-1 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded transition-colors"
          title="Add reaction"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>

        {showReactionPicker && (
          <div className="absolute bottom-full mb-1 left-0 flex items-center gap-1 p-1 bg-white border border-[#E5E7EB] rounded-lg shadow-md z-20">
            {QUICK_REACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onReact?.(item.id);
                    setShowReactionPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#F3F4F6] rounded transition-colors"
                  title={item.label}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isInternalNote && onReply && (
        <button
          onClick={onReply}
          className="p-1 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        onClick={handleCopy}
        className="p-1 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded transition-colors"
        title={copied ? 'Copied' : 'Copy message'}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
