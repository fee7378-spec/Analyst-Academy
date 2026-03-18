import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Layers,
  RefreshCw,
  Building2,
  Globe,
  Settings2,
  Wrench,
  Briefcase,
  Store,
  TrendingUp,
  Box,
  Package,
  Archive,
  Database,
  Server,
  Cpu,
  Activity,
  Zap,
  Shield,
  Users,
  UserCheck,
  ClipboardList,
  FileText,
  PieChart,
  BarChart3,
  Target,
  Award,
  Lightbulb,
  Rocket,
  Compass,
  Check,
  X,
  Wallet,
  Star,
  FilePlus,
  Building,
  Settings,
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DEMAND_TYPES, TAGS, CORPORATE_ICONS, getIconDataById } from '../constants';

export const Tracks: React.FC = () => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMassEditModal, setShowMassEditModal] = useState(false);
  const [massEditForm, setMassEditForm] = useState({
    tag: '',
    demandType: '',
    selectedTracks: [] as string[]
  });
  const [editingTrack, setEditingTrack] = useState<any | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEdit = permissions['esteiras'] === 'edit';

  const [formData, setFormData] = useState({
    name: '',
    icon: 'Layers',
    formConfig: {
      showAnalyst: true,
      showCompany: true,
      showCnpj: true,
      showDate: true,
      showDemandNumber: true,
      showDemandType: true,
      showObservation: true,
      showStatus: true,
      showStatusObservation: true,
      showTag: true,
      demandTypes: [] as string[],
      tags: [] as string[]
    }
  });

  const [saving, setSaving] = useState(false);
  const [newDemandType, setNewDemandType] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const data = await api.getTracks();
      setTracks(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTrack) {
        await api.updateTrack(editingTrack.id, formData);
        toast.success('Esteira atualizada com sucesso');
      } else {
        await api.createTrack(formData);
        toast.success('Esteira criada com sucesso');
      }
      setShowModal(false);
      setEditingTrack(null);
      loadTracks();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar esteira');
    } finally {
      setSaving(false);
    }
  };

  const handleMassEditSubmit = async () => {
    if (!massEditForm.tag.trim() && !massEditForm.demandType.trim()) {
      toast.error('Preencha pelo menos uma Tag ou Tipo de Demanda');
      return;
    }
    if (massEditForm.selectedTracks.length === 0) {
      toast.error('Selecione pelo menos uma esteira');
      return;
    }

    setSaving(true);
    try {
      for (const trackId of massEditForm.selectedTracks) {
        const track = tracks.find(t => t.id === trackId);
        if (track) {
          const newTags = [...(track.formConfig?.tags || [])];
          const newDemandTypes = [...(track.formConfig?.demandTypes || [])];

          if (massEditForm.tag.trim() && !newTags.includes(massEditForm.tag.trim())) {
            newTags.push(massEditForm.tag.trim());
          }
          if (massEditForm.demandType.trim() && !newDemandTypes.includes(massEditForm.demandType.trim())) {
            newDemandTypes.push(massEditForm.demandType.trim());
          }

          await api.updateTrack(track.id, {
            ...track,
            formConfig: {
              ...track.formConfig,
              tags: newTags,
              demandTypes: newDemandTypes
            }
          });
        }
      }
      toast.success('Esteiras atualizadas em massa com sucesso');
      setShowMassEditModal(false);
      loadTracks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar esteiras em massa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTrack(id);
      toast.success('Esteira excluída com sucesso');
      loadTracks();
    } catch (err) {
      toast.error('Erro ao excluir esteira');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'Layers',
      formConfig: {
        showAnalyst: true,
        showCompany: true,
        showCnpj: true,
        showDate: true,
        showDemandNumber: true,
        showDemandType: true,
        showObservation: true,
        showStatus: true,
        showStatusObservation: true,
        showTag: true,
        demandTypes: [...DEMAND_TYPES],
        tags: [...TAGS]
      }
    });
  };

  const filteredTracks = tracks.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Esteiras</h1>
            <p className="text-slate-500 dark:text-slate-400">Gerencie as esteiras de monitoria do sistema</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && (
            <>
              <button 
                onClick={() => {
                  setMassEditForm({
                    tag: '',
                    demandType: '',
                    selectedTracks: []
                  });
                  setShowMassEditModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold"
              >
                <Layers className="w-5 h-5" />
                Edição em Massa
              </button>
              <button 
                onClick={() => {
                  resetForm();
                  setEditingTrack(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none font-bold"
              >
                <Plus className="w-5 h-5" />
                Nova Esteira
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <button 
          onClick={loadTracks}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
          title="Atualizar Esteiras"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar esteiras..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredTracks.map((track) => {
              const iconData = getIconDataById(track.icon, track.name);
              const Icon = iconData.icon;
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group relative"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconData.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{track.name}</h3>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingTrack(track);
                            setFormData({ 
                              name: track.name,
                              icon: track.icon || 'Layers',
                              formConfig: {
                                showAnalyst: track.formConfig?.showAnalyst ?? true,
                                showCompany: track.formConfig?.showCompany ?? true,
                                showCnpj: track.formConfig?.showCnpj ?? true,
                                showDate: track.formConfig?.showDate ?? true,
                                showDemandNumber: track.formConfig?.showDemandNumber ?? true,
                                showDemandType: track.formConfig?.showDemandType ?? true,
                                showObservation: track.formConfig?.showObservation ?? true,
                                showStatus: track.formConfig?.showStatus ?? true,
                                showStatusObservation: track.formConfig?.showStatusObservation ?? true,
                                showTag: track.formConfig?.showTag ?? true,
                                demandTypes: Array.isArray(track.formConfig?.demandTypes) && track.formConfig.demandTypes.length > 0 ? track.formConfig.demandTypes : [...DEMAND_TYPES],
                                tags: Array.isArray(track.formConfig?.tags) && track.formConfig.tags.length > 0 ? track.formConfig.tags : [...TAGS]
                              }
                            });
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setTrackToDelete(track.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Edição em Massa */}
      <AnimatePresence>
        {showMassEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 shrink-0 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Edição em Massa de Esteiras
                </h2>
                <button onClick={() => setShowMassEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Adicionar Tag
                    </label>
                    <input
                      type="text"
                      value={massEditForm.tag}
                      onChange={(e) => setMassEditForm({ ...massEditForm, tag: e.target.value })}
                      placeholder="Nova tag..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Adicionar Tipo de Demanda
                    </label>
                    <input
                      type="text"
                      value={massEditForm.demandType}
                      onChange={(e) => setMassEditForm({ ...massEditForm, demandType: e.target.value })}
                      placeholder="Novo tipo de demanda..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Aplicar nas Esteiras
                    </label>
                    <button
                      onClick={() => {
                        if (massEditForm.selectedTracks.length === tracks.length) {
                          setMassEditForm({ ...massEditForm, selectedTracks: [] });
                        } else {
                          setMassEditForm({ ...massEditForm, selectedTracks: tracks.map(t => t.id) });
                        }
                      }}
                      className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {massEditForm.selectedTracks.length === tracks.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tracks.map(track => (
                      <label 
                        key={track.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          massEditForm.selectedTracks.includes(track.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={massEditForm.selectedTracks.includes(track.id)}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...massEditForm.selectedTracks, track.id]
                              : massEditForm.selectedTracks.filter(id => id !== track.id);
                            setMassEditForm({ ...massEditForm, selectedTracks: newSelected });
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {track.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700 shrink-0 flex gap-3">
                <button
                  onClick={() => setShowMassEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMassEditSubmit}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Tudo'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nova/Editar Esteira */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingTrack ? 'Editar Esteira' : 'Nova Esteira'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nome da Esteira
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: WM, Corporate, WM Abertura..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Selecione um Ícone Corporativo
                  </label>
                  <div className="grid grid-cols-7 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    {CORPORATE_ICONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = formData.icon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({...formData, icon: item.id})}
                          className={`p-3 rounded-lg flex items-center justify-center transition-all relative ${
                            isSelected 
                              ? `${item.color} shadow-md scale-110 ring-2 ring-blue-500` 
                              : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          }`}
                          title={item.id}
                        >
                          <Icon className="w-5 h-5" />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white dark:border-slate-800">
                              <Check className="w-2 h-2" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Configuração do Formulário</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Selecione quais campos devem aparecer no formulário de Nova Monitoria para esta esteira.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'showAnalyst', label: 'Analista' },
                      { key: 'showCompany', label: 'Empresa' },
                      { key: 'showCnpj', label: 'CNPJ' },
                      { key: 'showDate', label: 'Data da Monitoria' },
                      { key: 'showDemandNumber', label: 'Número da Demanda' },
                      { key: 'showDemandType', label: 'Tipo de Demanda' },
                      { key: 'showObservation', label: 'Observações' },
                      { key: 'showStatus', label: 'Status' },
                      { key: 'showStatusObservation', label: 'Observação do Status' },
                      { key: 'showTag', label: 'Tag' }
                    ].map((field) => (
                      <label key={field.key} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.formConfig[field.key as keyof typeof formData.formConfig] as boolean}
                          onChange={(e) => setFormData({
                            ...formData,
                            formConfig: {
                              ...formData.formConfig,
                              [field.key]: e.target.checked
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {field.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tipos de Demanda
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {DEMAND_TYPES.filter(t => !formData.formConfig.demandTypes.includes(t)).map((type, index) => (
                        <button
                          key={`avail-${index}`}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              formConfig: {
                                ...formData.formConfig,
                                demandTypes: [...formData.formConfig.demandTypes, type]
                              }
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg text-sm transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDemandType}
                        onChange={(e) => setNewDemandType(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newDemandType.trim()) {
                              setFormData({
                                ...formData,
                                formConfig: {
                                  ...formData.formConfig,
                                  demandTypes: [...formData.formConfig.demandTypes, newDemandType.trim()]
                                }
                              });
                              setNewDemandType('');
                            }
                          }
                        }}
                        placeholder="Adicionar novo tipo..."
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newDemandType.trim()) {
                            setFormData({
                              ...formData,
                              formConfig: {
                                ...formData.formConfig,
                                demandTypes: [...formData.formConfig.demandTypes, newDemandType.trim()]
                              }
                            });
                            setNewDemandType('');
                          }
                        }}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.formConfig.demandTypes.map((type, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm">
                          {type}
                          <button
                            type="button"
                            onClick={() => {
                              const newTypes = [...formData.formConfig.demandTypes];
                              newTypes.splice(index, 1);
                              setFormData({
                                ...formData,
                                formConfig: {
                                  ...formData.formConfig,
                                  demandTypes: newTypes
                                }
                              });
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {TAGS.filter(t => !formData.formConfig.tags.includes(t)).map((tag, index) => (
                        <button
                          key={`avail-tag-${index}`}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              formConfig: {
                                ...formData.formConfig,
                                tags: [...formData.formConfig.tags, tag]
                              }
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg text-sm transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTag.trim()) {
                              setFormData({
                                ...formData,
                                formConfig: {
                                  ...formData.formConfig,
                                  tags: [...formData.formConfig.tags, newTag.trim()]
                                }
                              });
                              setNewTag('');
                            }
                          }
                        }}
                        placeholder="Adicionar nova tag..."
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTag.trim()) {
                            setFormData({
                              ...formData,
                              formConfig: {
                                ...formData.formConfig,
                                tags: [...formData.formConfig.tags, newTag.trim()]
                              }
                            });
                            setNewTag('');
                          }
                        }}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.formConfig.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = [...formData.formConfig.tags];
                              newTags.splice(index, 1);
                              setFormData({
                                ...formData,
                                formConfig: {
                                  ...formData.formConfig,
                                  tags: newTags
                                }
                              });
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTrack(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Esteira'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={trackToDelete !== null}
        title="Excluir Esteira"
        message="Tem certeza que deseja excluir esta esteira? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={() => {
          if (trackToDelete) {
            handleDelete(trackToDelete);
            setTrackToDelete(null);
          }
        }}
        onCancel={() => setTrackToDelete(null)}
      />
    </div>
  );
};
