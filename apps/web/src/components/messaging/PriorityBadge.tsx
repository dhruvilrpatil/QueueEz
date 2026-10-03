import React from 'react';
import { ConversationPriority } from '../../features/messaging/types';
import { PRIORITY_STYLES } from '../../features/messaging/constants';

interface PriorityBadgeProps {
  priority: ConversationPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = '',
}) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${style.badge} ${className}`}
    >
      {style.label}
    </span>
  );
};
