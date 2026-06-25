import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { api } from '../lib/api';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const [currentUser, setCurrentUser] = useState<any>(userStr ? JSON.parse(userStr) : null);
  
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
    
    // Set up a polling or refresh mechanism? Polling every 30s is safe
    const interval = setInterval(fetchUser, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar user={currentUser} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
          <div id="topbar-left" className="flex items-center gap-4 flex-1"></div>
          <div className="flex items-center gap-4">
            <div id="topbar-right" className="flex items-center gap-4"></div>
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
