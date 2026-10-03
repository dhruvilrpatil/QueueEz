import React, { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  UserCheck,
  Flag,
  MoreVertical,
  Info,
  Building2,
} from 'lucide-react';
import { Conversation, ConversationStatus, ConversationPriority } from '../../features/messaging/types';
import { ConversationStatusBadge } from './ConversationStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CATEGORY_LABELS } from '../../features/messaging/constants';

interface ConversationHeaderProps {
  conversation: Conversation;
  isStaff?: boolean;
  onUpdateStatus?: (status: ConversationStatus) => void;
  onUpdatePriority?: (priority: ConversationPriority) => void;
  onAssignToMe?: () => void;
  onToggleContext?: () => void;
  showContextToggle?: boolean;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  isStaff = false,
  onUpdateStatus,
  onUpdatePriority,
  onAssignToMe,
  onToggleContext,
  showContextToggle = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const categoryLabel = CATEGORY_LABELS[conversation.category] || conversation.category;
  const isResolved = conversation.status === 'resolved' || conversation.status === 'closed';

  return (
    <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-3">
      {/* Title & Metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-semibold text-[#111111] truncate">
              {isStaff ? (conversation.customer?.full_name || 'Customer Query') : conversation.subject}
            </h2>
            {isStaff && conversation.subject && (
              <span className="text-xs font-medium text-[#6B7280] hidden sm:inline-block max-w-[280px] truncate bg-[#F3F4F6] px-2 py-0.5 rounded">
                {conversation.subject}
              </span>
            )}
          </div>
          <ConversationStatusBadge status={conversation.status} />
          {isStaff && <PriorityBadge priority={conversation.priority} />}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
          <span className="font-medium text-[#4B5563]">{categoryLabel}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#9CA3AF]" />
            {conversation.facility?.name || 'Metro Health Center'}
          </span>
          {conversation.assigned_staff && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-[#111111]">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                Assigned: {conversation.assigned_staff.full_name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Staff Actions Toolbar */}
      <div className="flex items-center gap-1.5 shrink-0">
        {showContextToggle && onToggleContext && (
          <button
            onClick={onToggleContext}
            className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] transition-colors"
            title="Toggle customer details panel"
          >
            <Info className="w-4 h-4" />
          </button>
        )}

        {isStaff && (
          <>
            {isResolved ? (
              <button
                onClick={() => onUpdateStatus?.('reopened')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#111111] border border-[#E5E7EB] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus?.('resolved')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            )}

            {/* Overflow options for Priority and Assignment */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-1 z-30 text-xs">
                  {onAssignToMe && !conversation.assigned_staff && (
                    <button
                      onClick={() => {
                        onAssignToMe();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[#111111] hover:bg-[#F8F9FA] flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign to me</span>
                    </button>
                  )}

                  <div className="px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase">
                    Change Status
                  </div>
                  <button
                    onClick={() => {
                      onUpdateStatus?.('in_progress');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#374151] hover:bg-[#F8F9FA]"
                  >
                    Set In Progress
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus?.('waiting_for_customer');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#374151] hover:bg-[#F8F9FA]"
                  >
                    Set Waiting on Customer
                  </button>

                  <div className="border-t border-[#E5E7EB] my-1" />
                  <div className="px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase">
                    Priority
                  </div>
                  {(['low', 'normal', 'high', 'urgent'] as ConversationPriority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        onUpdatePriority?.(p);
                        setShowMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 capitalize hover:bg-[#F8F9FA] ${
                        conversation.priority === p ? 'font-bold text-[#111111]' : 'text-[#4B5563]'
                      }`}
                    >
                      <Flag className="w-3 h-3 inline mr-1.5 text-[#9CA3AF]" />
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
