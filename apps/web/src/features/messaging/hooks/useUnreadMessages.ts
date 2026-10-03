import { useState, useEffect, useCallback } from 'react';
import { messagingApi } from '../api/messagingApi';

export function useUnreadMessages(pollIntervalMs = 15000) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchCount = useCallback(async () => {
    try {
      const count = await messagingApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchCount, pollIntervalMs]);

  const decrement = useCallback((by = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  return {
    unreadCount,
    refreshUnread: fetchCount,
    decrement,
    setUnreadCount,
  };
}
