import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

export function useTypingIndicator(conversationId: string | undefined, currentUserName: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const broadcastChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    broadcastChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user } = payload.payload || {};
        if (!user || user === currentUserName) return;

        setTypingUsers((prev) => (prev.includes(user) ? prev : [...prev, user]));

        // Clear existing timeout
        if (typingTimeoutRef.current[user]) {
          clearTimeout(typingTimeoutRef.current[user]);
        }

        // Auto remove after 3 seconds of silence
        typingTimeoutRef.current[user] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== user));
        }, 3000);
      })
      .subscribe();

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      supabase.removeChannel(channel);
      broadcastChannelRef.current = null;
    };
  }, [conversationId, currentUserName]);

  const sendTyping = useCallback(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: currentUserName },
      });
    }
  }, [currentUserName]);

  return {
    typingUsers,
    sendTyping,
  };
}
