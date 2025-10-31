// components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
// FIX: The CheckIn type is not used in this component.
import { Pod, User, Notification } from '../types';
import Avatar from './Avatar';

// FIX: Updated HeaderProps to match usage in App.tsx, removing demo-related props.
interface HeaderProps {
  activePod: Pod;
  currentUser: User;
  onViewChange: (view: 'my-dashboard' | string) => void;
  currentView: 'my-dashboard' | string;
  onNotificationClick: (notification: Notification) => void;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  onInvite: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activePod,
  currentUser,
  onViewChange,
  currentView,
  onNotificationClick,
  notifications,
  onMarkAllAsRead,
  onInvite,
}) => {
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const useOutsideAlerter = (ref: React.RefObject<HTMLDivElement>, close: () => void) => {
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          close();
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, close]);
  };

  useOutsideAlerter(userMenuRef, () => setUserMenuOpen(false));
  useOutsideAlerter(notificationRef, () => setNotificationOpen(false));
  useOutsideAlerter(mobileMenuRef, () => setMobileMenuOpen(false));
  
  const getNotificationText = (notification: Notification) => {
    const fromUser = activePod.members.find(m => m.id === notification.fromUserId);
    if (!fromUser) return 'An update occurred.';

    switch(notification.type) {
      case 'comment':
        return <p><span className="font-semibold">{fromUser.name}</span> commented on your post.</p>;
      case 'reaction':
        return <p><span className="font-semibold">{fromUser.name}</span> reacted to your post.</p>;
      default: return 'New notification.';
    }
  };

  const NavContent = () => (
    <>
      {/* User Dashboard Switcher */}
      <div className="relative" ref={userMenuRef}>
        <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-100">
            <Avatar user={currentUser} size="sm" />
            <span className="font-semibold text-stone-700">
                {currentView === 'my-dashboard' ? 'My Dashboard' : activePod.members.find(m => m.id === currentView)?.name}
            </span>
            <svg className={`w-4 h-4 text-stone-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isUserMenuOpen && (
             <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
             <div className="py-1">
               <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('my-dashboard'); setUserMenuOpen(false);}} className={`block px-4 py-2 text-sm ${currentView === 'my-dashboard' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-700 hover:bg-stone-100'}`}>My Dashboard</a>
               {activePod.members.filter(m => m.id !== currentUser.id).map(member => (
                 <a href="#" key={member.id} onClick={(e) => { e.preventDefault(); onViewChange(member.id); setUserMenuOpen(false); }} className={`block px-4 py-2 text-sm ${currentView === member.id ? 'bg-emerald-100 text-emerald-800' : 'text-stone-700 hover:bg-stone-100'}`}>
                   {member.name}'s Dashboard
                 </a>
               ))}
             </div>
           </div>
        )}
      </div>

      {/* FIX: Demo Mode Switcher and Pod selector removed to align with App.tsx's functionality */}
    </>
  );

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
             <a href="#" className="flex items-center space-x-2">
                <span className="text-2xl" role="img" aria-label="sprout">🌿</span>
                <span className="text-xl font-bold text-emerald-700">Branch</span>
             </a>
             <div className="hidden lg:flex items-center">
                <NavContent />
             </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button onClick={onInvite} className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50">
                + Invite
            </button>
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setNotificationOpen(!isNotificationOpen)} className="relative p-2 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span></span>}
              </button>
              {isNotificationOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 border-b border-stone-200 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-stone-800">Notifications</h3>
                    <button onClick={onMarkAllAsRead} disabled={unreadCount === 0} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:text-stone-400">Mark all as read</button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <li key={n.id} onClick={() => { onNotificationClick(n); setNotificationOpen(false); }} className={`px-4 py-3 border-b border-stone-100 hover:bg-stone-50 cursor-pointer ${!n.read ? 'bg-emerald-50/50' : ''}`}>
                        <div className="text-sm text-stone-600 flex items-start space-x-3">
                           <Avatar user={activePod.members.find(m => m.id === n.fromUserId)!} size="sm" />
                           <div>
                             {getNotificationText(n)}
                             <p className="text-xs text-stone-400 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
                           </div>
                        </div>
                      </li>
                    )) : <li className="px-4 py-6 text-center text-sm text-stone-500">No new notifications.</li>}
                  </ul>
                </div>
              )}
            </div>
            <div className="lg:hidden" ref={mobileMenuRef}>
                 <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full text-stone-500 hover:bg-stone-100">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                 {isMobileMenuOpen && (
                     <div className="origin-top-right absolute right-4 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 p-4 space-y-4">
                         <NavContent />
                     </div>
                 )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
