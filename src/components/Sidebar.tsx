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
  AlertCircle,
  GraduationCap
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
    { icon: BarChart3, label: 'Dashboard', description: 'Visão geral do desempenho', path: '/dashboard', id: 'dashboard' },
    { icon: Layers, label: 'Monitorar', description: 'Acompanhar e avaliar qualidade', path: '/esteiras', id: 'esteiras' },
    { icon: Users, label: 'Analistas', description: 'Gestão da equipe de atendimento', path: '/analistas', id: 'analistas' },
    { icon: History, label: 'Histórico', description: 'Registro de monitorias concluídas', path: '/historico', id: 'historico' },
  ];

  const hasSettingsAccess = user.role === 'Administrador' || ['perfil', 'perfis', 'logs', 'processamento'].some(
    p => permissions[p as keyof UserPermissions] === 'view' || permissions[p as keyof UserPermissions] === 'edit'
  );

  const visibleItems = menuItems.filter(item => {
    if (user.role === 'Administrador') return true;
    const perm = permissions[item.id as keyof UserPermissions];
    return perm === 'view' || perm === 'edit';
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-screen flex flex-col sticky top-0 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 overflow-hidden ${isHovered ? 'w-64 shadow-2xl shadow-black/10' : 'w-[88px]'}`}
      >
        <div className={`h-16 border-b border-slate-200 dark:border-slate-800 flex items-center shrink-0 ${isHovered ? 'gap-3 px-6' : 'justify-center'}`}>
          <GraduationCap className="text-blue-600 dark:text-blue-400 w-8 h-8 shrink-0" />
          <h1 className={`text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>Analista Academy</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 p-3 rounded-md transition-all duration-200 group relative",
                isActive 
                  ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white",
                !isHovered && "justify-center"
              )}
              title={!isHovered ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-slate-300")} />
                  <span className={`flex flex-col whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                    <span>{item.label}</span>
                    {item.description && (
                      <span className={cn("text-[10px] leading-tight mt-0.5", isActive ? "text-blue-500 dark:text-blue-300 font-medium" : "text-slate-400 dark:text-slate-500")}>
                        {item.description}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shrink-0">
          <div className={`flex items-center gap-3 ${isHovered ? 'px-2' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold uppercase shrink-0">
              {user.name && typeof user.name === 'string' ? user.name.charAt(0) : '?'}
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${isHovered ? 'justify-between px-2' : 'flex-col'}`}>
            <div className={`flex px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 select-none whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
              {localStorage.getItem('segment') || 'PJ'}
            </div>
            
            <div className={`flex items-center ${isHovered ? 'gap-2' : 'flex-col gap-2'}`}>
              {hasSettingsAccess && (
                <NavLink
                  to="/configuracoes"
                  className={({ isActive }) => cn(
                    "p-2 rounded-md transition-colors",
                    isActive ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                  title="Configurações"
                >
                  <Settings className="w-5 h-5 shrink-0" />
                </NavLink>
              )}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Sair"
                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-800 max-w-sm w-full"
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
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors"
                >
                  Confirmar Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
    </>
  );
};
