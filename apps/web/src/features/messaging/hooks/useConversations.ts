import { useState, useEffect, useCallback } from 'react';
import { Conversation, ConversationFilters } from '../types';
import { messagingApi } from '../api/messagingApi';

export function useConversations(initialFilters?: ConversationFilters) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filters, setFilters] = useState<ConversationFilters>(initialFilters || {});
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await messagingApi.getConversations(filters);
      setConversations(res.conversations);
      setUnreadTotal(res.unreadTotal);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const updateFilters = useCallback((newFilters: Partial<ConversationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    return fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    unreadTotal,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
    setConversations,
  };
}
