import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Message, Conversation } from '../types';

interface RealtimeCallbacks {
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onConversationUpdated?: (conversation: Partial<Conversation>) => void;
}

export function useMessagingRealtime(
  conversationId: string | undefined,
  callbacks: RealtimeCallbacks
) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!conversationId) return;

    // Create a dedicated channel scoped to this conversation
    const channelName = `conversation:${conversationId}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (callbacksRef.current.onNewMessage && payload.new) {
            callbacksRef.current.onNewMessage(payload.new as Message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (callbacksRef.current.onMessageUpdated && payload.new) {
            callbacksRef.current.onMessageUpdated(payload.new as Message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          if (callbacksRef.current.onConversationUpdated && payload.new) {
            callbacksRef.current.onConversationUpdated(payload.new as Partial<Conversation>);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected successfully
        }
      });

    // Cleanup subscription on unmount or conversation switch
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
