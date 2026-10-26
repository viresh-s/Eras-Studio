'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bell, ExternalLink, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { getFreemiumStatusAction } from '@/actions/profileActions';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
  read_at?: string | null;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [persistentNotice, setPersistentNotice] = useState<NotificationItem | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Fast notification fetcher (only queries notifications table, zero heavy server actions)
  const fetchNotificationsFast = useCallback(async (userId: string) => {
    try {
      const { data, error } = await (supabase.from('notifications') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && Array.isArray(data)) {
        setNotifications((prev) => {
          // Merge with persistent notice if exists
          const combined = persistentNotice ? [persistentNotice, ...data.filter(n => n.id !== persistentNotice.id)] : data;
          return combined;
        });
        const unread = data.filter((n: any) => !n.is_read).length + (persistentNotice ? 1 : 0);
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Fast notification check notice:', err);
    }
  }, [supabase, persistentNotice]);

  // Check persistent freemium status in the background
  const checkFreemiumOnce = useCallback(async (userId: string) => {
    try {
      const freemiumStatus = await getFreemiumStatusAction(userId);
      if (freemiumStatus?.isLocked) {
        const upgradeNotice: NotificationItem = {
          id: 'UPGRADE-PERSISTENT',
          user_id: userId,
          title: 'Action Required: Upgrade Account',
          message: freemiumStatus.reason,
          type: 'UPGRADE_REQUIRED',
          is_read: false,
          link: '/subscription',
          created_at: new Date().toISOString(),
        };
        setPersistentNotice(upgradeNotice);
        setNotifications((prev) => [upgradeNotice, ...prev.filter((n) => n.id !== 'UPGRADE-PERSISTENT')]);
        setUnreadCount((prev) => prev + 1);
      }
    } catch {
      // Non-critical, ignore
    }
  }, []);

  useEffect(() => {
    let channel: any = null;
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let clockTimer: NodeJS.Timeout | null = null;

    async function initUserNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      userIdRef.current = user.id;

      // Initial instant fetch
      await fetchNotificationsFast(user.id);
      if (!isMounted) return;
      checkFreemiumOnce(user.id);

      // Clean up any stale channels with the same topic before subscribing
      const channelName = `user-notifications-${user.id}`;
      const existingChannels = supabase.getChannels();
      for (const ch of existingChannels) {
        if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
          supabase.removeChannel(ch);
        }
      }

      if (!isMounted) return;

      // 1. Supabase Realtime channel dedicated to this user's notifications
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;
            const newNotif = payload.new as NotificationItem;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            setUnreadCount((prev) => prev + 1);
          }
        );

      channel.subscribe();

      // 2. Fallback polling (ensures notifications appear even if realtime websocket disconnects)
      pollTimer = setInterval(() => {
        if (userIdRef.current && isMounted && typeof document !== 'undefined' && !document.hidden) {
          fetchNotificationsFast(userIdRef.current);
        }
      }, 30000);

      clockTimer = setInterval(() => {
        if (isMounted) setCurrentTime(Date.now());
      }, 60000);
    }

    initUserNotifications();

    // 3. Instant re-fetch on window focus or tab visibility change
    const handleVisibilityOrFocus = () => {
      if (userIdRef.current && isMounted) {
        fetchNotificationsFast(userIdRef.current);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      if (pollTimer) clearInterval(pollTimer);
      if (clockTimer) clearInterval(clockTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [supabase, fetchNotificationsFast, checkFreemiumOnce]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    if (id === 'UPGRADE-PERSISTENT') return;

    const nowIso = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: nowIso } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await (supabase.from('notifications') as any)
      .update({ is_read: true, read_at: nowIso })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    const userId = userIdRef.current;
    if (!userId) return;

    const nowIso = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((n) => (n.id === 'UPGRADE-PERSISTENT' ? n : { ...n, is_read: true, read_at: nowIso }))
    );

    setUnreadCount(() => (persistentNotice ? 1 : 0));

    await (supabase.from('notifications') as any)
      .update({ is_read: true, read_at: nowIso })
      .eq('user_id', userId)
      .eq('is_read', false);
  };

  const visibleNotifications = notifications.filter((n) => {
    if (n.id === 'UPGRADE-PERSISTENT') return true;
    if (!n.is_read) return true;
    if (!n.read_at) return false;

    const readTime = new Date(n.read_at).getTime();
    return currentTime - readTime < 10 * 60 * 1000;
  });

  return (
    <div className="relative flex items-center mr-2" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (userIdRef.current) fetchNotificationsFast(userIdRef.current);
        }}
        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
        aria-label="View notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-500">
                No new notifications right now.
              </div>
            ) : (
              visibleNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                    !notif.is_read
                      ? notif.id === 'UPGRADE-PERSISTENT'
                        ? 'bg-amber-50/60'
                        : 'bg-blue-50/50'
                      : ''
                  }`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        notif.id === 'UPGRADE-PERSISTENT' ? 'text-amber-800' : 'text-gray-900'
                      }`}
                    >
                      {notif.id === 'UPGRADE-PERSISTENT' && (
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                      )}
                      {notif.title}
                    </p>
                    {!notif.is_read && notif.id !== 'UPGRADE-PERSISTENT' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-semibold group"
                    >
                      <span>View Details</span>
                      <ExternalLink
                        size={11}
                        className="ml-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
