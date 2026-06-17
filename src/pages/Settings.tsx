import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { 
  Globe, 
  Palette, 
  Shield, 
  UserCircle,
  ClipboardList,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { UserPermissions } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Settings: React.FC = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {} as UserPermissions;
  const isServer = currentUser.role === 'Administrador';

  const hasAccess = (key: keyof UserPermissions) => {
    if (isServer) return true;
    const perm = permissions[key];
    return perm === 'view' || perm === 'edit';
  };

  const systemItems = [
    { id: 'perfil', label: 'Meu Perfil', path: '/configuracoes/perfil', icon: Globe },
    { id: 'processamento', label: 'Processamento', path: '/configuracoes/processamento', icon: FileSpreadsheet },
    { id: 'logs', label: 'Logs', path: '/configuracoes/logs', icon: ClipboardList }
  ];

  const advancedItems = [
    { id: 'perfis', label: 'Perfis de Acesso', path: '/configuracoes/perfis', icon: Shield },
    { id: 'segmento', label: 'Segmento', path: '/configuracoes/segmento', icon: Layers } // Just using layers or settings icon
  ];

  const visibleSystemItems = systemItems.filter(item => hasAccess(item.id as keyof UserPermissions));
  // Note: we might need to assume 'segmento' acts as 'perfis' permission or Administrator only
  const visibleAdvancedItems = advancedItems.filter(item => {
    if (item.id === 'segmento') return isServer; // only admin? or let's make it everyone who can access settings or admin
    return hasAccess(item.id as keyof UserPermissions);
  });

  const allVisibleItems = [...visibleSystemItems, ...visibleAdvancedItems];
  const location = useLocation();

  if (allVisibleItems.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  // If visiting exact /configuracoes path, redirect to the first available section
  if (location.pathname === '/configuracoes' || location.pathname === '/configuracoes/') {
    return <Navigate to={allVisibleItems[0].path} replace />;
  }

  const renderNavSection = (items: typeof systemItems) => (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
              isActive 
                ? "bg-slate-200/50 dark:bg-slate-800 text-blue-600 dark:text-blue-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6 flex-1 flex flex-col h-full">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-slate-500 dark:text-slate-400">Personalize o sistema e gerencie preferências.</p>
      </header>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Settings Sidebar */}
        <div className="w-56 flex-shrink-0 space-y-8 overflow-y-auto pr-4">
          {visibleSystemItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-4">
                Sistema
              </h3>
              {renderNavSection(visibleSystemItems)}
            </div>
          )}

          {visibleAdvancedItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-4">
                Configurações Avançadas
              </h3>
              {renderNavSection(visibleAdvancedItems)}
            </div>
          )}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
