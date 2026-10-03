import { useState, useEffect, useCallback } from 'react';
import { Conversation, ConversationStatus, ConversationPriority } from '../types';
import { messagingApi } from '../api/messagingApi';

export function useConversation(conversationId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await messagingApi.getConversation(conversationId);
      setConversation(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversation details');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  const updateStatus = useCallback(async (status: ConversationStatus) => {
    if (!conversationId) return;
    try {
      const updated = await messagingApi.updateStatus(conversationId, status);
      setConversation(updated);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to update conversation status');
    }
  }, [conversationId]);

  const updatePriority = useCallback(async (priority: ConversationPriority) => {
    if (!conversationId) return;
    try {
      const updated = await messagingApi.updatePriority(conversationId, priority);
      setConversation(updated);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to update priority');
    }
  }, [conversationId]);

  const assignStaff = useCallback(async (staffId: string | null) => {
    if (!conversationId) return;
    try {
      const updated = await messagingApi.assignStaff(conversationId, staffId);
      setConversation(updated);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to assign staff');
    }
  }, [conversationId]);

  return {
    conversation,
    loading,
    error,
    refresh: fetchConversation,
    updateStatus,
    updatePriority,
    assignStaff,
    setConversation,
  };
}
