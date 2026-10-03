import { useCallback } from 'react';
import { messagingApi } from '../api/messagingApi';

export function useMarkConversationRead() {
  const markRead = useCallback(async (conversationId: string) => {
    try {
      await messagingApi.markRead(conversationId);
    } catch (err) {
      console.warn('Failed to mark conversation read:', err);
    }
  }, []);

  return { markRead };
}
