'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { getFreemiumStatusAction } from '@/actions/profileActions';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // Add new notification to top of list
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      let finalData = [...data];
      const freemiumStatus = await getFreemiumStatusAction(user.id);
      
      if (freemiumStatus.isLocked) {
        finalData.unshift({
          id: 'UPGRADE-PERSISTENT',
          user_id: user.id,
          title: 'Action Required: Upgrade Account',
          message: freemiumStatus.reason,
          type: 'UPGRADE_REQUIRED',
          is_read: false,
          link: '/portfolio/upload',
          created_at: new Date().toISOString(),
        });
      }

      setNotifications(finalData);
      setUnreadCount(finalData.filter((n) => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    if (id === 'UPGRADE-PERSISTENT') return; // Cannot be marked as read until they actually upgrade

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setNotifications((prev) => 
      prev.map((n) => (n.id === 'UPGRADE-PERSISTENT' ? n : { ...n, is_read: true }))
    );
    
    // Check if the persistent one is there so we keep unreadCount = 1
    setUnreadCount((prev) => {
      const hasPersistent = notifications.some(n => n.id === 'UPGRADE-PERSISTENT');
      return hasPersistent ? 1 : 0;
    });

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  return (
    <div className="relative flex items-center mr-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.is_read ? (notif.id === 'UPGRADE-PERSISTENT' ? 'bg-amber-50/50' : 'bg-blue-50/50') : ''
                  }`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-semibold flex items-center gap-1.5 ${notif.id === 'UPGRADE-PERSISTENT' ? 'text-amber-700' : 'text-gray-900'}`}>
                      {notif.id === 'UPGRADE-PERSISTENT' && <AlertTriangle size={14} className="text-amber-600" />}
                      {notif.title}
                    </p>
                    {!notif.is_read && notif.id !== 'UPGRADE-PERSISTENT' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {notif.message}
                  </p>
                  
                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium group"
                    >
                      View Details
                      <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
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
