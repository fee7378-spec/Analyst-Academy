import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
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

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analysesData, analystsData, supervisorsData, tracksData] = await Promise.all([
          api.getAnalyses(),
          canViewAnalysts ? api.getAnalysts() : Promise.resolve([]),
          canViewAnalysts ? api.getSupervisors() : Promise.resolve([]),
          api.getTracks()
        ]);
        
        setRawAnalyses(analysesData);
        setTracks(tracksData);
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

  useEffect(() => {
    if (!rawAnalyses) return;

    let filtered = [...rawAnalyses];

    if (filters.start_date) {
      filtered = filtered.filter(a => a.treatment_date >= filters.start_date);
    }
    if (filters.end_date) {
      filtered = filtered.filter(a => a.treatment_date <= filters.end_date);
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

    let currentDay = new Date(startDate);
    let weekNumber = 1;

    while (currentDay <= endDate) {
      const dayStr = `${String(currentDay.getDate()).padStart(2, '0')}/${String(currentDay.getMonth() + 1).padStart(2, '0')}`;
      
      const dayAnalyses = filtered.filter(a => {
        if (!a.treatment_date) return false;
        const parts = String(a.treatment_date).split('-');
        if (parts.length !== 3) return false;
        const [y, m, d] = parts.map(Number);
        return d === currentDay.getDate() && (m - 1) === currentDay.getMonth() && y === currentDay.getFullYear();
      });

      evolution.push({
        date: dayStr,
        week: `Semana ${weekNumber}`,
        count: dayAnalyses.length,
        errors: dayAnalyses.filter(a => a.status === 'Sim').length,
      });

      currentDay.setDate(currentDay.getDate() + 1);
      if (currentDay.getDay() === 0) { // Sunday starts a new week
        weekNumber++;
      }
    }

    setData({
      totalAnalyses,
      byStatus,
      errorsByType,
      errorsByTag,
      evolution
    } as any);

  }, [rawAnalyses, filters, analysts]);

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
    { label: 'Total de Monitorias', value: total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Qualidade', value: `${qualidade}%`, icon: Award, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Erros', value: comErro, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

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

            {(canViewAnalysts || individualMode) && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Users className="w-4 h-4 text-slate-400" />
                <select 
                  value={filters.analyst_id}
                  onChange={e => setFilters({...filters, analyst_id: e.target.value})}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
                >
                  <option value="" className="dark:bg-slate-900">{individualMode ? 'Selecione um Analista' : 'Todos os Analistas'}</option>
                  {analysts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-900">{a.name}</option>)}
                </select>
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
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
        {/* Evolução Semanal Combinada */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Evolução Semanal
          </h3>
          <div className="h-52">
            {(data?.evolution?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolution}>
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
                    content={({ active, payload, label }) => {
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
                    content={({ payload }) => {
                      // Ensure Monitoria is always displayed first in the legend
                      const sortedPayload = payload ? [...payload].sort((a, b) => {
                        if (a.value === 'Monitoria') return -1;
                        if (b.value === 'Monitoria') return 1;
                        return 0;
                      }) : [];
                      
                      return (
                        <div className="flex flex-col gap-1 mb-4">
                          {sortedPayload.map((entry: any, index: number) => (
                            <div key={`item-${index}`} className="flex items-center gap-2 justify-end">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Line name="Erros" type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line name="Monitoria" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>

        {/* Erro por Tipo de Demanda */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Erro por Tipo de Demanda
          </h3>
          <div className="h-52">
            {(data?.errorsByType?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.errorsByType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="demand_type" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} padding={{ top: 30 }} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [value, 'Quant']}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="count" position="top" fill="#64748b" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>

        {/* Ranking de Tags de Erro */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            Ranking de Tags de Erro
          </h3>
          <div className="h-52">
            {(data?.errorsByTag?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.errorsByTag}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="tag" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} padding={{ top: 30 }} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [value, 'Quant']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="count" position="top" fill="#64748b" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
};
