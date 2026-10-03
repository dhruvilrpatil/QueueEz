import React from 'react';
import { ConversationStatus } from '../../features/messaging/types';
import { STATUS_LABELS, STATUS_STYLES } from '../../features/messaging/constants';

interface ConversationStatusBadgeProps {
  status: ConversationStatus;
  showDot?: boolean;
  className?: string;
}

export const ConversationStatusBadge: React.FC<ConversationStatusBadgeProps> = ({
  status,
  showDot = true,
  className = '',
}) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.open;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badge} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      )}
      {label}
    </span>
  );
};
