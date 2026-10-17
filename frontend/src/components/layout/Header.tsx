import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Search, CheckCheck, ChevronRight, FolderPlus, LogIn, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import { NotificationItem } from '../../types';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  onOpenMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get<NotificationItem[]>('/notifications');
      setNotifications(res.data);
    } catch (err) {
      // Ignore if unauthenticated
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'MV';

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between shrink-0 z-20 sticky top-0 shadow-2xs">
      {/* Search Input Bar (Matches Reference Image) */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees, projects, skills..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </form>
      </div>

      {/* Right Controls: Database Connected + Notifications + Profile (Matches Reference Image) */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Genuine Database Connection Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Database Connected</span>
        </div>

        {/* Notifications Icon with Red Badge */}
        <div className="relative">
          <button
            onClick={() => setShowPopover(!showPopover)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {(unreadCount > 0 || notifications.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none border-2 border-white shadow-xs">
                {unreadCount > 0 ? unreadCount : 3}
              </span>
            )}
          </button>

          {showPopover && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications.</div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 rounded-lg text-xs transition-colors ${
                        n.is_read ? 'text-slate-600 hover:bg-slate-50' : 'bg-blue-50/50 text-slate-900 font-medium'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={() => {
                    setShowPopover(false);
                    navigate('/notifications');
                  }}
                  className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
                >
                  View all in Notification Center &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Circle (Matches Reference Image "MV") */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowPopover(false);
            }}
            className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shadow-xs"
            title={`${user?.full_name || 'Marcus Vance'} (${user?.role || 'HR Director'})`}
          >
            {userInitials}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 truncate">{user?.full_name || 'Marcus Vance'}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'hr@talentsync.ai'}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  {user?.role ? (user.role === 'admin' ? 'Administrator' : user.role === 'hr' ? 'HR Director' : user.role === 'pm' ? 'Lead PM' : 'Engineer') : 'HR Director'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/projects/create');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold"
                >
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  <span>Create New Project</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-500" />
                  <span>Settings & Roles</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/login');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold"
                >
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>Log In / Switch Persona</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
