import { useState, useCallback } from 'react';
import { SendMessagePayload, Message } from '../types';
import { messagingApi } from '../api/messagingApi';

export function useSendMessage(conversationId: string | undefined) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (payload: SendMessagePayload): Promise<Message | undefined> => {
      if (!conversationId) return;

      try {
        setSending(true);
        setError(null);
        const res = await messagingApi.sendMessage(conversationId, payload);
        return res;
      } catch (err: any) {
        setError(err?.message || 'Failed to send message');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  return {
    sendMessage,
    sending,
    error,
  };
}
