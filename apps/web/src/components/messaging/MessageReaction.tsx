import React from 'react';
import { ThumbsUp, Heart, CheckCircle2, Bookmark } from 'lucide-react';
import { MessageReaction as ReactionType } from '../../features/messaging/types';

interface MessageReactionProps {
  reactions?: ReactionType[];
  currentUserId?: string;
  onToggleReaction?: (reaction: string) => void;
  className?: string;
}

function renderReactionBadge(reaction: string) {
  switch (reaction) {
    case 'thumbs_up':
    case '\u{1F44D}':
      return <ThumbsUp className="w-3 h-3 text-primary" />;
    case 'heart':
    case '\u{2764}\u{FE0F}':
    case '\u{2764}':
      return <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />;
    case 'check':
    case '\u{2705}':
      return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    case 'bookmark':
    case '\u{1F64F}':
      return <Bookmark className="w-3 h-3 text-blue-600" />;
    default:
      return <span className="text-[11px] font-medium">{reaction}</span>;
  }
}

export const MessageReaction: React.FC<MessageReactionProps> = ({
  reactions = [],
  currentUserId,
  onToggleReaction,
  className = '',
}) => {
  if (!reactions || reactions.length === 0) return null;

  // Group by reaction
  const grouped = reactions.reduce<Record<string, { count: number; userReacted: boolean; reactionIds: string[] }>>(
    (acc, r) => {
      if (!acc[r.reaction]) {
        acc[r.reaction] = { count: 0, userReacted: false, reactionIds: [] };
      }
      acc[r.reaction].count += 1;
      acc[r.reaction].reactionIds.push(r.id);
      if (r.user_id === currentUserId) {
        acc[r.reaction].userReacted = true;
      }
      return acc;
    },
    {}
  );

  return (
    <div className={`flex flex-wrap items-center gap-1 mt-1 ${className}`}>
      {Object.entries(grouped).map(([reaction, data]) => (
        <button
          key={reaction}
          onClick={() => onToggleReaction?.(reaction)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
            data.userReacted
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F8F9FA]'
          }`}
        >
          {renderReactionBadge(reaction)}
          <span className="text-[11px] tabular-nums font-semibold">{data.count}</span>
        </button>
      ))}
    </div>
  );
};

