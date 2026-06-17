import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FilePlus, 
  History, 
  BarChart3, 
  Users, 
  UserCheck,
  ClipboardList, 
  LogOut,
  UserCircle,
  Shield,
  Layers,
  Plus,
  FileSpreadsheet,
  Settings,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, UserPermissions } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const permissions = user.permissions || {} as UserPermissions;

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
    { icon: FilePlus, label: 'Monitorar', path: '/nova-analise', id: 'nova-monitoria' },
    { icon: Layers, label: 'Esteiras', path: '/esteiras', id: 'esteiras' },
    { icon: Users, label: 'Analistas', path: '/analistas', id: 'analistas' },
    { icon: History, label: 'Histórico', path: '/historico', id: 'historico' },
    // Removed specific settings options from here
  ];

  const hasSettingsAccess = user.role === 'Administrador' || ['perfil', 'perfis', 'logs', 'processamento'].some(
    p => permissions[p as keyof UserPermissions] === 'view' || permissions[p as keyof UserPermissions] === 'edit'
  );

  const visibleItems = menuItems.filter(item => {
    if (user.role === 'Administrador') return true;
    const perm = permissions[item.id as keyof UserPermissions];
    return perm === 'view' || perm === 'edit';
  });

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-blue-400">Analista Academy</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{user.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-blue-500/10 text-blue-400 border-l-4 border-blue-500" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold uppercase shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="flex px-2 py-1 text-xs font-bold bg-slate-800 text-slate-300 rounded-lg border border-slate-700 select-none">
            {localStorage.getItem('segment') || 'PJ'}
          </div>
          <div className="w-px h-4 bg-slate-800 hidden sm:block"></div>
          {hasSettingsAccess && (
            <NavLink
              to="/configuracoes"
              className={({ isActive }) => cn(
                "p-2 rounded-lg transition-colors",
                isActive ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </NavLink>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Sair"
            className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full"
            >
              <div className="flex justify-center mb-4 text-red-500">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                Deseja realmente sair?
              </h3>
              <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                Você será desconectado da sua conta e precisará fazer login novamente para acessar o sistema.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                  Confirmar Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
};
