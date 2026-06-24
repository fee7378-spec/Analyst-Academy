import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, normalizeString } from '../lib/api';
import { User } from '../types';
import { 
  Plus, 
  Search, 
  UserCheck, 
  Calendar, 
  Briefcase, 
  Edit2, 
  UserPlus,
  ArrowRight,
  Hash,
  RefreshCw,
  Trash2,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Award,
  FileText,
  FilterX,
  X
} from 'lucide-react';
import { formatLocalDate, getTodayForInput } from '../utils/date';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList,
  Cell,
  PieChart as RePieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface AnalystStats {
  monitorings: number;
  errors: number;
  quality: number;
  productivity: number;
}

export const Analysts: React.FC = () => {
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState<User | null>(null);
  const [editingAnalyst, setEditingAnalyst] = useState<User | null>(null);
  const [analystToDelete, setAnalystToDelete] = useState<number | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  const [topbarLeft, setTopbarLeft] = useState<Element | null>(null);
  const [topbarRight, setTopbarRight] = useState<Element | null>(null);

  useEffect(() => {
    setTopbarLeft(document.getElementById('topbar-left'));
    setTopbarRight(document.getElementById('topbar-right'));
  }, []);
  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    matricula: '',
    admission_date: getTodayForInput(),
    esteira: ''
  });
  
  const [weekTooltip, setWeekTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    week: string;
    monitorias?: number;
    erros?: number;
    produtividade?: number;
  } | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEdit = currentUser.role === 'Administrador' || permissions['analistas'] === 'edit';
  const canViewStats = canEdit || permissions['analistas'] === 'view';

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setShowStatsModal(false);
        setAnalystToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analystsData, tracksData, analysesData, consolidated] = await Promise.all([
        api.getAnalysts(),
        api.getTracks(),
        api.getAnalyses(),
        api.getConsolidatedData()
      ]);
      setAnalysts(analystsData);
      setTracks(tracksData);
      setAnalyses(analysesData);
      setConsolidatedData(consolidated);

      if (tracksData.length > 0) {
        setFormData(prev => ({ ...prev, esteira: tracksData[0].name }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    
    // Check for duplicates
    const isDuplicate = analysts.some(a => 
      (a.name === formData.name || a.matricula === formData.matricula) && 
      (!editingAnalyst || a.id !== editingAnalyst.id)
    );

    if (isDuplicate) {
      toast.error('Já existe um analista com este nome ou login');
      return;
    }

    setSaving(true);
    try {
      if (editingAnalyst) {
        await api.updateAnalyst(editingAnalyst.id, formData);
        toast.success('Analista atualizado com sucesso');
      } else {
        await api.createAnalyst(formData);
        toast.success('Analista criado com sucesso');
      }
      setShowModal(false);
      setEditingAnalyst(null);
      loadData();
      resetForm();
    } catch (err) {
      toast.error('Erro ao salvar analista');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      matricula: '',
      admission_date: getTodayForInput(),
      esteira: tracks.length > 0 ? tracks[0].name : ''
    });
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    try {
      await api.deleteAnalyst(id);
      toast.success('Analista excluído com sucesso');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir analista');
    }
  };

  const handleEdit = (analyst: User) => {
    setEditingAnalyst(analyst);
    setFormData({
      name: analyst.name,
      matricula: analyst.matricula,
      admission_date: analyst.admission_date || getTodayForInput(),
      esteira: analyst.esteira || (tracks.length > 0 ? tracks[0].name : '')
    });
    setShowModal(true);
  };

  const getAnalystStats = (analyst: User): AnalystStats => {
    const analystMonitorings = analyses.filter(a => Number(a.analyst_id) === analyst.id);
    const analystErrors = analystMonitorings.filter(a => a.status === 'Sim').length;
    const quality = analystMonitorings.length > 0 
      ? ((analystMonitorings.length - analystErrors) / analystMonitorings.length) * 100 
      : 100;

    // Use productivity map from analyst object if available
    let analystProductivity = 0;
    if (analyst.productivity) {
      analystProductivity = Object.values(analyst.productivity).reduce((acc: number, val: any) => acc + Number(val), 0);
    } else {
      // Fallback to consolidatedData if productivity map is not yet populated
      const normalizedAnalystName = normalizeString(analyst.name);
      const cData = Array.isArray(consolidatedData) ? consolidatedData : [];
      analystProductivity = cData.filter((c: any) => c && c.analyst && normalizeString(String(c.analyst)) === normalizedAnalystName).length;
    }

    return {
      monitorings: analystMonitorings.length,
      errors: analystErrors,
      quality: Math.round(quality),
      productivity: analystProductivity
    };
  };

  const getAnalystEvolution = (analyst: User, type: 'monitoria' | 'produtividade') => {
    const analystMonitorings = analyses.filter(a => Number(a.analyst_id) === analyst.id);
    const normalizedAnalystName = normalizeString(analyst.name);
    
    // Determine date range based on type
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const processDate = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return;
      // Ensure we treat the date as YYYY-MM-DD correctly
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!minDate || date < minDate) minDate = new Date(date);
      if (!maxDate || date > maxDate) maxDate = new Date(date);
    };

    if (type === 'monitoria') {
      analystMonitorings.forEach(a => {
        if (a.treatment_date) processDate(String(a.treatment_date));
      });
    } else {
      if (analyst.productivity) {
        Object.entries(analyst.productivity).forEach(([dateStr, value]) => {
          if (value > 0) {
            processDate(dateStr);
          }
        });
      } else {
        const cData = Array.isArray(consolidatedData) ? consolidatedData : [];
        cData.forEach((c: any) => {
          if (c && c.analyst && normalizeString(String(c.analyst)) === normalizedAnalystName && c.date) {
            processDate(c.date);
          }
        });
      }
    }

    if (!minDate || !maxDate) return [];

    const evolution = [];
    let currentDay = new Date(minDate);
    let weekNumber = 1;
    let daysCount = 0;

    const targetMaxDate = new Date(maxDate);
    targetMaxDate.setHours(0, 0, 0, 0);

    while (currentDay <= targetMaxDate) {
      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;
      const dayStr = `${day}/${month}`;
      
      const dayAnalyses = analystMonitorings.filter(a => a.treatment_date === dayKey);
      let dayProductivity = 0;
      if (analyst.productivity) {
        dayProductivity = analyst.productivity[dayKey] || 0;
      } else {
        const cData = Array.isArray(consolidatedData) ? consolidatedData : [];
        dayProductivity = cData.filter((c: any) => c && c.analyst && normalizeString(String(c.analyst)) === normalizedAnalystName && c.date === dayKey).length;
      }

      evolution.push({
        date: dayStr,
        week: `Semana ${weekNumber}`,
        count: dayAnalyses.length,
        errors: dayAnalyses.filter(a => a.status === 'Sim').length,
        productivity: dayProductivity
      });

      currentDay.setDate(currentDay.getDate() + 1);
      daysCount++;
      if (daysCount % 7 === 0) {
        weekNumber++;
      }
    }
    if (type === 'produtividade') {
      return evolution.filter(item => item.productivity > 0);
    }
    return evolution;
  };

  const getAnalystErrorStats = (analyst: User) => {
    const analystErrors = analyses.filter(a => Number(a.analyst_id) === analyst.id && a.status === 'Sim');
    
    const errorsByTagMap = analystErrors.filter(a => a.tag).reduce((acc: any, a: any) => {
      const tag = a.tag;
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    const errorsByTag = Object.entries(errorsByTagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number));

    return { errorsByTag };
  };

  const filteredAnalysts = Array.isArray(analysts) ? analysts.filter(a => {
    const search = (searchTerm || '').toLowerCase();
    const searchMatch = String(a.name || '').toLowerCase().includes(search) || 
           String(a.matricula || '').toLowerCase().includes(search);
    const trackMatch = selectedTrackFilter ? a.esteira === selectedTrackFilter : true;
    return searchMatch && trackMatch;
  }) : [];

  return (
    <div className="space-y-6">
      {topbarLeft && createPortal(
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analistas</h1>
          {canEdit && (
            <button 
              onClick={() => { setShowModal(true); setEditingAnalyst(null); resetForm(); }}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 border border-transparent shadow-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-all text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Novo
            </button>
          )}
        </div>,
        topbarLeft
      )}

      {topbarRight && createPortal(
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-all"
            title="Atualizar Analistas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {(searchTerm || selectedTrackFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTrackFilter('');
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all shrink-0"
              title="Limpar Filtros"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative w-48 shrink-0">
            <select
              value={selectedTrackFilter}
              onChange={(e) => setSelectedTrackFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm dark:text-white appearance-none"
            >
              <option value="">Todas as Esteiras</option>
              {tracks.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm dark:text-white"
            />
          </div>
        </div>,
        topbarRight
      )}

      <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <div className="flex items-center px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="flex-1">Analista</div>
          <div className="w-48 px-4">Esteira</div>
          <div className="w-40 px-4">Status de Acesso</div>
          <div className="w-32 px-4 text-right">Ações</div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredAnalysts.slice(0, visibleCount).map((analyst, index) => (
            <motion.div
              key={analyst.id || `analyst-${index}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {analyst.name && typeof analyst.name === 'string' ? `${analyst.name.split(' ')[0][0]}${analyst.name.split(' ').length > 1 ? analyst.name.split(' ')[1][0] : ''}`.toUpperCase() : '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate" title={analyst.name}>{analyst.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={analyst.matricula}>{analyst.matricula}</p>
                </div>
              </div>
              
              <div className="w-48 px-4 shrink-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-full">
                  {analyst.esteira}
                </span>
              </div>
              
              <div className="w-40 px-4 shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  TUDO OK
                </span>
              </div>

              <div className="w-32 px-4 shrink-0 flex items-center justify-end gap-1">
                {canViewStats && (
                  <button 
                    onClick={() => { setSelectedAnalyst(analyst); setShowStatsModal(true); }}
                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all"
                    title="Ver Produtividade e Qualidade"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                )}
                {canEdit && (
                  <>
                    <button 
                      onClick={() => handleEdit(analyst)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setAnalystToDelete(analyst.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
          {filteredAnalysts.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              Nenhum analista encontrado.
            </div>
          )}
        </div>
      </div>

      {visibleCount < filteredAnalysts.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(prev => prev + 20)}
            className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
          >
            Carregar mais analistas
          </button>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-md shadow-lg overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingAnalyst ? 'Editar Analista' : 'Cadastrar Novo Analista'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <input 
                    required
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Login</label>
                  <input 
                    required
                    type="text"
                    value={formData.matricula || ''}
                    onChange={e => setFormData({...formData, matricula: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Esteira</label>
                  <select 
                    required
                    value={formData.esteira || ''}
                    onChange={e => setFormData({...formData, esteira: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  >
                    {tracks.map(t => (
                      <option key={t.id} value={t.name} className="dark:bg-slate-900">{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Data de Admissão</label>
                  <input 
                    type="date"
                    value={formData.admission_date || ''}
                    onChange={e => setFormData({...formData, admission_date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 border border-transparent shadow-sm transition-all font-bold shadow-lg shadow-slate-500/10 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : (editingAnalyst ? 'Atualizar Analista' : 'Salvar Analista')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatsModal && selectedAnalyst && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatsModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-md shadow-lg overflow-hidden border border-slate-100 dark:border-slate-800 my-8"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-white shadow-lg shadow-slate-500/10">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {selectedAnalyst.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Dashboard de Desempenho • {selectedAnalyst.esteira}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowStatsModal(false)} 
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all"
                >
                  <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                </button>
              </div>
              <div className="p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-100 dark:border-yellow-500/20 flex items-center gap-4">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-md text-yellow-600 dark:text-yellow-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-0.5">Produtividade</p>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{getAnalystStats(selectedAnalyst).productivity}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-100 dark:border-purple-500/20 flex items-center gap-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-md text-purple-600 dark:text-purple-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-0.5">Monitorias</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-blue-100">{getAnalystStats(selectedAnalyst).monitorings}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-4">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md text-emerald-600 dark:text-emerald-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Qualidade</p>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{getAnalystStats(selectedAnalyst).quality}%</p>
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20 flex items-center gap-4">
                      <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-md text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-0.5">Erros</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">{getAnalystStats(selectedAnalyst).errors}</p>
                      </div>
                    </div>
                  </div>

                {/* Charts */}
                <div className="space-y-6">
                  {/* Monitorias vs Erros */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 relative">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Monitorias vs Erros
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getAnalystEvolution(selectedAnalyst, 'monitoria')} margin={{ top: 20, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            tick={(props) => {
                              const evolution = getAnalystEvolution(selectedAnalyst, 'monitoria');
                              const { x, y, payload, index } = props;
                              const item = evolution[index];
                              if (!item) return null;
                              const isFirstOfWeek = index === 0 || evolution[index - 1].week !== item.week;
                              if (!isFirstOfWeek) return null;
                              
                              const weekData = evolution.filter((d: any) => d.week === item.week);
                              const weekMonitorias = weekData.reduce((acc: number, d: any) => acc + d.count, 0);
                              const weekErros = weekData.reduce((acc: number, d: any) => acc + d.errors, 0);

                              return (
                                <g 
                                  transform={`translate(${x},${y})`} 
                                  className="cursor-help"
                                  onMouseEnter={(e) => {
                                    setWeekTooltip({
                                      show: true,
                                      x: e.clientX,
                                      y: e.clientY,
                                      week: item.week,
                                      monitorias: weekMonitorias,
                                      erros: weekErros
                                    });
                                  }}
                                  onMouseMove={(e) => {
                                    setWeekTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                                  }}
                                  onMouseLeave={() => setWeekTooltip(null)}
                                >
                                  <rect x={-30} y={0} width={60} height={30} fill="transparent" pointerEvents="all" />
                                  <text
                                    x={0}
                                    y={0}
                                    dy={16}
                                    textAnchor="middle"
                                    fill="#475569"
                                    className="dark:fill-slate-300 font-bold text-[13px] hover:fill-blue-500 transition-colors"
                                    pointerEvents="none"
                                  >
                                    {item.week}
                                  </text>
                                </g>
                              );
                            }}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const dayData = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-lg text-xs min-w-[160px]">
                                    <p className="font-bold text-white mb-3 text-sm">{dayData.week} - {dayData.date}</p>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center gap-4">
                                        <span className="flex items-center gap-2 text-emerald-400">
                                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                          Monitorias
                                        </span>
                                        <span className="text-white font-bold">{dayData.count}</span>
                                      </div>
                                      <div className="flex justify-between items-center gap-4">
                                        <span className="flex items-center gap-2 text-red-400">
                                          <div className="w-2 h-2 rounded-full bg-red-400" />
                                          Erros
                                        </span>
                                        <span className="text-white font-bold">{dayData.errors}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            layout="horizontal"
                            wrapperStyle={{ 
                              top: -40,
                              right: -10,
                              fontSize: '14px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          />
                          <Line name="Monitorias" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={false} />
                          <Line name="Erros" type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={4} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Produtividade Diária */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 relative">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                      Produtividade Diária
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getAnalystEvolution(selectedAnalyst, 'produtividade')} margin={{ top: 20, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            tick={(props) => {
                              const evolution = getAnalystEvolution(selectedAnalyst, 'produtividade');
                              const { x, y, payload, index } = props;
                              const item = evolution[index];
                              if (!item) return null;
                              const isFirstOfWeek = index === 0 || evolution[index - 1].week !== item.week;
                              if (!isFirstOfWeek) return null;
                              
                              const weekData = evolution.filter((d: any) => d.week === item.week);
                              const weekProdutividade = weekData.reduce((acc: number, d: any) => acc + d.productivity, 0);

                              return (
                                <g 
                                  transform={`translate(${x},${y})`} 
                                  className="cursor-help"
                                  onMouseEnter={(e) => {
                                    setWeekTooltip({
                                      show: true,
                                      x: e.clientX,
                                      y: e.clientY,
                                      week: item.week,
                                      produtividade: Math.round(weekProdutividade * 10) / 10
                                    });
                                  }}
                                  onMouseMove={(e) => {
                                    setWeekTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                                  }}
                                  onMouseLeave={() => setWeekTooltip(null)}
                                >
                                  <rect x={-30} y={0} width={60} height={30} fill="transparent" pointerEvents="all" />
                                  <text
                                    x={0}
                                    y={0}
                                    dy={16}
                                    textAnchor="middle"
                                    fill="#475569"
                                    className="dark:fill-slate-300 font-bold text-[13px] hover:fill-blue-500 transition-colors"
                                    pointerEvents="none"
                                  >
                                    {item.week}
                                  </text>
                                </g>
                              );
                            }}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const dayData = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-lg text-xs min-w-[160px]">
                                    <p className="font-bold text-white mb-3 text-sm">{dayData.week} - {dayData.date}</p>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center gap-4">
                                        <span className="flex items-center gap-2 text-yellow-500">
                                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                          Produtividade
                                        </span>
                                        <span className="text-white font-bold">{dayData.productivity}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            layout="horizontal"
                            wrapperStyle={{ 
                              top: -40,
                              right: -10,
                              fontSize: '14px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          />
                          <Line name="Produtividade" type="monotone" dataKey="productivity" stroke="#eab308" strokeWidth={4} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 pb-6 px-1">
                    {/* Ranking de Tags de Erro */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-red-500" />
                        Ranking de Tags de Erro
                      </h3>
                      <div className="h-64 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        {getAnalystErrorStats(selectedAnalyst).errorsByTag.length > 0 ? (
                          <div className="h-full" style={{ minWidth: Math.max(800, getAnalystErrorStats(selectedAnalyst).errorsByTag.length * 250) }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ReBarChart data={getAnalystErrorStats(selectedAnalyst).errorsByTag} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis 
                                  dataKey="tag" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  interval={0}
                                  height={20}
                                  tick={(props) => {
                                    const { x, y, payload } = props;
                                    if (!payload.value) return null;
                                    return (
                                      <g transform={`translate(${x},${y})`}>
                                        <text
                                          x={0}
                                          y={0}
                                          dy={8}
                                          textAnchor="middle"
                                          fill="#64748b"
                                          fontSize={12}
                                          fontWeight="bold"
                                          className="dark:fill-slate-400"
                                        >
                                          {payload.value}
                                        </text>
                                      </g>
                                    );
                                  }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} padding={{ top: 30 }} />
                                <Tooltip cursor={false} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                  <LabelList dataKey="count" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
                                </Bar>
                              </ReBarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                            Nenhuma tag registrada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analystToDelete && (
          <ConfirmDialog
            isOpen={true}
            title="Excluir Analista"
            message="Tem certeza que deseja excluir este analista? Esta ação não pode ser desfeita."
            onConfirm={() => {
              handleDelete(analystToDelete);
              setAnalystToDelete(null);
            }}
            onCancel={() => setAnalystToDelete(null)}
          />
        )}
      </AnimatePresence>
      {weekTooltip && weekTooltip.show && (
        <div 
          className="fixed z-50 pointer-events-none bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-lg min-w-[160px] animate-in fade-in zoom-in-95 duration-200"
          style={{ left: weekTooltip.x + 15, top: weekTooltip.y + 15 }}
        >
          <p className="font-bold text-white mb-3 text-sm">{weekTooltip.week}</p>
          <div className="space-y-2">
            {weekTooltip.monitorias !== undefined && weekTooltip.erros !== undefined && (
              <>
                <div className="flex justify-between items-center gap-4">
                  <span className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    Monitorias
                  </span>
                  <span className="text-white font-bold">{weekTooltip.monitorias}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="flex items-center gap-2 text-red-400 text-xs font-medium">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    Erros
                  </span>
                  <span className="text-white font-bold">{weekTooltip.erros}</span>
                </div>
              </>
            )}
            {weekTooltip.produtividade !== undefined && (
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-2 text-yellow-500 text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Produtividade
                </span>
                <span className="text-white font-bold">{weekTooltip.produtividade}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
