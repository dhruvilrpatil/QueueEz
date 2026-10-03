import React from 'react';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';

interface EmptyConversationStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'empty' | 'select';
}

export const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({
  title = 'No conversation selected',
  description = 'Choose a conversation from the list to view the message history, customer details, and appointment context.',
  actionLabel,
  onAction,
  icon = 'select',
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl border border-dashed border-[#E5E7EB]">
      <div className="w-12 h-12 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] mb-4">
        {icon === 'empty' ? (
          <MessageSquarePlus className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </div>
      <h3 className="text-base font-semibold text-[#111111] mb-1">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#242424] text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
