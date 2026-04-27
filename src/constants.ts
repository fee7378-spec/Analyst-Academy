import { 
  Layers,
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
  Wallet,
  Star,
  FilePlus,
  Building,
  Settings,
  Hammer
} from 'lucide-react';

export const DEMAND_TYPES = [
  'Abertura de conta',
  'Atualização cadastral',
  'Alteração de officer',
  'Alteração de segmento',
  'Bloqueio',
  'Criação de login Portal ADM',
  'Desbloqueio',
  'Encerramento de conta',
  'Inclusão de mercado',
  'Liberação de termo',
  'Parametrização'
];

export const TAGS = [
  'Atuação indevida no salesforce',
  'Atualização incompleta dos dados cadastrais',
  'Ausência de documento',
  'Código incorreto',
  'Data incorreta',
  'Direcionamento indevido',
  'Divergência de dados',
  'Documento ilegível',
  'Encerramento indevido',
  'Erro na parametrização',
  'Estrutura acionária',
  'Exclusão de dados',
  'Falta de arquivamento',
  'Falta de atualização dos dados cadastrais',
  'Falta de direcionamento',
  'Fluxo não concluído',
  'Representação indevida',
  'Reprova incompleta',
  'Reprova indevida',
  'Tabulação',
  'Tratativa indevida',
  'Validação de registro'
];

export const CORPORATE_ICONS = [
  { id: 'Layers', icon: Layers, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'Building2', icon: Building2, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' },
  { id: 'Globe', icon: Globe, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'Settings2', icon: Settings2, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30' },
  { id: 'Wrench', icon: Wrench, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
  { id: 'Briefcase', icon: Briefcase, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'Store', icon: Store, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' },
  { id: 'TrendingUp', icon: TrendingUp, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' },
  { id: 'Box', icon: Box, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30' },
  { id: 'Package', icon: Package, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' },
  { id: 'Archive', icon: Archive, color: 'text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/30' },
  { id: 'Database', icon: Database, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
  { id: 'Server', icon: Server, color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/30' },
  { id: 'Cpu', icon: Cpu, color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30' },
  { id: 'Activity', icon: Activity, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
  { id: 'Zap', icon: Zap, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' },
  { id: 'Shield', icon: Shield, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' },
  { id: 'Users', icon: Users, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'UserCheck', icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'ClipboardList', icon: ClipboardList, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' },
  { id: 'FileText', icon: FileText, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30' },
  { id: 'PieChart', icon: PieChart, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
  { id: 'BarChart3', icon: BarChart3, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'Target', icon: Target, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
  { id: 'Award', icon: Award, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'Lightbulb', icon: Lightbulb, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' },
  { id: 'Rocket', icon: Rocket, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
  { id: 'Compass', icon: Compass, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' },
];

export const getIconDataById = (id: string, name?: string) => {
  const found = CORPORATE_ICONS.find(item => item.id === id);
  if (found) return found;

  if (name) {
    const nameIconMap: Record<string, any> = {
      'Abono': { icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
      'BKO Abertura': { icon: Briefcase, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
      'FATCA': { icon: Globe, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
      'Vintage PJ': { icon: Building2, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' },
      'SH PME': { icon: Store, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' },
      'Premium PJ': { icon: Star, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' },
      'WM': { icon: TrendingUp, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' },
      'Abertura PJ': { icon: FilePlus, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' },
      'Corporate': { icon: Building, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30' },
      'Extranet': { icon: Globe, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
      'Parametrização': { icon: Settings, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30' },
      'BKO Manutenção': { icon: Wrench, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
      'PME Manutenção': { icon: Hammer, color: 'text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/30' }
    };
    return nameIconMap[name] || CORPORATE_ICONS[0];
  }

  return CORPORATE_ICONS[0];
};
