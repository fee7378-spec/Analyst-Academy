import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto flex flex-col">
        <div className="max-w-7xl mx-auto flex-1 w-full">
          <Outlet />
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
