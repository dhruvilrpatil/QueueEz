import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { MessageDeliveryStatus } from '../../features/messaging/types';

interface MessageStatusProps {
  status: MessageDeliveryStatus;
  onRetry?: () => void;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  onRetry,
  className = '',
}) => {
  if (status === 'sending') {
    return (
      <span className={`inline-flex items-center text-[#9CA3AF] ${className}`} title="Sending...">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span className={`inline-flex items-center text-[#9CA3AF] ${className}`} title="Delivered">
        <Check className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (status === 'read') {
    return (
      <span className={`inline-flex items-center text-[#3B82F6] ${className}`} title="Read">
        <CheckCheck className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRetry?.();
        }}
        className={`inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium transition-colors ${className}`}
        title="Failed to send. Click to retry."
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Failed · Retry</span>
      </button>
    );
  }

  return null;
};
