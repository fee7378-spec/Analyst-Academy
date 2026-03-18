import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  CheckCircle2,
  Moon,
  Sun,
  Eye,
  Pencil,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'nova-monitoria', label: 'Nova Monitoria' },
  { id: 'supervisores', label: 'Supervisores' },
  { id: 'analistas', label: 'Analistas' },
  { id: 'historico', label: 'Histórico' },
  { id: 'logs', label: 'Log de Atividades' },
  { id: 'perfis', label: 'Perfis de acesso' },
  { id: 'perfil', label: 'Meu Perfil' },
];

export const Profile: React.FC = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    api.getUser(currentUser.id).then((data: any) => {
      setUser(data);
    }).catch(err => {
      console.error(err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
          <p className="text-slate-500 dark:text-slate-400">Visualize suas informações pessoais e permissões de acesso</p>
        </div>
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <UserIcon className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              {user.role}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              Status da Conta
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">E-mail</span>
                <span className="font-medium truncate max-w-[150px]" title={user.email}>{user.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cadastro</span>
                <span className="font-medium">{user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : 'N/A'}</span>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 italic">
                  Sua conta é monitorada para fins de segurança e rastreabilidade. Para alterar seus dados ou permissões, contate um Administrador.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-blue-500" />
              Suas Permissões de Acesso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES.filter(module => {
                const level = user.permissions?.[module.id as keyof typeof user.permissions] || 'none';
                return user.role === 'Administrador' || level !== 'none';
              }).map(module => {
                const level = user.permissions?.[module.id as keyof typeof user.permissions] || 'none';
                
                return (
                  <div 
                    key={module.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {module.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {level === 'none' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          <XCircle className="w-3 h-3" /> Sem Acesso
                        </span>
                      )}
                      {level === 'view' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                          <Eye className="w-3 h-3" /> Visualizar
                        </span>
                      )}
                      {level === 'edit' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                          <Pencil className="w-3 h-3" /> Editar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
