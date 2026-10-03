import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ConversationFilters as FilterType, ConversationStatus } from '../../features/messaging/types';

interface ConversationFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
  isStaff?: boolean;
}

export const ConversationFilters: React.FC<ConversationFiltersProps> = ({
  filters,
  onFilterChange,
  isStaff = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounced search
  useEffect(() => {
    if (searchTerm === (filters.search || '')) return;
    const timer = setTimeout(() => {
      onFilterChange({ search: searchTerm.trim() || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFilterChange]);

  const statusTabs: { id: ConversationStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'waiting_for_customer', label: 'Waiting' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="p-3 border-b border-[#E5E7EB] bg-white space-y-2.5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer, subject, or token..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111111]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = (filters.status || 'all') === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ status: tab.id })}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <button
          onClick={() => onFilterChange({ unread_only: !filters.unread_only })}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 transition-colors ${
            filters.unread_only
              ? 'bg-blue-600 text-white'
              : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
        >
          Unread
        </button>

        {isStaff && (
          <button
            onClick={() => onFilterChange({ assigned_to_me: !filters.assigned_to_me })}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 transition-colors ${
              filters.assigned_to_me
                ? 'bg-purple-600 text-white'
                : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            My Queries
          </button>
        )}
      </div>
    </div>
  );
};
