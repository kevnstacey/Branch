// components/NotificationCenter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Notification, User, CheckIn } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  podMembers: User[];
  podCheckIns: CheckIn[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, podMembers, podCheckIns }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const getNotificationText = (notification: Notification) => {
    const fromUser = podMembers.find(m => m.id === notification.fromUserId);
    const checkIn = podCheckIns.find(c => c.id === notification.checkInId);
    if (!fromUser || !checkIn) return 'An update occurred.';

    const checkInOwner = podMembers.find(m => m.id === checkIn.userId);
    const postDescription = checkInOwner?.name === 'Kevin' ? `your post about "${checkIn.focus}"` : `a post by ${checkInOwner?.name}`;

    switch(notification.type) {
      case 'comment':
        return <p><span className="font-semibold">{fromUser.name}</span> commented on {postDescription}.</p>;
      case 'reaction':
        return <p><span className="font-semibold">{fromUser.name}</span> reacted to {postDescription}.</p>;
      default:
        return 'New notification.';
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-stone-200">
                <h3 className="text-sm font-semibold text-stone-800">Notifications</h3>
            </div>
            <ul className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notification => (
                    <li key={notification.id} className={`px-4 py-3 border-b border-stone-100 hover:bg-stone-50 ${!notification.read ? 'bg-emerald-50/50' : ''}`}>
                        <div className="text-sm text-stone-600">
                           {getNotificationText(notification)}
                        </div>
                        <p className="text-xs text-stone-400 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                    </li>
                )) : (
                    <li className="px-4 py-6 text-center text-sm text-stone-500">
                        No new notifications.
                    </li>
                )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
