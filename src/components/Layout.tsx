import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { api } from '../lib/api';
import { Bell, Check } from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const [currentUser, setCurrentUser] = useState<any>(userStr ? JSON.parse(userStr) : null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      if (currentUser?.email) {
        const notifs = await api.getNotifications(currentUser.email);
        setNotifications(notifs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    
    // Fetch latest user data from DB
    const fetchUser = async () => {
      try {
        const latestUser = await api.getUser(currentUser.id);
        if (isMounted && latestUser) {
          // Compare stringified versions to detect changes
          if (JSON.stringify(latestUser) !== JSON.stringify(currentUser)) {
            localStorage.setItem('user', JSON.stringify(latestUser));
            setCurrentUser(latestUser);
          }
        }
      } catch (err) {
        // If user was deleted or error, maybe log them out or just continue
        console.error('Failed to sync user data', err);
      }
    };

    fetchUser();
    fetchNotifications();
    
    // Set up a polling or refresh mechanism? Polling every 15s is safe
    const interval = setInterval(() => {
      fetchUser();
      fetchNotifications();
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.email]);

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar user={currentUser} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 relative">
          <div id="topbar-left" className="flex items-center gap-4 flex-1"></div>
          <div className="flex items-center gap-4">
            <div id="topbar-right" className="flex items-center gap-4"></div>
            
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 flex flex-col max-h-[400px]">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notificações</h3>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{unreadCount} novas</span>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className={`text-sm ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <button 
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-0.5 rounded"
                                  title="Marcar como lida"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500">
                              <span>{new Date(notif.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma notificação no momento</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                }
                // Dispatch event so other components can know
                window.dispatchEvent(new Event('themechange'));
              }}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Trocar tema"
            >
              <svg className="w-5 h-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg className="w-5 h-5 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto flex flex-col p-8">
          <div className="max-w-7xl mx-auto flex-1 w-full">
            <Outlet context={{ user: currentUser }} />
          </div>
          <footer className="mt-auto pt-6 text-center shrink-0">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              © Developed by Felipe Nascimento
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
