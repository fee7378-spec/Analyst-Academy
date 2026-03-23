export type UserRole = 'Administrador' | 'Monitor' | 'Analista';

export type PermissionLevel = 'view' | 'edit' | 'none';

export interface UserPermissions {
  dashboard: PermissionLevel;
  'nova-monitoria': PermissionLevel;
  supervisores: PermissionLevel;
  analistas: PermissionLevel;
  historico: PermissionLevel;
  logs: PermissionLevel;
  perfis: PermissionLevel;
  perfil: PermissionLevel;
  esteiras: PermissionLevel;
  processamento: PermissionLevel;
}

export interface User {
  id: number;
  name: string;
  email: string;
  matricula: string;
  supervisor?: string;
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

export interface Supervisor {
  id: number;
  name: string;
  matricula: string;
  role: 'supervisor';
  esteira?: string;
}

export type AnalysisStatus = 'Sim' | 'Não';

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
  observation: string;
  status: AnalysisStatus;
  status_observation: string;
  tag?: string;
  monitor_name: string;
  created_at: string;
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
  byType: { demand_type: string; count: number }[];
  byTrack: { track: string; count: number }[];
  evolution: { week: string; count: number; errors: number }[];
  errorsByType: { demand_type: string; count: number }[];
  errorsByTag: { tag: string; count: number }[];
  errorsByObservation: { observation: string; count: number }[];
}
