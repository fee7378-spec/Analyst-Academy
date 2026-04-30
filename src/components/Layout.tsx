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
      <main className="flex-1 p-8 overflow-auto flex flex-col">
        <div className="max-w-7xl mx-auto flex-1 w-full">
          <Outlet context={{ user: currentUser }} />
        </div>
        <footer className="mt-8 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-400 dark:text-slate-600 text-xs font-medium">
            © Developed by Felipe Nascimento
          </p>
        </footer>
      </main>
    </div>
  );
};
