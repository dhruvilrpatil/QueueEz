import React from 'react';
import { MessageReaction as ReactionType } from '../../features/messaging/types';

interface MessageReactionProps {
  reactions?: ReactionType[];
  currentUserId?: string;
  onToggleReaction?: (emoji: string) => void;
  className?: string;
}

export const MessageReaction: React.FC<MessageReactionProps> = ({
  reactions = [],
  currentUserId,
  onToggleReaction,
  className = '',
}) => {
  if (!reactions || reactions.length === 0) return null;

  // Group by emoji
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
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction?.(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
            data.userReacted
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>{emoji}</span>
          <span className="text-[11px] tabular-nums font-semibold">{data.count}</span>
        </button>
      ))}
    </div>
  );
};
