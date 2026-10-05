import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseQueueDisplayRealtimeProps {
  sessionId?: string;
  facilityId?: string;
  onQueueUpdate: () => void;
}

export function useQueueDisplayRealtime({
  sessionId,
  facilityId,
  onQueueUpdate,
}: UseQueueDisplayRealtimeProps) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      const channelName = `tv-queue:${sessionId}:${Date.now()}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queue_tickets',
            filter: `queue_session_id=eq.${sessionId}`,
          },
          () => {
            if (isMounted) onQueueUpdate();
          }
        );

      if (facilityId) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'counters',
            filter: `facility_id=eq.${facilityId}`,
          },
          () => {
            if (isMounted) onQueueUpdate();
          }
        );
      }

      channel.subscribe((status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setIsReconnecting(false);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setIsReconnecting(true);
        }
      });
    } catch {
      setIsConnected(false);
      setIsReconnecting(true);
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [sessionId, facilityId, onQueueUpdate]);

  return {
    isConnected,
    isReconnecting,
  };
}
