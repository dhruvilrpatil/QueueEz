import { useState, useEffect, useCallback } from 'react';
import { Message, SendMessagePayload } from '../types';
import { messagingApi } from '../api/messagingApi';

export function useMessages(conversationId: string | undefined, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await messagingApi.getMessages(conversationId);
      setMessages(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!conversationId) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId || 'current-user',
        sender_role: payload.message_type === 'internal_note' ? 'staff' : 'customer',
        content: payload.content,
        message_type: payload.message_type || 'customer_message',
        status: 'sending',
        reply_to_message_id: payload.reply_to_message_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically append
      setMessages((prev) => [...prev, optimisticMessage]);
      setSending(true);

      try {
        const persisted = await messagingApi.sendMessage(conversationId, payload);
        // Replace temp message with server response
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...persisted, status: 'sent' } : m))
        );
        return persisted;
      } catch (err: any) {
        // Mark as failed for retry
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
        throw new Error(err?.message || 'Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId]
  );

  const retryMessage = useCallback(
    async (failedMessageId: string) => {
      const target = messages.find((m) => m.id === failedMessageId);
      if (!target || !conversationId) return;

      setMessages((prev) =>
        prev.map((m) => (m.id === failedMessageId ? { ...m, status: 'sending' } : m))
      );

      try {
        const persisted = await messagingApi.sendMessage(conversationId, {
          content: target.content,
          message_type: target.message_type,
          reply_to_message_id: target.reply_to_message_id,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMessageId ? { ...persisted, status: 'sent' } : m))
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMessageId ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [conversationId, messages]
  );

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    retryMessage,
    refresh: fetchMessages,
    setMessages,
  };
}
