import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ActivityLog } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Clock, 
  RefreshCw,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPeriod, setClearPeriod] = useState('7');
  const [clearing, setClearing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEditLogs = permissions['logs'] === 'edit';

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLoading(true);
    api.getLogs().then(setLogs).finally(() => setLoading(false));
  };

  const handleExport = async () => {
    try {
      if (!filteredLogs || filteredLogs.length === 0) {
        toast.error('Não há logs para exportar.');
        return;
      }

      const headers = ['Data/Hora', 'Usuário', 'Ação', 'Módulo', 'Detalhes'];
      const csvContent = [
        headers.join(';'),
        ...filteredLogs.map(log => [
          log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss') : '',
          log.user_name,
          log.action_type,
          log.module,
          log.details ? `"${log.details.replace(/"/g, '""')}"` : ''
        ].join(';'))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Exportação realizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar logs');
    }
  };

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      await api.deleteLogs(clearPeriod);
      toast.success('Logs limpos com sucesso!');
      setShowClearModal(false);
      loadLogs();
    } catch (err) {
      toast.error('Erro ao limpar logs');
    } finally {
      setClearing(false);
    }
  };

  const filteredLogs = Array.isArray(logs) ? logs.filter(log => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.record_id?.includes(searchTerm);
    const matchesAction = actionFilter ? log.action_type === actionFilter : true;
    const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
    const matchesDate = (dateFilter.start ? logDate >= dateFilter.start : true) && 
                        (dateFilter.end ? logDate <= dateFilter.end : true);
    return matchesSearch && matchesAction && matchesDate;
  }) : [];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Criação': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Edição': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Exclusão': return 'text-red-600 bg-red-50 border-red-100';
      case 'Exportação': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Log de Atividades</h1>
          <p className="text-slate-500 dark:text-slate-400">Rastreabilidade completa de todas as ações no sistema</p>
        </div>
        {canEditLogs && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowClearModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 text-sm font-bold"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Logs
            </button>
            <button 
              onClick={handleExport}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 text-sm font-bold"
            >
              <Download className="w-5 h-5" />
              Exportar Logs
            </button>
          </div>
        )}
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center">
        <button 
          onClick={loadLogs}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
          title="Atualizar Logs"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por usuário, módulo ou ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <input 
            type="date"
            value={dateFilter.start}
            onChange={e => setDateFilter({...dateFilter, start: e.target.value})}
            className="bg-transparent text-xs outline-none dark:text-white"
          />
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <input 
            type="date"
            value={dateFilter.end}
            onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
            className="bg-transparent text-xs outline-none dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
          >
            <option value="" className="dark:bg-slate-900">Todas as Ações</option>
            <option className="dark:bg-slate-900">Criação</option>
            <option className="dark:bg-slate-900">Edição</option>
            <option className="dark:bg-slate-900">Exclusão</option>
            <option className="dark:bg-slate-900">Exportação</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data e Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Módulo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        {log.user_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{log.user_name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">{log.user_role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.module}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{log.user_email || 'N/A'}</div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">
                    Nenhum log de atividade encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Limpar Logs */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Limpar Logs
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Período para apagar
                  </label>
                  <select
                    value={clearPeriod}
                    onChange={(e) => setClearPeriod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="7">Mais antigos que 7 dias</option>
                    <option value="15">Mais antigos que 15 dias</option>
                    <option value="30">Mais antigos que 30 dias</option>
                    <option value="all">Apagar todo o período</option>
                  </select>
                </div>
                
                <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                  Atenção: Esta ação é irreversível. Os logs apagados não poderão ser recuperados.
                </p>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    disabled={clearing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {clearing ? 'Apagando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
