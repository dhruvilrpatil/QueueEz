import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, CheckCheck } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  useConversations,
  useConversation,
  useMessages,
  useMarkConversationRead,
  useMessagingRealtime,
  useTypingIndicator,
  Conversation,
} from '@/features/messaging';
import {
  ConversationList,
  ConversationHeader,
  ConversationContext,
  MessageList,
  MessageComposer,
  EmptyConversationState,
} from '@/components/messaging';
import { AppLayout } from '@/components/layout/AppSidebar';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const isAdmin = profile?.role === 'facility_admin' || profile?.role === 'system_admin';
  const basePath = isAdmin ? '/admin/chat' : '/staff/chat';
  const effectiveRole = isAdmin ? profile.role : 'staff';

  const [showContextPanel, setShowContextPanel] = useState(true);
  const [replyTarget, setReplyTarget] = useState<any>(null);

  // Conversations list
  const {
    conversations,
    filters,
    updateFilters,
    loading: listLoading,
    refresh: refreshList,
    setConversations,
  } = useConversations();

  // Find preloaded conversation from loaded list for instantaneous transition
  const activeConversation = conversations.find((c) => c.id === conversationId);

  // Active conversation details
  const {
    conversation,
    loading: conversationLoading,
    updateStatus,
    updatePriority,
    assignStaff,
    refresh: refreshConversation,
  } = useConversation(conversationId, activeConversation);

  // Messages
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    retryMessage,
    refresh: refreshMessages,
    setMessages,
  } = useMessages(conversationId, user?.id);

  // Mark read
  const { markRead } = useMarkConversationRead();

  // Typing indicator
  const currentUserName = user?.user_metadata?.full_name || (isAdmin ? 'Admin' : 'Staff Member');
  const { typingUsers, sendTyping } = useTypingIndicator(conversationId, currentUserName);

  // Mark read upon opening conversation
  useEffect(() => {
    if (conversationId) {
      markRead(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      );
    }
  }, [conversationId, markRead, setConversations]);

  // Realtime subscription
  useMessagingRealtime(conversationId, {
    onNewMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      refreshList();
    },
    onConversationUpdated: () => {
      refreshConversation();
      refreshList();
    },
  });

  const handleSelectConversation = (c: Conversation) => {
    navigate(`${basePath}/${c.id}`);
  };

  const handleAssignToMe = async () => {
    if (user?.id) {
      await assignStaff(user.id);
      refreshList();
    }
  };

  return (
    <AppLayout role={effectiveRole} noPadding>
      <div className="h-full flex flex-col bg-[#F8F9FA] overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#111111] tracking-tight">
            {isAdmin ? 'Facility Chat & Queries Oversight' : 'Staff Chat & Queries'}
          </h1>
          <p className="text-xs text-[#6B7280]">
            Manage patient inquiries, appointment clarifications, and queue questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshList()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111111] bg-[#F8F9FA] hover:bg-[#E5E7EB] rounded-lg border border-[#E5E7EB] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Inbox List Pane */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 h-full border-r border-[#E5E7EB] ${
            conversationId ? 'hidden md:flex flex-col' : 'flex flex-col'
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            filters={filters}
            onFilterChange={updateFilters}
            isStaff={true}
            loading={listLoading}
            showCustomerName={true}
          />
        </div>

        {/* Center: Active Conversation Workspace */}
        <div
          className={`flex-1 flex flex-col h-full bg-white ${
            !conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {conversationId && conversation ? (
            <>
              {/* Back button on mobile */}
              <div className="md:hidden px-3 py-2 border-b border-[#E5E7EB] bg-[#F8F9FA]">
                <button
                  onClick={() => navigate(basePath)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Inbox</span>
                </button>
              </div>

              {/* Conversation Header */}
              <ConversationHeader
                conversation={conversation}
                isStaff={true}
                onUpdateStatus={async (status) => {
                  await updateStatus(status);
                  refreshList();
                }}
                onUpdatePriority={async (priority) => {
                  await updatePriority(priority);
                  refreshList();
                }}
                onAssignToMe={handleAssignToMe}
                onToggleContext={() => setShowContextPanel(!showContextPanel)}
                showContextToggle={true}
              />

              {/* Body: Timeline + Right Context Panel */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <MessageList
                    messages={messages}
                    currentUserId={user?.id}
                    typingUsers={typingUsers}
                    loading={messagesLoading}
                    onReply={(msg) => setReplyTarget(msg)}
                    onRetry={retryMessage}
                  />

                  {/* Message Composer */}
                  <MessageComposer
                    onSendMessage={async (payload) => {
                      await sendMessage(payload);
                      setReplyTarget(null);
                      refreshList();
                    }}
                    replyToMessage={replyTarget}
                    onClearReply={() => setReplyTarget(null)}
                    isStaff={true}
                    disabled={conversation.status === 'closed'}
                    onTyping={sendTyping}
                    placeholder="Write a reply to the customer or internal staff note..."
                  />
                </div>

                {/* Right Context Panel (Desktop) */}
                {showContextPanel && (
                  <div className="w-72 lg:w-80 shrink-0 h-full overflow-y-auto hidden xl:block">
                    <ConversationContext conversation={conversation} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 p-6">
              <EmptyConversationState
                title="Select a customer query to respond"
                description="Choose an incoming conversation from the left to view customer details, appointment records, and respond with advice or updates."
              />
            </div>
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
