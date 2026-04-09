import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, UserPermissions, PermissionLevel, ProfileTemplate } from '../types';
import { 
  Shield, 
  Search, 
  Eye, 
  EyeOff,
  Pencil, 
  CheckCircle2, 
  XCircle,
  User as UserIcon,
  ChevronRight,
  Save,
  ArrowLeft,
  UserPlus,
  Plus,
  Mail,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'nova-monitoria', label: 'Monitorar' },
  { id: 'analistas', label: 'Analistas' },
  { id: 'esteiras', label: 'Esteiras' },
  { id: 'historico', label: 'Histórico' },
  { id: 'logs', label: 'Log de Atividades' },
  { id: 'perfis', label: 'Perfis de acesso' },
  { id: 'perfil', label: 'Meu Perfil' },
  { id: 'processamento', label: 'Processamento' },
];

const TEMPLATES: Record<string, UserPermissions> = {
  'Administrador': {
    dashboard: 'edit',
    'nova-monitoria': 'edit',
    analistas: 'edit',
    esteiras: 'edit',
    historico: 'edit',
    logs: 'edit',
    perfis: 'edit',
    perfil: 'edit',
    processamento: 'edit'
  },
  'Monitor': {
    dashboard: 'view',
    'nova-monitoria': 'edit',
    analistas: 'view',
    esteiras: 'none',
    historico: 'view',
    logs: 'none',
    perfis: 'none',
    perfil: 'view',
    processamento: 'none'
  }
};

const TemplatesTab: React.FC<{ templates: ProfileTemplate[], setTemplates: React.Dispatch<React.SetStateAction<ProfileTemplate[]>>, canEdit: boolean, onUpdate?: () => void }> = ({ templates, setTemplates, canEdit, onUpdate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProfileTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    permissions: { ...TEMPLATES['Monitor'] }
  });
  const [templateToDelete, setTemplateToDelete] = useState<ProfileTemplate | null>(null);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    setSaving(true);
    try {
      if (selectedTemplate) {
        await api.updateTemplate(selectedTemplate.id, selectedTemplate);
        setTemplates(templates.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
        toast.success('Template atualizado com sucesso!');
        setSelectedTemplate(null);
        if (onUpdate) onUpdate();
      } else {
        const created = await api.createTemplate(newTemplate);
        setTemplates([...templates, created]);
        toast.success('Template criado com sucesso!');
        setShowCreateModal(false);
        setNewTemplate({ name: '', description: '', permissions: { ...TEMPLATES['Monitor'] } });
      }
    } catch (err) {
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (template: ProfileTemplate) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    if (template.name === 'Administrador') {
      toast.error('O template Administrador não pode ser excluído.');
      return;
    }
    setTemplateToDelete(template);
  };

  const confirmDeleteTemplate = async () => {
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    if (!templateToDelete) return;
    try {
      await api.deleteTemplate(templateToDelete.id);
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      toast.success('Template excluído com sucesso!');
      setTemplateToDelete(null);
    } catch (err) {
      toast.error('Erro ao excluir template');
    }
  };

  const handleTemplatePermissionChange = (moduleId: string, level: PermissionLevel) => {
    if (!canEdit || !selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      permissions: {
        ...selectedTemplate.permissions,
        [moduleId]: level
      }
    });
  };

  if (selectedTemplate) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-600">
                <Shield className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Editando Template: {selectedTemplate.name}</h2>
                <p className="text-slate-500 dark:text-slate-400">Configure as permissões padrão para este perfil de acesso</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
              >
                {canEdit ? 'Voltar' : 'Fechar'}
              </button>
              {canEdit && (
                <button 
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvando...' : 'Salvar Template'}
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES.map((module) => {
                const level = selectedTemplate.permissions[module.id as keyof UserPermissions] || 'none';
                return (
                  <div 
                    key={module.id}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                      level !== 'none' ? 'border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${level !== 'none' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{module.label}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <button
                        onClick={() => handleTemplatePermissionChange(module.id, 'none')}
                        disabled={!canEdit}
                        title="Sem Acesso"
                        className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                          level === 'none' 
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm' 
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        } disabled:opacity-50`}
                      >
                        <EyeOff className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Nenhum</span>
                      </button>
                      <button
                        onClick={() => handleTemplatePermissionChange(module.id, 'view')}
                        disabled={!canEdit}
                        title="Apenas Visualizar"
                        className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                          level === 'view' 
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        } disabled:opacity-50`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Ver</span>
                      </button>
                      <button
                        onClick={() => handleTemplatePermissionChange(module.id, 'edit')}
                        disabled={!canEdit}
                        title="Pode Editar"
                        className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                          level === 'edit' 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        } disabled:opacity-50`}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Templates de Permissão</h2>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{template.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {canEdit ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <p>Módulos com edição: {Object.values(template.permissions).filter(p => p === 'edit').length}</p>
              <p>Módulos com visualização: {Object.values(template.permissions).filter(p => p === 'view').length}</p>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
            Nenhum template criado ainda.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Novo Template
                </h2>
              </div>
              
              <form onSubmit={handleSaveTemplate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome do Template</label>
                  <input
                    type="text"
                    required
                    value={newTemplate.name}
                    onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Ex: Analista Sênior"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição</label>
                  <input
                    type="text"
                    required
                    value={newTemplate.description}
                    onChange={e => setNewTemplate({...newTemplate, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Ex: Acesso completo para analistas"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Criando...' : 'Criar Template'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={templateToDelete !== null}
        title="Excluir Template"
        message={`Tem certeza que deseja excluir o template "${templateToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => setTemplateToDelete(null)}
      />
    </div>
  );
};

export const Profiles: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ProfileTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'templates'>('users');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEdit = currentUser.role === 'Administrador' || permissions['perfis'] === 'edit';

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    try {
      await api.resetPasswordDirect(selectedUser.id, adminPassword);
      toast.success('Senha redefinida para Mudar@123 com sucesso!');
      setShowResetModal(false);
      setAdminPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setResettingPassword(false);
    }
  };
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Monitor' as any,
    permissions: { ...TEMPLATES['Monitor'] },
    templateId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let [usersData, templatesData] = await Promise.all([
        api.getUsers(),
        api.getTemplates()
      ]);
      
      if (templatesData.length === 0) {
        const adminTemplate = await api.createTemplate({
          name: 'Administrador',
          description: 'Acesso total ao sistema',
          permissions: { ...TEMPLATES['Administrador'] }
        });
        const monitorTemplate = await api.createTemplate({
          name: 'Monitor',
          description: 'Acesso padrão para monitores',
          permissions: { ...TEMPLATES['Monitor'] }
        });
        templatesData = [adminTemplate, monitorTemplate];
      }
      
      setUsers(usersData);
      setTemplates(templatesData);
      
      const monitorTemplate = templatesData.find(t => t.name === 'Monitor');
      if (monitorTemplate) {
        setNewUserForm(prev => ({
          ...prev,
          templateId: monitorTemplate.id,
          permissions: { ...monitorTemplate.permissions }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete === null) return;
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    setSaving(true);
    try {
      await api.deleteUser(userToDelete);
      toast.success('Usuário removido com sucesso!');
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    setSaving(true);
    try {
      await api.createUser(newUserForm);
      setShowCreateModal(false);
      const monitorTemplate = templates.find(t => t.name === 'Monitor');
      setNewUserForm({
        name: '',
        email: '',
        role: 'Monitor',
        templateId: monitorTemplate ? monitorTemplate.id : '',
        permissions: monitorTemplate ? { ...monitorTemplate.permissions } : { ...TEMPLATES['Monitor'] }
      });
      loadUsers();
      toast.success('Usuário criado com sucesso! O primeiro acesso será via e-mail.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (role: string) => {
    const template = templates.find(t => t.name === role);
    setNewUserForm({
      ...newUserForm,
      role,
      templateId: template ? template.id : '',
      permissions: template ? { ...template.permissions } : { ...TEMPLATES['Monitor'] }
    });
  };

  const handleNewUserPermissionChange = (moduleId: string, level: PermissionLevel) => {
    setNewUserForm({
      ...newUserForm,
      templateId: '',
      permissions: {
        ...newUserForm.permissions,
        [moduleId]: level
      }
    });
  };

  const handlePermissionChange = (moduleId: string, level: PermissionLevel) => {
    if (!selectedUser) return;
    
    const currentPerms = selectedUser.permissions || {
      dashboard: 'none',
      'nova-monitoria': 'none',
      analistas: 'none',
      historico: 'none',
      logs: 'none',
      perfis: 'none',
      perfil: 'none',
      esteiras: 'none',
      processamento: 'none'
    } as UserPermissions;

    const newPerms = {
      ...currentPerms,
      [moduleId]: level
    };

    setSelectedUser({
      ...selectedUser,
      templateId: undefined,
      permissions: newPerms
    });
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    setSaving(true);
    try {
      await api.updateUser(selectedUser.id, {
        role: selectedUser.role,
        permissions: selectedUser.permissions
      });
      setSuccess(true);
      toast.success('Permissões alteradas com sucesso');
      loadUsers();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Perfis de acesso</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie as permissões individuais de cada usuário</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-bold"
            >
              <UserPlus className="w-5 h-5" />
              Criar novo usuário
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 font-semibold transition-colors relative ${
            activeTab === 'users' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Usuários
          {activeTab === 'users' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-4 px-2 font-semibold transition-colors relative ${
            activeTab === 'templates' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Templates
          {activeTab === 'templates' && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
      </div>

      {activeTab === 'users' ? (
        <AnimatePresence mode="wait">
          {!selectedUser ? (
          <motion.div
            key="user-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar usuário por nome, e-mail ou login..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm dark:text-white"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perfil</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Permissões</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                              <Shield className="w-3 h-3" />
                              {user.role}
                            </span>
                            {!user.templateId && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-200 dark:border-purple-800">
                                Customizado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {Object.values(user.permissions || {}).filter(p => p !== 'none').length > 0 ? (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {Object.values(user.permissions || {}).filter(p => p !== 'none').length} permissões ativas
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-600 italic">Nenhuma permissão</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                            >
                              Gerenciar
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setUserToDelete(user.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                              title="Remover Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="permission-editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar para lista
              </button>
              <div className="flex items-center gap-4">
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Salvo com sucesso!
                  </motion.div>
                )}
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.name}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{selectedUser.email}</span>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Perfil:</span>
                        <select 
                          disabled={!canEdit}
                          value={selectedUser.role}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            const template = templates.find(t => t.name === newRole);
                            setSelectedUser({
                              ...selectedUser,
                              role: newRole as any,
                              templateId: template ? template.id : undefined,
                              permissions: template ? { ...template.permissions } : { ...TEMPLATES['Monitor'] }
                            });
                          }}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                        {!selectedUser.templateId && (
                          <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-200 dark:border-purple-800">
                            Customizado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all font-semibold border border-amber-200 dark:border-amber-800 disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    Resetar Senha
                  </button>
                )}
              </div>

              <div className="p-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Configuração de Módulos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MODULES.map((module) => {
                    const level = selectedUser.permissions?.[module.id as keyof UserPermissions] || 'none';
                    return (
                      <div 
                        key={module.id}
                        className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                          level !== 'none' ? 'border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            level === 'edit' ? 'bg-blue-500 text-white' : 
                            level === 'view' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 
                            'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                          }`}>
                            {level === 'edit' ? <Pencil className="w-5 h-5" /> : 
                             level === 'view' ? <Eye className="w-5 h-5" /> : 
                             <EyeOff className="w-5 h-5" />}
                          </div>
                          <span className={`font-bold ${level !== 'none' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                            {module.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <button
                            onClick={() => handlePermissionChange(module.id, 'none')}
                            title="Sem Acesso"
                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                              level === 'none' 
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm' 
                                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <EyeOff className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Nenhum</span>
                          </button>
                          <button
                            onClick={() => handlePermissionChange(module.id, 'view')}
                            title="Apenas Visualizar"
                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                              level === 'view' 
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Ver</span>
                          </button>
                          <button
                            onClick={() => handlePermissionChange(module.id, 'edit')}
                            title="Pode Editar"
                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                              level === 'edit' 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Editar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      ) : (
        <TemplatesTab templates={templates} setTemplates={setTemplates} canEdit={canEdit} onUpdate={loadData} />
      )}

      <AnimatePresence>
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Confirmar Reset de Senha
                </h2>
                <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-8 space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-sm">
                  A senha do usuário <strong>{selectedUser.name}</strong> será redefinida para <strong>Mudar@123</strong>.
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sua Senha (Administrador)</label>
                  <input 
                    required
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Digite sua senha para confirmar"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={resettingPassword}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {resettingPassword ? 'Resetando...' : 'Confirmar Reset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Criar Novo Usuário</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Nome Completo
                    </label>
                    <input 
                      required
                      type="text"
                      value={newUserForm.name}
                      onChange={e => setNewUserForm({...newUserForm, name: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white uppercase"
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      E-mail
                    </label>
                    <input 
                      required
                      type="email"
                      value={newUserForm.email}
                      onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                      placeholder="usuario@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      Perfil de Acesso
                    </label>
                    <select 
                      required
                      value={newUserForm.role}
                      onChange={e => handleProfileChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.name} className="dark:bg-slate-900">{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Personalizar Permissões</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Perfil: {newUserForm.role}
                      </p>
                      {!newUserForm.templateId && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-200 dark:border-purple-800">
                          Customizado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MODULES.map((module) => {
                      const level = newUserForm.permissions[module.id as keyof UserPermissions];
                      return (
                        <div 
                          key={module.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                            level !== 'none' ? 'border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{module.label}</span>
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleNewUserPermissionChange(module.id, 'none')}
                              className={`p-1.5 rounded-md transition-all ${level === 'none' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNewUserPermissionChange(module.id, 'view')}
                              className={`p-1.5 rounded-md transition-all ${level === 'view' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNewUserPermissionChange(module.id, 'edit')}
                              className={`p-1.5 rounded-md transition-all ${level === 'edit' ? 'bg-blue-500 text-white' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {saving ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={userToDelete !== null}
        title="Remover Usuário"
        message="Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita e o usuário perderá o acesso ao sistema."
        confirmText={saving ? 'Removendo...' : 'Sim, remover'}
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
