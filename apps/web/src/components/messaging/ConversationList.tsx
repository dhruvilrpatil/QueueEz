import React from 'react';
import { Conversation, ConversationFilters as FilterType } from '../../features/messaging/types';
import { ConversationListItem } from './ConversationListItem';
import { ConversationFilters } from './ConversationFilters';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
  isStaff?: boolean;
  loading?: boolean;
  showCustomerName?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  filters,
  onFilterChange,
  isStaff = false,
  loading = false,
  showCustomerName = true,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E7EB]">
      <ConversationFilters
        filters={filters}
        onFilterChange={onFilterChange}
        isStaff={isStaff}
      />

      <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
        {loading && conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7280]">
            <div className="w-5 h-5 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7280]">
            No conversations match your current filters.
          </div>
        ) : (
          conversations.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isSelected={c.id === selectedConversationId}
              onSelect={onSelectConversation}
              showCustomerName={showCustomerName}
            />
          ))
        )}
      </div>
    </div>
  );
};
