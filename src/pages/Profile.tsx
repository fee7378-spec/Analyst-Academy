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
  History,
  Key,
  Clock,
  Briefcase,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const Profile: React.FC = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [logs, setLogs] = useState<any[]>([]);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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

    api.getLogs().then(allLogs => {
      const userLogs = allLogs.filter(log => log.user_email === currentUser.email).slice(0, 5);
      setLogs(userLogs);
    });

    const authUser = auth.currentUser;
    if (authUser?.metadata.lastSignInTime) {
      setLastSignIn(new Date(authUser.metadata.lastSignInTime).toLocaleString('pt-BR'));
    }
  }, [currentUser.email, currentUser.id]);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    try {
      await api.resetPassword(user.email);
      toast.success('E-mail de redefinição enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    } finally {
      setIsResetting(false);
    }
  };

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
          <p className="text-slate-500 dark:text-slate-400">Visualize suas informações pessoais, atividades recentes e configurações de segurança</p>
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

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-blue-500" />
              Atividade Recente
            </h3>
            
            <div className="space-y-4">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {log.action_type}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {log.details}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {format(new Date(log.timestamp), 'HH:mm')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {format(new Date(log.timestamp), 'dd/MM')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma atividade recente registrada.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-emerald-500" />
                Segurança
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Último Acesso</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{lastSignIn || 'N/A'}</span>
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isResetting ? 'Enviando...' : 'Redefinir Senha'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Profissional
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Matrícula</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{user.matricula}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Esteira</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{user.esteira || 'N/A'}</span>
                </div>
                {user.supervisor && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Supervisor</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{user.supervisor}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-blue-500">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
