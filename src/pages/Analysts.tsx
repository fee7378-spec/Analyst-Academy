import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Supervisor } from '../types';
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
  Trash2
} from 'lucide-react';
import { formatLocalDate, getTodayForInput } from '../utils/date';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Analysts: React.FC = () => {
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnalyst, setEditingAnalyst] = useState<User | null>(null);
  const [analystToDelete, setAnalystToDelete] = useState<number | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEdit = currentUser.role === 'Administrador' || permissions['analistas'] === 'edit';

  const [formData, setFormData] = useState({
    name: '',
    matricula: '',
    supervisor: '',
    admission_date: getTodayForInput(),
    esteira: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analystsData, supervisorsData, tracksData] = await Promise.all([
        api.getAnalysts(),
        api.getSupervisors(),
        api.getTracks()
      ]);
      setAnalysts(analystsData);
      setSupervisors(supervisorsData);
      setTracks(tracksData);
      if (tracksData.length > 0) {
        setFormData(prev => ({ ...prev, esteira: tracksData[0].name }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      supervisor: '',
      admission_date: getTodayForInput(),
      esteira: tracks.length > 0 ? tracks[0].name : ''
    });
  };

  const handleDelete = async (id: number) => {
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
      supervisor: analyst.supervisor || '',
      admission_date: analyst.admission_date || getTodayForInput(),
      esteira: analyst.esteira || (tracks.length > 0 ? tracks[0].name : '')
    });
    setShowModal(true);
  };

  const filteredAnalysts = Array.isArray(analysts) ? analysts.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.supervisor && a.supervisor.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const supervisorsList = Array.isArray(supervisors) ? supervisors : [];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analistas</h1>
          <p className="text-slate-500 dark:text-slate-400">Cadastre e gerencie os perfis dos analistas em treinamento</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => { setShowModal(true); setEditingAnalyst(null); resetForm(); }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
          >
            <UserPlus className="w-5 h-5" />
            Novo Analista
          </button>
        )}
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <button 
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
          title="Atualizar Analistas"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por nome, matrícula ou supervisor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnalysts.map((analyst) => (
          <motion.div
            key={analyst.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-400 dark:text-slate-600 shrink-0">
                  {analyst.name.charAt(0)}
                </div>
                <div className="pr-2 min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate" title={analyst.name}>{analyst.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={`Login: ${analyst.matricula}`}>Login: {analyst.matricula}</p>
                </div>
              </div>
              
              {canEdit && (
                <div className="flex gap-1 shrink-0 ml-2">
                  <button 
                    onClick={() => handleEdit(analyst)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setAnalystToDelete(analyst.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <UserCheck className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                Supervisor: {analyst.supervisor || 'N/A'}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                Esteira: {analyst.esteira}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                Admissão: {analyst.admission_date ? formatLocalDate(analyst.admission_date) : 'N/A'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
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
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Login</label>
                  <input 
                    required
                    type="text"
                    value={formData.matricula}
                    onChange={e => setFormData({...formData, matricula: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Supervisor</label>
                  <select 
                    required
                    value={formData.supervisor}
                    onChange={e => setFormData({...formData, supervisor: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  >
                    <option value="" className="dark:bg-slate-900">Selecione um Supervisor</option>
                    {supervisorsList.map(s => (
                      <option key={s.id} value={s.name} className="dark:bg-slate-900">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Esteira</label>
                  <select 
                    required
                    value={formData.esteira}
                    onChange={e => setFormData({...formData, esteira: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
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
                    value={formData.admission_date}
                    onChange={e => setFormData({...formData, admission_date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
    </div>
  );
};
