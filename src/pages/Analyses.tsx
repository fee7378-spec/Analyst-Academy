import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, normalizeString } from '../lib/api';
import { Analysis, User, AnalysisStatus } from '../types';
import { 
  Search, 
  Filter, 
  FilterX,
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  Upload,
  X,
  Layers,
  Building2,
  Globe,
  Settings2,
  Wrench,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  Eye,
  FileText,
  Info,
  Wallet,
  Briefcase,
  Store,
  Star,
  TrendingUp,
  Box,
  Package,
  Archive,
  Database,
  Server,
  Cpu,
  Activity,
  Zap,
  Building,
  Settings,
  Hammer,
  FilePlus,
  Shield,
  Users,
  UserCheck,
  ClipboardList,
  PieChart,
  BarChart3,
  Target,
  Award,
  Lightbulb,
  Rocket,
  Compass,
  Check,
  Hammer,
  Send,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DEMAND_TYPES, TAGS, getIconDataById } from '../constants';
import { formatLocalDate, getTodayForInput } from '../utils/date';

export const Analyses: React.FC<{ mode: 'list' | 'form' }> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(mode === 'form');
  const [editingAnalysis, setEditingAnalysis] = useState<Analysis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isAnalystDropdownOpen, setIsAnalystDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);

  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setShowForm(mode === 'form');
    if (mode === 'form' && !editingAnalysis) {
      resetForm();
    }
  }, [mode]);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [clearPeriod, setClearPeriod] = useState('7');
  const [clearing, setClearing] = useState(false);
  const [importing, setImporting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEditHistorico = currentUser.role === 'Administrador' || permissions['historico'] === 'edit';
  const canClearHistorico = currentUser.role === 'Administrador';
  const canViewHistorico = currentUser.role === 'Administrador' || permissions['historico'] !== 'none';
  const canEditNovaMonitoria = currentUser.role === 'Administrador' || permissions['esteiras'] === 'edit';
  const canImportMonitoria = canEditNovaMonitoria || permissions['esteiras'] === 'view';
  const canViewAnalysts = currentUser.role === 'Administrador' || permissions['analistas'] !== 'none';
  const canContest = currentUser.role === 'Administrador' || currentUser.role === 'Supervisor' || permissions['contestacoes'] === 'edit';

  // Form State
  const [formData, setFormData] = useState({
    analyst_id: '',
    company_name: '',
    cnpj: '',
    treatment_date: getTodayForInput(),
    demand_number: '',
    demand_type: '',
    track: '',
    status: 'Não' as AnalysisStatus,
    status_observation: '',
    tag: '',
    monitor_name: currentUser.name
  });

  const [isOtherDemandType, setIsOtherDemandType] = useState(false);
  const [otherDemandType, setOtherDemandType] = useState('');
  const [analysisToDelete, setAnalysisToDelete] = useState<number | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<Analysis | null>(null);
  const [contestMessage, setContestMessage] = useState('');
  const [submittingContest, setSubmittingContest] = useState(false);

  const [topbarLeft, setTopbarLeft] = useState<Element | null>(null);
  const [topbarRight, setTopbarRight] = useState<Element | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowClearModal(false);
        setShowImportModal(false);
        setViewingAnalysis(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setTopbarLeft(document.getElementById('topbar-left'));
    setTopbarRight(document.getElementById('topbar-right'));
  }, []);

  useEffect(() => {
    if (showForm && !selectedTrack && !location.state?.trackName && !editingAnalysis) {
      navigate('/esteiras');
    }
  }, [showForm, selectedTrack, location.state, navigate, editingAnalysis]);

  useEffect(() => {
    loadData();
    if (location.state?.trackName && mode === 'form') {
      const trackName = location.state.trackName;
      setSelectedTrack(trackName);
      
      let demandType = '';
      if (trackName === 'Abertura PJ' || trackName === 'BKO Abertura') {
          demandType = 'Abertura de conta';
      } else if (trackName === 'Fatca') {
          demandType = 'Fatca';
      }
      
      setFormData(prev => ({ ...prev, track: trackName, demand_type: demandType }));
    }
  }, [mode, location.state]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analysesData, analystsData, tracksData] = await Promise.all([
        api.getAnalyses(),
        canViewAnalysts ? api.getAnalysts() : Promise.resolve([]),
        api.getTracks()
      ]);
      setAnalyses(analysesData);
      setAnalysts(analystsData);
      setTracks(tracksData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Permission guard
    if (editingAnalysis && !canEditHistorico) {
      toast.error('Você não tem permissão para editar monitorias no histórico');
      return;
    }
    if (!editingAnalysis && !canEditNovaMonitoria) {
      toast.error('Você não tem permissão para realizar novas monitorias');
      return;
    }

    setSubmitting(true);
    try {
      const finalData = {
        ...formData,
        demand_type: isOtherDemandType ? otherDemandType : formData.demand_type
      };

      if (editingAnalysis) {
        await api.updateAnalysis(editingAnalysis.id, finalData);
        toast.success('Monitoria atualizada com sucesso');
      } else {
        await api.createAnalysis(finalData);
        toast.success('Monitoria registrada com sucesso');
      }
      
      if (mode === 'form') {
        navigate('/historico');
      } else {
        setShowForm(false);
        setEditingAnalysis(null);
        setIsOtherDemandType(false);
        setOtherDemandType('');
        loadData();
        resetForm();
      }
    } catch (err) {
      toast.error('Erro ao salvar análise');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedTrack(null);
    setFormData({
      analyst_id: '',
      company_name: '',
      cnpj: '',
      treatment_date: getTodayForInput(),
      demand_number: '',
      demand_type: '',
      track: '',
      status: 'Não',
      status_observation: '',
      tag: '',
      monitor_name: currentUser.name
    });
    setIsOtherDemandType(false);
    setOtherDemandType('');
  };

  const handleEdit = (analysis: Analysis) => {
    setEditingAnalysis(analysis);
    setSelectedTrack(analysis.track);
    
    const isOther = !DEMAND_TYPES.includes(analysis.demand_type);
    setIsOtherDemandType(isOther);
    setOtherDemandType(isOther ? analysis.demand_type : '');

    setFormData({
      analyst_id: analysis.analyst_id?.toString() || '',
      company_name: analysis.company_name,
      cnpj: analysis.cnpj,
      treatment_date: parseCSVDate(analysis.treatment_date),
      demand_number: analysis.demand_number,
      demand_type: isOther ? 'Outro' : analysis.demand_type,
      track: analysis.track,
      status: analysis.status,
      status_observation: analysis.status_observation,
      tag: analysis.tag || '',
      monitor_name: analysis.monitor_name
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEditHistorico) {
      toast.error('Você não tem permissão para excluir monitorias');
      return;
    }
    try {
      await api.deleteAnalysis(id);
      toast.success('Análise excluída com sucesso');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir análise');
    }
  };

  const segment = localStorage.getItem('segment') || 'PJ';

  const formatDocument = (value: string) => {
    let clean = value.replace(/\D/g, '');
    if (segment === 'PF') {
      if (clean.length > 11) clean = clean.slice(0, 11);
      let masked = clean;
      if (clean.length > 3) masked = clean.slice(0, 3) + '.' + clean.slice(3);
      if (clean.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
      if (clean.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11);
      return masked;
    } else {
      if (clean.length > 14) clean = clean.slice(0, 14);
      let masked = clean;
      if (clean.length > 2) masked = clean.slice(0, 2) + '.' + clean.slice(2);
      if (clean.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
      if (clean.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
      if (clean.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15);
      return masked;
    }
  };

  const parseCSVDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        // Ensure year is 4 digits
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Handle YYYY-MM-DD or DD-MM-YYYY
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [p1, p2, p3] = parts;
        if (p1.length === 4) {
          // YYYY-MM-DD
          return dateStr;
        } else {
          // Assume DD-MM-YYYY
          const day = p1;
          const month = p2;
          const year = p3;
          const fullYear = year.length === 2 ? `20${year}` : year;
          return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
    
    return dateStr;
  };

  const validateDocument = (doc: string) => {
    const clean = doc.replace(/\D/g, '');
    if (segment === 'PF') {
      if (clean.length !== 11) return false;
      return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(doc);
    } else {
      if (clean.length !== 14) return false;
      return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(doc);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatDocument(e.target.value);
    setFormData({...formData, cnpj: masked});
  };

  const handleExport = async () => {
    try {
      if (!filteredAnalyses || filteredAnalyses.length === 0) {
        toast.error('Não há dados para exportar.');
        return;
      }

      const headers = [
        'Esteira', 'Demanda', 'Tipo de Demanda', segment === 'PF' ? 'Nome' : 'Empresa', segment === 'PF' ? 'CPF' : 'CNPJ', 
        'Analista', 'Login do Analista', 'Data', 'Erro', 'Observação do Erro', 
        'Tag', 'Monitor'
      ];
      
      const csvContent = [
        headers.join(';'),
        ...filteredAnalyses.map(analysis => [
          analysis.track,
          analysis.demand_number,
          analysis.demand_type,
          `"${analysis.company_name.replace(/"/g, '""')}"`,
          analysis.cnpj,
          `"${analysis.analyst_name?.replace(/"/g, '""') || analysts.find(a => a.id?.toString() === analysis.analyst_id?.toString())?.name?.replace(/"/g, '""') || ''}"`,
          analysis.analyst_matricula || analysts.find(a => a.id?.toString() === analysis.analyst_id?.toString())?.matricula || '',
          formatLocalDate(analysis.treatment_date),
          analysis.status,
          `"${(analysis.status_observation || '').replace(/"/g, '""')}"`,
          analysis.tag || '',
          `"${(analysis.monitor_name || '').replace(/"/g, '""')}"`
        ].join(';'))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `historico_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Exportação realizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar histórico');
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await api.deleteAnalyses(clearPeriod);
      toast.success('Histórico limpo com sucesso!');
      setShowClearModal(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao limpar histórico');
    } finally {
      setClearing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Esteira', 'Demanda', 'Tipo de Demanda', segment === 'PF' ? 'Nome' : 'Empresa', segment === 'PF' ? 'CPF' : 'CNPJ', 
      'Analista', 'Login do Analista', 'Data', 'Erro', 'Observação do Erro', 
      'Tag'
    ];
    
    // Example row
    const example = [
      'Extranet', '123456', 'Abertura de conta', 'Empresa Exemplo', segment === 'PF' ? '000.000.000-00' : '12.345.678/0001-90',
      'Nome do Analista', 'login.analista', format(new Date(), 'dd/MM/yyyy'), 'Não', '',
      ''
    ];

    const csvContent = [
      headers.join(';'),
      example.join(';')
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_monitorias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDropCSV = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!canImportMonitoria) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV válido.');
      return;
    }

    processCSV(file);
  };

  const processCSV = async (file: File) => {
    setImporting(true);
    const toastId = toast.loading('Processando arquivo...');

    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              // Basic validation
              if (!row['Esteira'] || !row['Demanda'] || !row['Analista'] || !row['Data']) {
                errorCount++;
                continue;
              }

              // Find analyst by name or login
              const analystName = row['Analista']?.trim();
              const analystLogin = row['Login do Analista']?.trim();
              
              const analyst = analysts.find(a => 
                normalizeString(a.name) === normalizeString(analystName) || 
                (analystLogin && normalizeString(a.matricula) === normalizeString(analystLogin))
              );

              if (!analyst) {
                console.warn(`Analista não encontrado: ${analystName}`);
                errorCount++;
                continue;
              }

              // Prepare analysis data
              const analysisData = {
                track: row['Esteira'],
                demand_number: row['Demanda'],
                demand_type: row['Tipo de Demanda'] || 'Outro',
                company_name: row['Empresa'] || row['Nome'] || '',
                cnpj: formatDocument(row['CNPJ'] || row['CPF'] || ''),
                analyst_id: analyst.id?.toString() || '',
                treatment_date: parseCSVDate(row['Data']),
                status: row['Erro'] === 'Sim' ? 'Sim' : 'Não',
                status_observation: row['Observação do Erro'] || '',
                tag: row['Tag'] || '',
                monitor_name: currentUser.name
              };

              await api.createAnalysis(analysisData);
              successCount++;
            } catch (err) {
              console.error('Erro ao importar linha:', err);
              errorCount++;
            }
          }

          toast.dismiss(toastId);
          if (successCount > 0) {
            toast.success(`${successCount} monitorias importadas com sucesso!`);
            if (errorCount > 0) {
              toast.error(`${errorCount} linhas falharam na importação.`);
            }
            setShowImportModal(false);
            loadData();
          } else {
            toast.error('Nenhuma monitoria foi importada. Verifique o formato do arquivo.');
          }
        } catch (err) {
          toast.dismiss(toastId);
          toast.error('Erro ao processar arquivo CSV');
        } finally {
          setImporting(false);
        }
      },
      error: (err) => {
        toast.dismiss(toastId);
        toast.error('Erro ao ler arquivo CSV');
        setImporting(false);
      }
    });
  };

  const handleContestSubmit = async () => {
    if (!viewingAnalysis || !contestMessage.trim() || submittingContest) return;

    setSubmittingContest(true);
    try {
      const newMessage = {
        id: Date.now().toString(),
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        message: contestMessage.trim(),
        created_at: new Date().toISOString()
      };

      const existingContest = viewingAnalysis.contest || {
        status: 'aberta',
        messages: [],
        created_by_name: currentUser.name,
        created_by_email: currentUser.email,
        created_at: new Date().toISOString()
      };

      let newStatus = existingContest.status;
      if (existingContest.messages.length > 0) {
        if (currentUser.role === 'Monitor' || currentUser.name === viewingAnalysis.monitor_name) {
          newStatus = 'respondida';
        } else {
          newStatus = 'aberta';
        }
      }

      const updatedContest = {
        ...existingContest,
        status: newStatus,
        messages: [...existingContest.messages, newMessage]
      };

      await api.updateAnalysis(viewingAnalysis.id, { contest: updatedContest });
      
      setViewingAnalysis({ ...viewingAnalysis, contest: updatedContest });
      setAnalyses(analyses.map(a => a.id === viewingAnalysis.id ? { ...a, contest: updatedContest } : a));
      setContestMessage('');
      toast.success('Mensagem enviada com sucesso');

      const usersList = await api.getUsers();
      const targetEmail = currentUser.name === viewingAnalysis.monitor_name 
        ? updatedContest.created_by_email 
        : usersList.find((u: any) => u.name === viewingAnalysis.monitor_name)?.email;

      if (targetEmail && targetEmail !== currentUser.email) {
        await api.createNotification({
          user_email: targetEmail,
          title: `Contestação atualizada na monitoria #${viewingAnalysis.demand_number}`,
          message: `${currentUser.name} enviou uma mensagem na contestação.`,
        });
      }

    } catch (error) {
      toast.error('Erro ao enviar contestação');
    } finally {
      setSubmittingContest(false);
    }
  };

  const handleCancelContest = async () => {
    if (!viewingAnalysis || !viewingAnalysis.contest) return;
    
    try {
      const updatedContest = {
        ...viewingAnalysis.contest,
        status: 'cancelada' as const
      };

      await api.updateAnalysis(viewingAnalysis.id, { contest: updatedContest });
      
      setViewingAnalysis({ ...viewingAnalysis, contest: updatedContest });
      setAnalyses(analyses.map(a => a.id === viewingAnalysis.id ? { ...a, contest: updatedContest } : a));
      toast.success('Contestação cancelada com sucesso');

      const usersList = await api.getUsers();
      const targetEmail = usersList.find((u: any) => u.name === viewingAnalysis.monitor_name)?.email;

      if (targetEmail && targetEmail !== currentUser.email) {
        await api.createNotification({
          user_email: targetEmail,
          title: `Contestação cancelada na monitoria #${viewingAnalysis.demand_number}`,
          message: `${currentUser.name} cancelou a contestação.`,
        });
      }

    } catch (error) {
      toast.error('Erro ao cancelar contestação');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canImportMonitoria) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }

    processCSV(file);
    // Reset input
    event.target.value = '';
  };

  const filteredAnalyses = Array.isArray(analyses) ? analyses.filter(a => {
    const analystName = a.analyst_name || analysts.find(an => an.id?.toString() === a.analyst_id?.toString())?.name || '';
    const matchesSearch = String(a.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(a.demand_number || '').includes(searchTerm) ||
                          String(analystName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesDate = (dateFilter.start ? a.treatment_date >= dateFilter.start : true) && 
                        (dateFilter.end ? a.treatment_date <= dateFilter.end : true);
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at || a.treatment_date).getTime();
    const dateB = new Date(b.created_at || b.treatment_date).getTime();
    return dateB - dateA;
  }) : [];

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, statusFilter, dateFilter]);

  const displayedAnalyses = filteredAnalyses.slice(0, visibleCount);

  const getStatusIcon = (status: AnalysisStatus) => {
    switch (status) {
      case 'Sim': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Não': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusClass = (status: AnalysisStatus) => {
    switch (status) {
      case 'Sim': return 'bg-red-50 text-red-700 border-red-100';
      case 'Não': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };



  const currentTrackConfig = tracks.find(t => t.name === selectedTrack)?.formConfig || {
    showAnalyst: true,
    showCompany: true,
    showCnpj: true,
    showDate: true,
    showDemandNumber: true,
    showDemandType: true,
    showStatus: true,
    showStatusObservation: true,
    showTag: true,
    demandTypes: [],
    tags: []
  };

  let currentDemandTypes = currentTrackConfig.demandTypes?.length > 0 ? currentTrackConfig.demandTypes : DEMAND_TYPES;
  if (selectedTrack === 'Abertura PJ' || selectedTrack === 'BKO Abertura') {
    currentDemandTypes = ['Abertura de conta'];
  } else if (selectedTrack === 'Fatca') {
    currentDemandTypes = ['Fatca'];
  } else {
    currentDemandTypes = currentDemandTypes.filter(type => type !== 'Abertura de conta');
  }
  const initialPfTags = ['Aprovação indevida', 'Reprovação indevida', 'Dados divergentes', 'Interação Salesforce', 'Falha na análise', 'Tabulação', 'Procedimento incorreto e/ou incompleto.'];
  const currentTags = segment === 'PF' ? initialPfTags : (currentTrackConfig.tags?.length > 0 ? currentTrackConfig.tags : TAGS);

  return (
    <div className="space-y-6">
      {topbarLeft && createPortal(
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {showForm ? (editingAnalysis ? 'Editar Monitoria' : 'Nova Monitoria') : 'Histórico de Monitorias'}
          </h1>
        </div>,
        topbarLeft
      )}

      {topbarRight && !showForm && createPortal(
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-all"
            title="Atualizar Histórico"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {(searchTerm || dateFilter.start || dateFilter.end || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter({ start: '', end: '' });
                setStatusFilter('');
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all shrink-0"
              title="Limpar Filtros"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={segment === 'PF' ? "Buscar..." : "Buscar por empresa, demanda ou analista..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <input 
              type="date"
              value={dateFilter.start}
              onChange={e => setDateFilter({...dateFilter, start: e.target.value})}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
            />
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <input 
              type="date"
              value={dateFilter.end}
              onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 outline-none bg-transparent"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white shrink-0 appearance-none"
          >
            <option value="" className="dark:bg-slate-800">Todas</option>
            <option value="Não" className="dark:bg-slate-800">Sem Erro</option>
            <option value="Sim" className="dark:bg-slate-800">Com Erro</option>
          </select>
        </div>,
        topbarRight
      )}

      <AnimatePresence mode="wait">
        {showForm ? (
          !selectedTrack ? null : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-md shadow-sm border border-slate-100 dark:border-slate-800 max-w-3xl mx-auto"
            >
              <div className="mb-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-8">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-50 dark:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/10 rounded-lg">
                    <Layers className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Esteira: {selectedTrack}</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400">Preencha os dados da demanda abaixo</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/esteiras')}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
                >
                  Alterar Esteira
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="space-y-3">
                  <label className="text-base font-bold text-slate-800 dark:text-slate-200">Monitor</label>
                  <input 
                    disabled
                    type="text"
                    value={formData.monitor_name}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>

                {currentTrackConfig.showAnalyst && (
                  <div className="space-y-3 relative">
                  <label className="text-base font-bold text-slate-800 dark:text-slate-200">Analista Responsável</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAnalystDropdownOpen(!isAnalystDropdownOpen)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base flex items-center justify-between focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-left dark:text-white"
                    >
                      <span className={formData.analyst_id ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                        {formData.analyst_id 
                          ? analysts.find(a => a.id?.toString() === formData.analyst_id)?.name 
                          : 'Selecione um analista'}
                        {formData.analyst_id && (
                          <span className="ml-2 text-slate-400 dark:text-slate-500 text-sm font-medium uppercase">
                            {analysts.find(a => a.id?.toString() === formData.analyst_id)?.matricula}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isAnalystDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isAnalystDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsAnalystDropdownOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
                          >
                            {analysts.length > 0 ? analysts.map(a => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, analyst_id: a.id?.toString() || ''});
                                  setIsAnalystDropdownOpen(false);
                                }}
                                className="w-full px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group border-b border-slate-50 dark:border-slate-800 last:border-0"
                              >
                                <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {a.name}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600 text-xs font-bold uppercase tracking-widest group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors">
                                  {a.matricula}
                                </span>
                              </button>
                            )) : (
                              <div className="px-5 py-4 text-slate-400 dark:text-slate-600 text-sm italic">Nenhum analista encontrado</div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <input type="hidden" required value={formData.analyst_id} />
                </div>
                )}

                {currentTrackConfig.showCompany && (
                  <div className="space-y-3">
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">{segment === 'PF' ? 'Nome' : 'Razão Social'}</label>
                    <input 
                      required
                      type="text"
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      placeholder={segment === 'PF' ? 'Nome' : 'Nome da empresa'}
                    />
                  </div>
                )}

                {currentTrackConfig.showCnpj && (
                  <div className="space-y-3">
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">{segment === 'PF' ? 'CPF' : 'CNPJ'}</label>
                    <input 
                      required
                      type="text"
                      value={formData.cnpj}
                      onChange={handleDocumentChange}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white ${formData.cnpj && !validateDocument(formData.cnpj) ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`}
                      placeholder={segment === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                    {formData.cnpj && !validateDocument(formData.cnpj) && (
                      <p className="text-xs text-red-500 dark:text-red-400 font-semibold">{segment === 'PF' ? 'Formato de CPF inválido' : 'Formato de CNPJ inválido'}</p>
                    )}
                  </div>
                )}

                {currentTrackConfig.showDate && (
                  <div className="space-y-3">
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">Data da Monitoria</label>
                    <input 
                      required
                      type="date"
                      value={formData.treatment_date}
                      onChange={e => setFormData({...formData, treatment_date: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                )}

                {currentTrackConfig.showDemandNumber && (
                  <div className="space-y-3">
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">Nº da Demanda</label>
                    <input 
                      required
                      type="text"
                      maxLength={8}
                      value={formData.demand_number}
                      onChange={e => setFormData({...formData, demand_number: e.target.value.replace(/\D/g, '').slice(0, 8)})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      placeholder="12345678"
                    />
                  </div>
                )}

                {currentTrackConfig.showDemandType && (
                  <div className="space-y-3">
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Tipo de Demanda {(selectedTrack === 'Abertura PJ' || selectedTrack === 'BKO Abertura' || selectedTrack === 'Fatca') && <span className="text-xs font-normal text-blue-500 ml-2">(Fixo para esta esteira)</span>}
                    </label>
                    <select 
                      required
                      disabled={selectedTrack === 'Abertura PJ' || selectedTrack === 'BKO Abertura' || selectedTrack === 'Fatca'}
                      value={formData.demand_type}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({...formData, demand_type: val});
                        setIsOtherDemandType(val === 'Outro');
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white ${
                        (selectedTrack === 'Abertura PJ' || selectedTrack === 'BKO Abertura' || selectedTrack === 'Fatca') ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="" disabled className="dark:bg-slate-900 text-slate-400">Selecione o Tipo de demanda</option>
                      {currentDemandTypes.map(type => (
                        <option key={type} value={type} className="dark:bg-slate-900">{type}</option>
                      ))}
                      {selectedTrack !== 'Abertura PJ' && selectedTrack !== 'BKO Abertura' && selectedTrack !== 'Fatca' && (
                        <option value="Outro" className="dark:bg-slate-900">Outro</option>
                      )}
                    </select>
                    
                    {isOtherDemandType && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3"
                      >
                        <input 
                          required
                          type="text"
                          value={otherDemandType}
                          onChange={e => setOtherDemandType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                          placeholder="Especifique o tipo de demanda"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {currentTrackConfig.showStatus && (
                  <div className="space-y-3">
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">Erro</label>
                    <select 
                      required
                      value={formData.status}
                      onChange={e => {
                        const newStatus = e.target.value as AnalysisStatus;
                        setFormData({
                          ...formData, 
                          status: newStatus, 
                          tag: newStatus === 'Não' ? '' : formData.tag,
                          status_observation: newStatus === 'Não' ? '' : formData.status_observation
                        });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                    >
                      <option value="Não" className="dark:bg-slate-900">Não</option>
                      <option value="Sim" className="dark:bg-slate-900">Sim</option>
                    </select>
                  </div>
                )}

                {currentTrackConfig.showStatus && formData.status === 'Sim' && currentTrackConfig.showTag && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">Tag</label>
                    <select 
                      required
                      value={formData.tag}
                      onChange={e => setFormData({...formData, tag: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                    >
                      <option value="" className="dark:bg-slate-900">Selecione uma tag</option>
                      {currentTags.map(tag => (
                        <option key={tag} value={tag} className="dark:bg-slate-900">{tag}</option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {currentTrackConfig.showStatus && formData.status === 'Sim' && currentTrackConfig.showStatusObservation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <label className="text-base font-bold text-slate-800 dark:text-slate-200">Erro Encontrado</label>
                    <textarea 
                      value={formData.status_observation}
                      onChange={e => setFormData({...formData, status_observation: e.target.value})}
                      rows={1}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-5 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[48px] resize-y dark:text-white"
                      placeholder="Descreva o erro encontrado"
                    />
                  </motion.div>
                )}

              <div className="flex justify-end gap-5 pt-6 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button 
                  type="button"
                  onClick={() => { 
                    if (mode === 'form') {
                      navigate('/historico');
                    } else {
                      setShowForm(false); 
                      setEditingAnalysis(null); 
                      setSelectedTrack(null);
                    }
                  }}
                  className="px-8 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-base"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-12 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 border border-transparent shadow-sm transition-all font-bold text-base shadow-md shadow-slate-500/10 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    editingAnalysis ? 'Atualizar Monitoria' : 'Salvar Monitoria'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )
      ) : (
        <motion.div
          key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-4 items-center justify-end mb-4">
              {canViewHistorico && (
                <div className="flex gap-2">
                  {canClearHistorico && (
                    <button 
                      onClick={() => setShowClearModal(true)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 text-sm font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar Histórico
                    </button>
                  )}
                  <button 
                    onClick={handleExport}
                    className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 border border-transparent shadow-sm px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-lg shadow-slate-500/10 text-sm font-bold"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                  {canImportMonitoria && (
                    <button 
                      onClick={() => setShowImportModal(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 text-sm font-bold"
                    >
                      <Upload className="w-4 h-4" />
                      Importar
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Esteira / Demanda</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{segment === 'PF' ? 'Nome / CPF' : 'Empresa / CNPJ'}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Analista</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Erro</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tag</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {displayedAnalyses.length > 0 ? displayedAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">{analysis.track}</div>
                          <div className="font-semibold text-slate-900 dark:text-white">{analysis.demand_number}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{analysis.demand_type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{analysis.company_name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{analysis.cnpj}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {analysis.analyst_name || analysts.find(a => a.id?.toString() === analysis.analyst_id?.toString())?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            Login: {analysis.analyst_matricula || analysts.find(a => a.id?.toString() === analysis.analyst_id?.toString())?.matricula || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 dark:text-slate-400">{formatLocalDate(analysis.treatment_date)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusClass(analysis.status)}`}>
                            {getStatusIcon(analysis.status)}
                            {analysis.status}
                          </span>
                          {analysis.contest && (
                            <div className="mt-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${
                                analysis.contest.status === 'cancelada' 
                                  ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'
                                  : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400 dark:border-amber-800'
                              }`} title={`Contestação: ${analysis.contest.status === 'aberta' ? 'Em Análise' : analysis.contest.status === 'cancelada' ? 'Cancelada' : 'Respondida'}`}>
                                <Hammer className="w-3 h-3" />
                                Contestada
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 dark:text-slate-400">{analysis.tag || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setViewingAnalysis(analysis)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/10 rounded-lg transition-all"
                            title="Ver Detalhes"
                          >
                            <Info className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">
                          Nenhuma monitoria encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {visibleCount < filteredAnalyses.length && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-white transition-all rounded-md font-bold text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Carregar mais 20 monitorias
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={analysisToDelete !== null}
        title="Excluir Análise"
        message="Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={() => {
          if (analysisToDelete) handleDelete(analysisToDelete);
        }}
        onCancel={() => setAnalysisToDelete(null)}
      />

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {viewingAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalhes da Monitoria</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ID: {viewingAnalysis.id} • Realizada em {formatLocalDate(viewingAnalysis.treatment_date)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingAnalysis(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Informações Gerais</h3>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">Esteira</span>
                      <span className="text-slate-900 dark:text-white">{viewingAnalysis.track}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">Demanda</span>
                      <span className="text-slate-900 dark:text-white">{viewingAnalysis.demand_type}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">Número da Demanda</span>
                      <span className="text-slate-900 dark:text-white">{viewingAnalysis.demand_number}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Dados do Cliente</h3>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">{segment === 'PF' ? 'Nome' : 'Empresa'}</span>
                      <span className="text-slate-900 dark:text-white">{viewingAnalysis.company_name}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">{segment === 'PF' ? 'CPF' : 'CNPJ'}</span>
                      <span className="text-slate-900 dark:text-white">{viewingAnalysis.cnpj}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Responsáveis</h3>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">Analista</span>
                      <span className="text-slate-900 dark:text-white">
                        {viewingAnalysis.analyst_name || analysts.find(a => a.id?.toString() === viewingAnalysis.analyst_id?.toString())?.name || 'N/A'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Login: {viewingAnalysis.analyst_matricula || analysts.find(a => a.id?.toString() === viewingAnalysis.analyst_id?.toString())?.matricula || 'N/A'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">Monitor</span>
                      <span className="text-slate-900 dark:text-white">{viewingAnalysis.monitor_name}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Resultado</h3>
                    
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">Status de Erro</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${getStatusClass(viewingAnalysis.status)}`}>
                        {getStatusIcon(viewingAnalysis.status)}
                        {viewingAnalysis.status === 'Sim' ? 'Erro Encontrado' : 'Sem Erros'}
                      </span>
                    </div>

                    {viewingAnalysis.status === 'Sim' && viewingAnalysis.tag && (
                      <div>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">Tag do Erro</span>
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-800">
                          {viewingAnalysis.tag}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {viewingAnalysis.status === 'Sim' && (
                    <div>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">Detalhes do Erro Encontrado</span>
                      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-200 whitespace-pre-wrap">
                        {viewingAnalysis.status_observation || 'Nenhum detalhe adicional sobre o erro.'}
                      </div>
                    </div>
                  )}
                </div>

                {viewingAnalysis.status === 'Sim' && (
                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-amber-500" />
                        Contestação
                        {viewingAnalysis.contest?.status && (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shadow-sm ${
                            viewingAnalysis.contest.status === 'aberta' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                            viewingAnalysis.contest.status === 'cancelada' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {viewingAnalysis.contest.status === 'aberta' ? 'Em Análise' : viewingAnalysis.contest.status === 'cancelada' ? 'Cancelada' : 'Respondida'}
                          </span>
                        )}
                      </h3>
                      {viewingAnalysis.contest && viewingAnalysis.contest.status !== 'cancelada' && canContest && (
                        <button
                          onClick={handleCancelContest}
                          className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar Contestação
                        </button>
                      )}
                    </div>

                    {viewingAnalysis.contest?.messages && viewingAnalysis.contest.messages.length > 0 && (
                      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
                        {viewingAnalysis.contest.messages.map(msg => (
                          <div key={msg.id} className={`p-3 rounded-lg border shadow-sm ${
                            msg.sender_role === 'Monitor' || msg.sender_name === viewingAnalysis.monitor_name
                              ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 ml-8' 
                              : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800 mr-8'
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{msg.sender_name} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({msg.sender_role})</span></span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {(canContest || currentUser.name === viewingAnalysis.monitor_name) && (!viewingAnalysis.contest || viewingAnalysis.contest.status !== 'cancelada') && (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                            Nova Mensagem
                          </label>
                          <textarea
                            value={contestMessage}
                            onChange={(e) => setContestMessage(e.target.value)}
                            placeholder="Descreva o motivo da contestação ou responda..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-amber-500/50 outline-none resize-none text-sm dark:text-white"
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={handleContestSubmit}
                          disabled={!contestMessage.trim() || submittingContest}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2 font-medium h-[42px] mb-[2px]"
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Registrado em {format(new Date(viewingAnalysis.created_at || viewingAnalysis.treatment_date), 'dd/MM/yyyy HH:mm')}
                </div>
                <div className="flex gap-3">
                  {canEditHistorico && (
                    <>
                      <button
                        onClick={() => {
                          setAnalysisToDelete(viewingAnalysis.id);
                          setViewingAnalysis(null);
                        }}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors font-medium flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                      <button
                        onClick={() => {
                          handleEdit(viewingAnalysis);
                          setViewingAnalysis(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    </>
                  )}
                  {!canEditHistorico && (
                    <button
                      onClick={() => setViewingAnalysis(null)}
                      className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-md transition-colors font-medium"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Limpar Histórico */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Limpar Histórico
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
                    className="w-full px-4 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="7">Mais antigos que 7 dias</option>
                    <option value="15">Mais antigos que 15 dias</option>
                    <option value="30">Mais antigos que 30 dias</option>
                    <option value="all">Apagar todo o período</option>
                  </select>
                </div>
                
                <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                  Atenção: Esta ação é irreversível. O histórico apagado não poderá ser recuperado.
                </p>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    disabled={clearing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {clearing ? 'Apagando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-md shadow-lg w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  Importar Monitorias
                </h2>
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/10 p-4 rounded-lg border border-blue-100 dark:border-blue-500/20">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Instruções para Importação
                  </h3>
                  <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 list-disc pl-4">
                    <li>Utilize o arquivo CSV modelo para garantir o formato correto.</li>
                    <li><strong>Atenção:</strong> O nome do analista deve estar exatamente como cadastrado no sistema.</li>
                    <li><strong>Atenção:</strong> Não deixe nenhuma coluna obrigatória vazia (Esteira, Demanda, Analista, Data).</li>
                    <li>O delimitador do CSV deve ser ponto e vírgula (;).</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-all font-bold text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Modelo CSV
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      disabled={importing}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropCSV}
                      className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-8 bg-emerald-50 dark:bg-emerald-500/5 border-2 border-dashed border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all font-bold cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm">Processando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-sm text-center">Clique ou arraste o arquivo CSV para importar</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
