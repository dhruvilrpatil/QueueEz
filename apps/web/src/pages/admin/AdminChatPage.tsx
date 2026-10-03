import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Shield,
  Filter,
  CheckCircle,
  Clock,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useConversations, Conversation, ConversationStatus } from '@/features/messaging';
import { ConversationStatusBadge, PriorityBadge, UnreadBadge } from '@/components/messaging';
import { CATEGORY_LABELS } from '@/features/messaging/constants';
import { AppLayout } from '@/components/layout/AppSidebar';

export const AdminChatPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    conversations,
    filters,
    updateFilters,
    unreadTotal,
    loading,
    refresh,
  } = useConversations();

  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'open' | 'resolved'>('all');

  // Compute metrics
  const totalQueries = conversations.length;
  const openQueries = conversations.filter((c) => c.status === 'open' || c.status === 'in_progress').length;
  const resolvedQueries = conversations.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const unassignedQueries = conversations.filter((c) => !c.assigned_staff_id).length;

  const filteredList = conversations.filter((c) => {
    if (activeTab === 'unassigned') return !c.assigned_staff_id;
    if (activeTab === 'open') return c.status === 'open' || c.status === 'in_progress';
    if (activeTab === 'resolved') return c.status === 'resolved' || c.status === 'closed';
    return true;
  });

  return (
    <AppLayout role="facility_admin">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111111] tracking-tight">Facility Queries & Chat Oversight</h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#111111] text-white">
                Admin
              </span>
            </div>
            <p className="text-sm text-[#6B7280]">
              Review all patient inquiries, staff responsiveness, and issue resolution status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#111111] bg-white hover:bg-[#F8F9FA] rounded-lg border border-[#E5E7EB] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                if (conversations.length > 0) {
                  navigate(`/admin/chat/${conversations[0].id}`);
                } else {
                  navigate('/admin/chat');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#242424] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Open Chat Workspace</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2 font-medium">
              <span>Total Queries</span>
              <MessageSquare className="w-4 h-4 text-[#9CA3AF]" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{totalQueries}</p>
            <p className="text-[11px] text-[#6B7280] mt-1">Across all categories</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-xs text-blue-700 mb-2 font-medium">
              <span>Active & Open</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{openQueries}</p>
            <p className="text-[11px] text-blue-600 mt-1">Requiring staff response</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-xs text-amber-700 mb-2 font-medium">
              <span>Unassigned Queries</span>
              <UserCheck className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{unassignedQueries}</p>
            <p className="text-[11px] text-amber-600 mt-1">Needs staff allocation</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-xs text-emerald-700 mb-2 font-medium">
              <span>Resolved</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{resolvedQueries}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Successfully handled</p>
          </div>
        </div>

        {/* Tabs and Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          {/* Table Tabs */}
          <div className="flex items-center gap-1 p-3 border-b border-[#E5E7EB] bg-[#F8F9FA]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#E5E7EB]'
              }`}
            >
              All Queries ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'unassigned'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#E5E7EB]'
              }`}
            >
              Unassigned ({unassignedQueries})
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'open'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#E5E7EB]'
              }`}
            >
              Open & In Progress ({openQueries})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'resolved'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#E5E7EB]'
              }`}
            >
              Resolved ({resolvedQueries})
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Subject & Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#6B7280]">
                      Loading conversations...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#6B7280]">
                      No conversations found under this filter.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#111111]">{c.customer?.full_name || 'Customer'}</p>
                        <p className="text-[11px] text-[#6B7280]">{c.customer?.email}</p>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-medium text-[#111111] truncate">{c.subject}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          {CATEGORY_LABELS[c.category] || c.category}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <ConversationStatusBadge status={c.status} />
                      </td>

                      <td className="px-4 py-3.5">
                        <PriorityBadge priority={c.priority} />
                      </td>

                      <td className="px-4 py-3.5">
                        {c.assigned_staff ? (
                          <span className="font-medium text-[#111111]">
                            {c.assigned_staff.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {c.appointment && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              {c.appointment.booking_reference}
                            </span>
                          )}
                          {c.queue_ticket && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                              #{c.queue_ticket.ticket_number}
                            </span>
                          )}
                          {!c.appointment && !c.queue_ticket && (
                            <span className="text-[#9CA3AF] text-[11px]">General</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[#6B7280] tabular-nums">
                        {new Date(c.last_message_at || c.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/admin/chat/${c.id}`)}
                          className="px-3 py-1 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminChatPage;
