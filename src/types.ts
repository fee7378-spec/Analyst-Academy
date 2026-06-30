export type UserRole = 'Administrador' | 'Supervisor' | 'Monitor' | 'Analista';

export type PermissionLevel = 'view' | 'edit' | 'none';

export interface UserPermissions {
  dashboard: PermissionLevel;
  analistas: PermissionLevel;
  historico: PermissionLevel;
  logs: PermissionLevel;
  perfis: PermissionLevel;
  perfil: PermissionLevel;
  esteiras: PermissionLevel;
  processamento: PermissionLevel;
  contestacoes: PermissionLevel;
}

export interface User {
  id: number;
  name: string;
  email: string;
  matricula: string;
  role: UserRole;
  admission_date?: string;
  esteira?: string;
  permissions?: UserPermissions;
  is_first_access?: boolean;
  templateId?: string;
  productivity?: Record<string, number>;
}

export interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  permissions: UserPermissions;
}

export type AnalysisStatus = 'Sim' | 'Não';

export interface ContestMessage {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export type ContestStatus = 'aberta' | 'respondida' | 'encerrada' | 'cancelada';

export interface Contest {
  status: ContestStatus;
  messages: ContestMessage[];
  created_by_name: string;
  created_by_email?: string;
  created_at: string;
}

export interface Analysis {
  id: number;
  analyst_id: number;
  analyst_name?: string;
  analyst_matricula?: string;
  company_name: string;
  cnpj: string;
  treatment_date: string;
  demand_number: string;
  demand_type: string;
  track: string;
  status: AnalysisStatus;
  status_observation: string;
  tag?: string;
  monitor_name: string;
  created_at: string;
  contest?: Contest;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action_type: string;
  timestamp: string;
  module: string;
  record_id: string;
  old_data: string;
  new_data: string;
  user_email: string;
}

export interface DashboardData {
  totalAnalyses: { count: number };
  byStatus: { status: string; count: number }[];
  byTrack: { track: string; count: number }[];
  evolution: { week: string; count: number; errors: number }[];
  errorsByTag: { tag: string; count: number }[];
}

export interface Notification {
  id: string;
  user_email: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}
