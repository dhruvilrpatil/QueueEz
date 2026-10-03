import { useState, useEffect, useCallback } from 'react';
import { Conversation, ConversationStatus, ConversationPriority } from '../types';
import { messagingApi } from '../api/messagingApi';

export function useConversation(conversationId: string | undefined, initialConversation?: Conversation) {
  const [conversation, setConversation] = useState<Conversation | null>(() => {
    if (initialConversation) return initialConversation;
    if (conversationId) return messagingApi.getCachedConversation(conversationId) || null;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialConversation) return false;
    if (conversationId && messagingApi.getCachedConversation(conversationId)) return false;
    return !!conversationId;
  });
  const [error, setError] = useState<string | null>(null);

  // Sync immediately when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    const cached = initialConversation || messagingApi.getCachedConversation(conversationId);
    if (cached) {
      setConversation(cached);
      setLoading(false);
    }
  }, [conversationId, initialConversation]);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    try {
      const cached = messagingApi.getCachedConversation(conversationId);
      if (!cached) {
        setLoading(true);
      }
      setError(null);
      const data = await messagingApi.getConversation(conversationId);
      setConversation(data);
    } catch (err: any) {
      // If we don't have cached data, set error
      if (!conversation) {
        setError(err?.message || 'Failed to load conversation details');
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, conversation]);

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
