import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquarePlus, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  useConversations,
  useConversation,
  useMessages,
  useMarkConversationRead,
  useMessagingRealtime,
  useTypingIndicator,
  Conversation,
  CreateConversationPayload,
} from '@/features/messaging';
import {
  ConversationList,
  ConversationHeader,
  MessageList,
  MessageComposer,
  EmptyConversationState,
  NewQueryModal,
} from '@/components/messaging';
import { messagingApi } from '@/features/messaging/api/messagingApi';
import { AppLayout } from '@/components/layout/AppSidebar';

export const MessagesPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<any>(null);

  // Conversations list hook
  const {
    conversations,
    filters,
    updateFilters,
    loading: listLoading,
    refresh: refreshList,
    setConversations,
  } = useConversations();

  // Active conversation hook
  const activeConversation = conversations.find((c) => c.id === conversationId);
  const {
    conversation,
    loading: conversationLoading,
    refresh: refreshConversation,
  } = useConversation(conversationId, activeConversation);

  // Messages hook
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    retryMessage,
    refresh: refreshMessages,
    setMessages,
  } = useMessages(conversationId, user?.id);

  // Mark read hook
  const { markRead } = useMarkConversationRead();

  // Typing indicator hook
  const currentUserName = user?.user_metadata?.full_name || 'Customer';
  const { typingUsers, sendTyping } = useTypingIndicator(conversationId, currentUserName);

  // Mark read when entering conversation
  useEffect(() => {
    if (conversationId) {
      markRead(conversationId);
      // Decrement unread count locally in list
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      );
    }
  }, [conversationId, markRead, setConversations]);

  // Realtime hook
  useMessagingRealtime(conversationId, {
    onNewMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      refreshList();
    },
    onConversationUpdated: (updated) => {
      refreshConversation();
      refreshList();
    },
  });

  const handleCreateQuery = async (payload: CreateConversationPayload) => {
    const res = await messagingApi.createConversation(payload);
    await refreshList();
    navigate(`/app/messages/${res.conversation.id}`);
  };

  const handleSelectConversation = (c: Conversation) => {
    navigate(`/app/messages/${c.id}`);
  };

  return (
    <AppLayout role="customer" noPadding>
      <div className="h-full flex flex-col bg-[#F8F9FA] overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#111111] tracking-tight">Help & Queries</h1>
          <p className="text-xs text-[#6B7280]">
            Ask questions regarding your appointments, queue tickets, or facility services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshList()}
            className="p-2 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] transition-colors"
            title="Refresh queries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#242424] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Ask a Question</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane or Single-Pane Responsive View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Inbox pane (hidden on mobile if viewing conversation) */}
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
            isStaff={false}
            loading={listLoading}
            showCustomerName={false}
          />
        </div>

        {/* Right Active Conversation pane */}
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
                  onClick={() => navigate('/app/messages')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Queries</span>
                </button>
              </div>

              {/* Header */}
              <ConversationHeader
                conversation={conversation}
                isStaff={false}
              />

              {/* Message Timeline */}
              <MessageList
                messages={messages}
                currentUserId={user?.id}
                typingUsers={typingUsers}
                loading={messagesLoading}
                onReply={(msg) => setReplyTarget(msg)}
                onRetry={retryMessage}
              />

              {/* Composer */}
              <MessageComposer
                onSendMessage={async (payload) => {
                  await sendMessage(payload);
                  setReplyTarget(null);
                }}
                replyToMessage={replyTarget}
                onClearReply={() => setReplyTarget(null)}
                isStaff={false}
                disabled={conversation.status === 'closed'}
                onTyping={sendTyping}
                placeholder={
                  conversation.status === 'closed'
                    ? 'This conversation is closed.'
                    : 'Type your message or follow-up question...'
                }
              />
            </>
          ) : (
            <div className="flex-1 p-6">
              <EmptyConversationState
                title="Select or start a conversation"
                description="Have a question about your appointment timing, required documents, or wait time? Ask our facility team directly."
                actionLabel="Ask a Question"
                onAction={() => setIsModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* New Query Modal */}
      <NewQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateQuery}
      />
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
