import React, { useEffect, useState } from 'react';
import { api, normalizeString } from '../lib/api';
import { DashboardData, User } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, LabelList 
} from 'recharts';
import { 
  Activity, 
  CheckCircle2, 
  TrendingUp,
  FileText,
  Layers,
  AlertCircle,
  Filter,
  Users,
  Award,
  BarChart3,
  UserCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export const Dashboard: React.FC<{ individualMode?: boolean }> = ({ individualMode = false }) => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [data, setData] = useState<DashboardData | null>(null);

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
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format to YYYY-MM-DD for input[type="date"]
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      track: '',
      analyst_id: '',
      supervisor_name: '',
      start_date: formatDate(firstDay),
      end_date: formatDate(lastDay)
    };
  });

  const [error, setError] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canViewAnalysts = currentUser.role === 'Administrador' || permissions['analistas'] !== 'none';

  const [rawAnalyses, setRawAnalyses] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If there were modals here, we would close them.
        // Dashboard doesn't seem to have modals in the current version, 
        // but we implement the listener for consistency if needed.
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analysesData, analystsData, supervisorsData, tracksData, consolidated] = await Promise.all([
          api.getAnalyses(),
          canViewAnalysts ? api.getAnalysts() : Promise.resolve([]),
          canViewAnalysts ? api.getSupervisors() : Promise.resolve([]),
          api.getTracks(),
          api.getConsolidatedData()
        ]);
        
        setRawAnalyses(analysesData);
        setTracks(tracksData);
        setConsolidatedData(consolidated);
        if (canViewAnalysts) {
          setAnalysts(analystsData);
          setSupervisors(supervisorsData);
        }
      } catch (err: any) {
        console.error("Failed to load initial data:", err);
        setError(err.message || "Falha ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [individualMode]);

  const toISODate = (dateStr: any) => {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyDash) return `${dmyDash[3]}-${dmyDash[2].padStart(2, '0')}-${dmyDash[1].padStart(2, '0')}`;
    return s;
  };

  useEffect(() => {
    if (!rawAnalyses) return;

    let filtered = [...rawAnalyses];

    if (filters.start_date) {
      filtered = filtered.filter(a => toISODate(a.treatment_date) >= filters.start_date);
    }
    if (filters.end_date) {
      filtered = filtered.filter(a => toISODate(a.treatment_date) <= filters.end_date);
    }
    if (filters.track) {
      filtered = filtered.filter(a => a.track === filters.track);
    }
    if (filters.analyst_id) {
      filtered = filtered.filter(a => String(a.analyst_id) === String(filters.analyst_id));
    }
    if (filters.supervisor_name) {
      filtered = filtered.filter(a => {
        const analyst = analysts.find(u => String(u.id) === String(a.analyst_id));
        return analyst && analyst.supervisor === filters.supervisor_name;
      });
    }

    const totalAnalyses = { count: filtered.length };

    const byStatusMap = filtered.reduce((acc: any, a: any) => {
      const status = a.status || 'Não';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

    const errorsByTypeMap = filtered.filter(a => a.status === 'Sim').reduce((acc: any, a: any) => {
      const type = a.demand_type || 'Desconhecido';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const errorsByType = Object.entries(errorsByTypeMap)
      .map(([demand_type, count]) => ({ demand_type, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number));

    const errorsByTagMap = filtered.filter(a => a.status === 'Sim' && a.tag).reduce((acc: any, a: any) => {
      const tag = a.tag;
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    const errorsByTag = Object.entries(errorsByTagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number));

    // Evolution
    const evolution = [];
    const now = new Date();
    
    const startDateStr = filters.start_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDateStr = filters.end_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T23:59:59');

    // Productivity calculation
    const analystMap = new Map<string, User>(analysts.map(a => [normalizeString(a.name), a]));
    let filteredConsolidated = [...consolidatedData].filter(c => c && c.analyst);
    
    // Filter by analyst presence in DB and apply filters
    filteredConsolidated = filteredConsolidated.filter(c => {
      const analyst = analystMap.get(normalizeString(c.analyst));
      if (!analyst) return false;

      // Filter by date
      if (filters.start_date && c.date < filters.start_date) return false;
      if (filters.end_date && c.date > filters.end_date) return false;

      // Filter by track (using analyst's current track as requested)
      if (filters.track && analyst.esteira !== filters.track) return false;

      // Filter by supervisor
      if (filters.supervisor_name && analyst.supervisor !== filters.supervisor_name) return false;

      // Filter by analyst_id
      if (filters.analyst_id && String(analyst.id) !== String(filters.analyst_id)) return false;

      return true;
    });

    let currentDay = new Date(startDate);
    let weekNumber = 1;

    while (currentDay <= endDate) {
      const dayStr = `${String(currentDay.getDate()).padStart(2, '0')}/${String(currentDay.getMonth() + 1).padStart(2, '0')}`;
      
      const dayAnalyses = filtered.filter(a => {
        const isoDate = toISODate(a.treatment_date);
        if (!isoDate) return false;
        const parts = isoDate.split('-');
        if (parts.length !== 3) return false;
        const [y, m, d] = parts.map(Number);
        return d === currentDay.getDate() && (m - 1) === currentDay.getMonth() && y === currentDay.getFullYear();
      });

      const dayKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
      const dayProductivity = filteredConsolidated.filter(c => c.date === dayKey).length;

      evolution.push({
        date: dayStr,
        week: `Semana ${weekNumber}`,
        count: dayAnalyses.length,
        errors: dayAnalyses.filter(a => a.status === 'Sim').length,
        productivity: dayProductivity
      });

      currentDay.setDate(currentDay.getDate() + 1);
      if (currentDay.getDay() === 0) { // Sunday starts a new week
        weekNumber++;
      }
    }

    const totalProductivity = filteredConsolidated.length;

    // Productivity by Track
    const productivityByTrackMap = filteredConsolidated.reduce((acc: any, c: any) => {
      const analyst = analystMap.get(normalizeString(c.analyst));
      const track = analyst?.esteira || c.track || 'Desconhecido';
      acc[track] = (acc[track] || 0) + 1;
      return acc;
    }, {});
    const productivityByTrack = Object.entries(productivityByTrackMap)
      .map(([track, count]) => ({ track, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number));

    // Productivity by Analyst
    const productivityByAnalystMap = filteredConsolidated.reduce((acc: any, c: any) => {
      const analystData = analystMap.get(normalizeString(c.analyst));
      const analystName = analystData?.name || c.analyst || 'Desconhecido';
      acc[analystName] = (acc[analystName] || 0) + 1;
      return acc;
    }, {});
    const productivityByAnalyst = Object.entries(productivityByAnalystMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number))
      .slice(0, 10);

    setData({
      totalAnalyses,
      byStatus,
      errorsByType,
      errorsByTag,
      evolution,
      totalProductivity,
      productivityByTrack,
      productivityByAnalyst
    } as any);

  }, [rawAnalyses, filters, analysts, consolidatedData]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysesData = await api.getAnalyses();
      setRawAnalyses(analysesData);
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      setError(err.message || "Falha ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Erro ao carregar Dashboard</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button 
          onClick={loadDashboard}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const total = data?.totalAnalyses?.count || 0;
  const semErro = data?.byStatus?.find(s => s.status === 'Não')?.count || 0;
  const comErro = data?.byStatus?.find(s => s.status === 'Sim')?.count || 0;
  const qualidade = total > 0 ? ((semErro / total) * 100).toFixed(1) : '0';

  const stats = [
    { label: 'Produtividade Total', value: data?.totalProductivity || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total de Monitorias', value: total, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Qualidade', value: `${qualidade}%`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Erros', value: comErro, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const gridCols = 'md:grid-cols-4';

  const EmptyState = ({ message = "Sem dados para exibir" }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
      <Activity className="w-8 h-8 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  const selectedAnalyst = analysts.find(a => a.id.toString() === filters.analyst_id);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {individualMode ? 'Análise Individual' : 'Dashboard de Monitoria'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {individualMode ? 'Desempenho detalhado por analista' : 'Visão geral do desempenho e qualidade'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={loadDashboard}
              disabled={loading}
              className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-500 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
              title="Atualizar Dashboard"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {!individualMode && (
              <>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <select 
                    value={filters.track}
                    onChange={e => setFilters({...filters, track: e.target.value})}
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
                  >
                    <option value="" className="dark:bg-slate-900">Todas as Esteiras</option>
                    {tracks.map(t => <option key={t.id} value={t.name} className="dark:bg-slate-900">{t.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  <select 
                    value={filters.supervisor_name}
                    onChange={e => setFilters({...filters, supervisor_name: e.target.value})}
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
                  >
                    <option value="" className="dark:bg-slate-900">Todas as Supervisões</option>
                    {supervisors.map(s => <option key={s.id} value={s.name} className="dark:bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {!individualMode && (
            <div className="flex justify-end items-center gap-3">
              <button 
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  const formatDate = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  setFilters({
                    track: '',
                    analyst_id: '',
                    supervisor_name: '',
                    start_date: formatDate(firstDay),
                    end_date: formatDate(lastDay)
                  });
                }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                Limpar Filtros
              </button>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Filter className="w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={filters.start_date}
                  onChange={e => setFilters({...filters, start_date: e.target.value})}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
                />
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <input 
                  type="date"
                  value={filters.end_date}
                  onChange={e => setFilters({...filters, end_date: e.target.value})}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {individualMode && selectedAnalyst && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-bold backdrop-blur-sm">
            {selectedAnalyst.name.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-1">{selectedAnalyst.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Login: {selectedAnalyst.matricula}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Esteira: {selectedAnalyst.esteira}
              </span>
              <span className="flex items-center gap-1.5">
                <UserCircle className="w-4 h-4" />
                Supervisor: {selectedAnalyst.supervisor}
              </span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10">
            <p className="text-blue-100 text-xs uppercase font-bold tracking-wider mb-1">Qualidade Geral</p>
            <p className="text-4xl font-black">{qualidade}%</p>
          </div>
        </motion.div>
      )}

      {/* Dashboard Sections */}
      <div className="space-y-12">
        {/* Monitoria Section */}
        <section className="space-y-6">
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-10`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Evolução Semanal Monitoria */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Evolução Semanal
              </h3>
              <div className="h-64">
                {(data?.evolution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.evolution} margin={{ top: 20, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        tickFormatter={(value, index) => {
                          const item = data.evolution[index];
                          if (index === 0 || data.evolution[index - 1].week !== item.week) {
                            return item.week;
                          }
                          return '';
                        }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dayData = payload[0].payload;
                            return (
                              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl text-xs min-w-[160px]">
                                <p className="font-bold text-white mb-3 text-sm">{dayData.week} - {dayData.date}</p>
                                <div className="space-y-2 mb-3">
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
                      <Line name="Erros" type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Line name="Monitoria" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyState />}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Erro por Tipo de Demanda */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Erro por Tipo de Demanda
                </h3>
                <div className="h-64 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {(data?.errorsByType?.length || 0) > 0 ? (
                    <div className="h-full" style={{ minWidth: Math.max(800, (data?.errorsByType?.length || 0) * 180) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.errorsByType} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                          <XAxis 
                            dataKey="demand_type" 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            height={40}
                            tick={(props) => {
                              const { x, y, payload } = props;
                              if (!payload.value) return null;
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text
                                    x={0}
                                    y={0}
                                    dy={20}
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
                          <Tooltip 
                            cursor={false}
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value: any) => [value, 'Quant']}
                          />
                          <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            <LabelList dataKey="count" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState />}
                </div>
              </div>

              {/* Ranking de Tags de Erro */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  Tags de Erro
                </h3>
                <div className="h-64 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {(data?.errorsByTag?.length || 0) > 0 ? (
                    <div className="h-full" style={{ minWidth: Math.max(800, (data?.errorsByTag?.length || 0) * 180) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.errorsByTag} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                          <XAxis 
                            dataKey="tag" 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            height={40}
                            tick={(props) => {
                              const { x, y, payload } = props;
                              if (!payload.value) return null;
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text
                                    x={0}
                                    y={0}
                                    dy={20}
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
                          <Tooltip 
                            cursor={false}
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value: any) => [value, 'Quant']}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            <LabelList dataKey="count" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState />}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
