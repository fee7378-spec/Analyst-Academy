import { User, Analysis } from '../types';
import { db, auth, logsDb, ref, get, set, update, remove, push } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { DEMAND_TYPES, TAGS } from '../constants';

export function getPath(basePath: string, overrideSegment?: string) {
  if (typeof window !== 'undefined') {
    const segment = overrideSegment || localStorage.getItem('segment') || 'PJ';
    if (
      basePath === 'users' || basePath.startsWith('users/') ||
      basePath === 'templates' || basePath.startsWith('templates/')
    ) {
      return basePath;
    }
    if (basePath === 'counters/users' || basePath === 'counters/templates') {
      return basePath;
    }
    return segment === 'PF' ? `pf_${basePath}` : basePath;
  }
  return basePath;
}

export const normalizeString = (str: any) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const DEFAULT_PERMISSIONS = {
  dashboard: 'view',
  'nova-monitoria': 'view',
  analistas: 'none',
  historico: 'view',
  logs: 'none',
  perfis: 'none',
  perfil: 'view',
  esteiras: 'none'
};

const ADMIN_PERMISSIONS = {
  dashboard: 'edit',
  'nova-monitoria': 'edit',
  analistas: 'edit',
  historico: 'edit',
  logs: 'edit',
  perfis: 'edit',
  perfil: 'edit',
  esteiras: 'edit'
};

const initDb = async () => {
  try {
    // Initialize Admin User
    const usersRef = ref(db, getPath('users'));
    const usersSnapshot = await get(usersRef);
    if (!usersSnapshot.exists()) {
      const adminUser = {
        id: 1,
        name: "Admin Monitor",
        email: "admin@analista.com",
        matricula: "admin",
        role: "Administrador",
        esteira: "Senior Monitor",
        created_at: new Date().toISOString(),
        permissions: ADMIN_PERMISSIONS,
        is_first_access: true
      };
      const newRef = push(usersRef);
      await set(newRef, adminUser);
    }

    // Initialize Default Tracks (Only for PJ initially)
    const tracksRef = ref(db, 'tracks'); // explicitly 'tracks' not getPath('tracks') to avoid seeding PF
    const tracksSnapshot = await get(tracksRef);
    if (!tracksSnapshot.exists()) {
      const tracksToCreate = [
        { name: 'Extranet', icon: 'Globe' },
        { name: 'Abertura PJ', icon: 'FilePlus' },
        { name: 'PME', icon: 'Hammer' },
        { name: 'BKO', icon: 'Briefcase' },
        { name: 'Abono', icon: 'Wallet' },
        { name: 'BKO Abertura', icon: 'Briefcase' },
        { name: 'FATCA', icon: 'Globe' },
        { name: 'Vintage PJ', icon: 'Building2' },
        { name: 'SH-PME', icon: 'Store' },
        { name: 'Premium PJ', icon: 'Star' },
        { name: 'WM', icon: 'TrendingUp' },
        { name: 'Parametrização', icon: 'Settings' }
      ];

      for (const trackInfo of tracksToCreate) {
        const newTrackRef = push(tracksRef);
        await set(newTrackRef, {
          id: newTrackRef.key,
          name: trackInfo.name,
          icon: trackInfo.icon,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
      }
    }

    // Initialize Default Tracks for PF
    const pfTracksRef = ref(db, 'pf_tracks');
    const pfMetaRef = ref(db, 'pf_meta_version');
    const pfMetaSnapshot = await get(pfMetaRef);
    const PF_VERSION = '1.0.2'; // Increment this to force re-creation
    
    if (pfMetaSnapshot.val() !== PF_VERSION) {
      // Remove existing explicitly if we are re-creating
      const pfTracksSnapshot = await get(pfTracksRef);
      if (pfTracksSnapshot.exists()) {
        await remove(pfTracksRef);
      }
      
      const pfTracksToCreate = [
        { 
          name: 'Abertura PF', icon: 'FilePlus',
          demands: [
            'Task Less - Análise de Dados Complementares - Fatca', 'Task Less - Análise de Dados complementares - Cart Adm', 'Task Less - Análise ID (Maior Conjunta)', 'Task Less - Análise ID (Maior Individual)', 'Task Less - Análise ID (Menor Conjunta)', 'Task Less - Análise ID (Menor Individual)', 'Task Less - Análise ID + Dados complementares Vintage (curatela)', 'Task Less - Análise ID + Dados Complementares Vintage (Interdito)', 'Task Less - Análise ID (Menor com Representante)', 'Task Less - Análise ID (Maior com Representante)', 'Ajuste de Conta (Com bloqueio total e ativa a menos de 30 dias)', 'Erros de WorkFlow', 'Lembrete', 'Outra', 'Task Less – Onboarding Unificado Kids', 'Baixa de Documentos PF'
          ]
        },
        { 
          name: 'Manutenção PF', icon: 'Wrench',
          demands: [
            'Login Terceiros Criação', 'Login Terceiros Alteração', 'Login Terceiros Inativação e Exclusão de acesso', 'Report B3 (Cad Complementar)', 'Extranet Atualização', 'Extranet Liberação de termo', 'Task Less - Validação Manual de representante', 'Task Less - Aprovação de Nome', 'Task Less - documento Digital', 'Liberação de Termo', 'Encerramento de Conta', 'Contas Transferidas (Acervo)', 'Inclusão/Exclusão de Mercado', 'Inclusão Exclusão de Mercado Home Broker', 'Portal Previdência', 'Solicitação de Documentos', 'Erros Cetip (Cad Complementar)', 'Inclusão de relacionamento Complexo', 'Inclusão de Relacionamento Simples', 'Alter de segmento', 'Alterar Officer', 'Task FATCA - Revisão', 'Outra', 'Baixa de Documentos', 'Task Less – Validação Manual de Avalista', 'Revisão Cadastral – AM Gestor', 'Revisão Cadastral – AM Distribuição', 'Revisão Cadastral – AM Pactual', 'Revisão Cadastral – BRK', 'Revisão Cadastral – IB Advisors', 'Revisão Cadastral – IB B2B', 'Revisão Cadastral – IB B2C', 'Revisão Cadastral – Corban Amploan', 'Revisão Cadastral – IB Pactual', 'Revisão Cadastral – GRP', 'Revisão Cadastral – WM', 'Task Less – Revisão Cadastral – AM Gestor', 'Task Less – Revisão Cadastral – AM Distribuição', 'Task Less – Revisão Cadastral – AM Pactual', 'Task Less – Revisão Cadastral – BRK', 'Task Less – Revisão Cadastral – IB Advisors', 'Task Less – Revisão Cadastral – IB B2B', 'Task Less – Revisão Cadastral – IB B2C', 'Task Less – Revisão Cadastral – Corban Amploan', 'Task Less – Revisão Cadastral – IB Pactual', 'Task Less – Revisão Cadastral – GRP', 'Task Less – Revisão Cadastral – WM', 'Alteração de E-mail/Telefone', 'Atualização de Dados Cadastrais', 'Atualização de Conta Menor x Maior', 'Baixa de Documentos Complexos', 'Cadastro de Procuração', 'Callback', 'Desbloqueio/Bloqueio de Conta', 'CREDFlow'
          ]
        },
        { 
          name: 'Manutenção PF - BKO', icon: 'Briefcase',
          demands: [
            'REVISÃO CADASTRAL', 'REVISÃO CADASTRAL VIA TASK', 'ALTERAÇÃO DE E-MAIL/TELEFONE', 'AJUSTE DE NOME', 'BAIXA DE DOCUMENTOS', 'ATUALIZAÇÃO DE CONTA MENOR/MAIOR', 'CADASTRO DE PROCURAÇÃO', 'CALLBACK', 'REMOÇÃO DE ACESSO GLOBAL', 'LOGIN TERCEIROS CRIAÇÃO', 'LOGIN TERCEIROS INATIVAÇÃO E EXCLUSÃO DE ACESSO', 'LIBERAÇÃO DE TERMO', 'ENCERRAMENTO DE CONTA', 'INCLUSÃO/EXCLUSÃO DE MERCADO HOME BROKER', 'SOLICITAÇÃO DE DOCUMENTOS', 'INCLUSÃO DE RELACIONAMENTO COMPLEXO', 'INCLUSÃO DE RELACIONAMENTO SIMPLES', 'CURATELA', 'BLOQUEIO E DESBLOQUEIO', 'DUVIDAS E SOLICITAÇÕES', 'OUTRA', 'REMOÇÃO DE PENDÊNCIA', 'KIPREV', 'ATUALIZAÇÃO DE DADOS CADASTRAIS', 'INVENTÁRIO', 'ALTERAÇÃO DE ESTEIRA BPO', 'PRIORIDADES GRUPO WM', 'ENCERRAMENTO ESPÓLIO', 'DISTRATO DE CART ADM', 'ALTERAÇÃO DE OFFICER', 'MIGRAÇÃO DE SEGMENTO', 'LOGIN TERCEIROS ALTERAÇÃO'
          ]
        },
        { 
          name: 'Abertura PF - BKO', icon: 'FilePlus',
          demands: [
            'CADASTRO CGE', 'SEGURO AGRO', 'ENFORCE (CGE)', 'DUVIDAS E SOLICITAÇÕES', 'DESBLOQUEIO', 'TASK LESS - ANALISE DE DADOS COMPLEMENTARES - FATCA', 'TASK LESS - ANALISE DE DADOS COMPLEMENTARES - CART ADM', 'TASK LESS - ANALISE DE DADOS COMPLEMENTARES - ANALISE DE DADOS FINANCEIROS', 'TASK LESS - ANALISE ID (MENOR CONJUNTA)', 'TASK LESS - ANALISE ID (MENOR INDIVIDUAL)', 'TASK LESS - ANALISE ID + DADOS COMPLEMENTARES CINTAGE (INTERDITO)', 'TASK LESS - ANALISE ID (MENOR REPRESENTANTE)', 'TASK LESS - ANALISE ID (MAIOR REPRESENTANTE)', 'TASK LESS - ANALISE ID (MAIOR CONJUNTA)', 'TASK LESS - ANALISE ID (MAIOR INDIVIDUAL)', 'AJUSTE DE CONTA (COM BLOQUEIO TOTAL E ATIVA A MENOS DE 30 DIAS)', 'LEMBRTE', 'ERRO DE WORKFLOW', 'OUTRA', 'PRIORIDADES GRUPO WM', 'APROVAÇÃO DE PROCURAÇÃO', 'AJUSTE PORTAL ADMIN'
          ]
        },
        { 
          name: 'Vintage PF', icon: 'Star',
          demands: [
            'Abertura I - Carteira Adm (Espelho)', 'Abertura WM', 'Abertura WM - Carteira Adm (Espelho)', 'Abertura Op tin', 'Abertura Contas Transferidas Entuba', 'Criação CGE Parceiro', 'Desbloqueio/Criação de acesso (Conta com bloqueio Total)', 'Abertura Espólio', 'Abertura Alternative Funds Inventário com marcação escritural', 'Abertura Ações Escriturais', 'Abertura Inventário', 'Abertura Conta Cotizada', 'Abertura Extranet/Distribuição', 'Abertura Alternative Funds', 'Abertura Fundos Escriturais', 'Abertura IB GRP', 'Abertura IB ADVISOR', 'Abertura IB B2C', 'Abertura IB B2B', 'Conta Vinculada', 'Abertura IB PACTUAL (CORPORATE)', 'Abertura BRK', 'Outra', 'Abertura Ações Escriturais Funds Service', 'Abertura IB Pactual (Corretora)', 'CREDFlow', 'Ajuste de Dados Portal Admin', 'Cadastro CGE – Novos Acessos', 'Enforce (CGE)'
          ]
        },
        { 
          name: 'Fatca', icon: 'Globe',
          demands: [ 'Fatca' ]
        }
      ];

      for (const trackInfo of pfTracksToCreate) {
        const newTrackRef = push(pfTracksRef);
        await set(newTrackRef, {
          id: newTrackRef.key,
          name: trackInfo.name,
          icon: trackInfo.icon,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
            demandTypes: trackInfo.demands,
            tags: ['Aprovação indevida', 'Reprovação indevida', 'Dados divergentes', 'Interação Salesforce', 'Falha na análise', 'Tabulação', 'Procedimento incorreto e/ou incompleto.']
          }
        });
      }
      await set(pfMetaRef, PF_VERSION);
    }
  } catch (e) {
    console.error("Error initializing DB:", e);
  }
};

initDb();

const logAction = async (action: string, details: string) => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const logsRef = ref(logsDb, getPath('logs'));
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      id: Date.now(),
      user_name: user?.name || 'Sistema',
      user_email: user?.email || '',
      user_role: user?.role || '',
      action,
      details,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error logging action:", e);
  }
};

const getNextId = async (counterName: string): Promise<number> => {
  const counterRef = ref(db, getPath(`counters/${counterName}`));
  const snapshot = await get(counterRef);
  let currentId = snapshot.exists() ? snapshot.val() : 1;
  if (counterName === 'users' && !snapshot.exists()) {
    currentId = 3;
  }
  await set(counterRef, currentId + 1);
  return currentId;
};


export const api = {
  async checkEmail(identifier: string) {
    const usersRef = ref(db, getPath('users'));
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const normalizedId = String(identifier || '').toLowerCase().trim();
    
    const userKey = Object.keys(usersObj).find(key => {
      const u = usersObj[key];
      if (!u || typeof u !== 'object') return false;
      const emailMatch = String(u.email || '').toLowerCase().trim() === normalizedId;
      const matriculaMatch = String(u.matricula || '').toLowerCase().trim() === normalizedId;
      return emailMatch || matriculaMatch;
    });
    
    if (!userKey) throw new Error('Usuário não encontrado');
    const user = usersObj[userKey];
    return { isFirstAccess: user.is_first_access, email: user.email };
  },

  async setPassword(identifier: string, password: string) {
    const usersRef = ref(db, getPath('users'));
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const normalizedId = String(identifier || '').toLowerCase().trim();
    const userKey = Object.keys(usersObj).find(key => {
      const u = usersObj[key];
      if (!u || typeof u !== 'object') return false;
      const emailMatch = String(u.email || '').toLowerCase().trim() === normalizedId;
      const matriculaMatch = String(u.matricula || '').toLowerCase().trim() === normalizedId;
      return emailMatch || matriculaMatch;
    });
    
    if (!userKey) throw new Error('Usuário não encontrado');
    const user = usersObj[userKey];
    const actualEmail = user.email;

    if (!actualEmail) throw new Error('Usuário não possui e-mail cadastrado');

    try {
      // Try to create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, actualEmail, password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // Update database to reflect that the user is already set up, and store the new password
        // since we can't change it in Firebase Auth from the client.
        await update(ref(db, getPath(`users/${userKey}`)), { is_first_access: false, password: password });
        
        user.is_first_access = false;
        user.password = password;
        const token = 'mock-jwt-token-' + user.id;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { message: 'Senha definida com sucesso', token, user };
      }
      throw new Error(error.message || 'Erro ao criar usuário no autenticador');
    }

    user.is_first_access = false;
    await update(ref(db, getPath(`users/${userKey}`)), { is_first_access: false });
    
    const token = await auth.currentUser?.getIdToken();
    localStorage.setItem('token', token || 'mock-token');
    localStorage.setItem('user', JSON.stringify(user));
    
    return { message: 'Senha definida com sucesso', token, user };
  },

  async resetPasswordDirect(userId: number, adminPassword: string) {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error('Administrador não autenticado');

    try {
      // Verify admin password
      await signInWithEmailAndPassword(auth, currentUser.email, adminPassword);
    } catch (error) {
      throw new Error('Senha do administrador incorreta');
    }

    const snapshot = await get(ref(db, getPath('users')));
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const userKey = Object.keys(usersObj).find(key => usersObj[key].id === userId);
    if (!userKey) throw new Error('Usuário não encontrado');

    const targetUser = usersObj[userKey];
    
    await update(ref(db, getPath(`users/${userKey}`)), { 
      password: 'Mudar@123',
      is_first_access: true
    });

    await logAction('reset_password', `Senha redefinida diretamente para o usuário: ${targetUser.email}`);
    return { success: true, message: 'Senha redefinida para Mudar@123' };
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      await logAction('reset_password', `Solicitou redefinição de senha para: ${email}`);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao enviar e-mail de redefinição de senha');
    }
  },

  async login(identifier: string, password: string) {
    const normalizedId = String(identifier || '').toLowerCase().trim();
    
    // First, find the user in the database to get their actual email
    const usersRef = ref(db, getPath('users'));
    const snapshot = await get(usersRef);
    let userData = null;
    let actualEmail = null;
    let userKey = null;
    
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      userKey = Object.keys(usersObj).find(key => {
        const u = usersObj[key];
        if (!u || typeof u !== 'object') return false;
        const emailMatch = String(u.email || '').toLowerCase().trim() === normalizedId;
        const matriculaMatch = String(u.matricula || '').toLowerCase().trim() === normalizedId;
        return emailMatch || matriculaMatch;
      });
      
      if (userKey) {
        userData = usersObj[userKey];
        actualEmail = userData.email;
      }
    }
    
    if (!userData) throw new Error('Usuário não encontrado no banco de dados');
    if (!actualEmail) throw new Error('Usuário não possui e-mail cadastrado');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, actualEmail, password);
      const token = await userCredential.user.getIdToken();
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { token, user: userData };
    } catch (error: any) {
      // Fallback for default admin or users with password in DB but not in Auth
      if (userData.password === password) {
        try {
          // Try to migrate them to Firebase Auth
          try {
            await createUserWithEmailAndPassword(auth, actualEmail, password);
          } catch (createError: any) {
            if (createError.code !== 'auth/email-already-in-use') {
              throw createError;
            }
          }
          const userCredential = await signInWithEmailAndPassword(auth, actualEmail, password);
          const token = await userCredential.user.getIdToken();
          
          // Remove plaintext password from DB
          if (userKey) {
            await update(ref(db, getPath(`users/${userKey}`)), { password: null });
          }
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          return { token, user: userData };
        } catch (migrationError) {
          console.error("Migration to Auth failed:", migrationError);
          // If migration fails (e.g., wrong password in auth), just use mock token
          const token = 'mock-jwt-token-' + (userData as any).id;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          return { token, user: userData };
        }
      }
      throw new Error('Credenciais inválidas');
    }
  },

  async getAnalysts() {
    const snapshot = await get(ref(db, getPath('analysts')));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()).filter(Boolean) as any[];
  },

  async createAnalyst(data: any) {
    const nextId = await getNextId('analysts');
    const newAnalyst = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString()
    };
    
    const newRef = push(ref(db, getPath('analysts')));
    await set(newRef, newAnalyst);
    await logAction('Criar Analista', `Analista ${data.name} criado`);
    return newAnalyst;
  },

  async updateAnalyst(id: number, data: any) {
    const snapshot = await get(ref(db, getPath('analysts')));
    if (!snapshot.exists()) throw new Error('Analista não encontrado');
    
    const analystsObj = snapshot.val();
    const analystKey = Object.keys(analystsObj).find(key => analystsObj[key].id === id);
    if (!analystKey) throw new Error('Analista não encontrado');
    
    await update(ref(db, getPath(`analysts/${analystKey}`)), data);
    await logAction('Atualizar Analista', `Analista ID ${id} atualizado`);
    return { ...analystsObj[analystKey], ...data };
  },

  async deleteAnalyst(id: number) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      try {
        const latestUser = await this.getUser(user.id);
        const permissions = latestUser.permissions || {};
        const canEdit = latestUser.role === 'Administrador' || permissions['analistas'] === 'edit';
        if (!canEdit) {
           throw new Error('Você não tem permissão para realizar esta ação');
        }
      } catch (err: any) {
        if (err.message === 'Você não tem permissão para realizar esta ação') {
          throw err;
        }
      }
    }

    const snapshot = await get(ref(db, getPath('analysts')));
    if (!snapshot.exists()) return { success: true };
    
    const analystsObj = snapshot.val();
    const analystKey = Object.keys(analystsObj).find(key => analystsObj[key].id === id);
    if (analystKey) {
      await remove(ref(db, getPath(`analysts/${analystKey}`)));
      await logAction('Excluir Analista', `Analista ID ${id} excluído`);
    }
    return { success: true };
  },

  async getAnalyst(id: number) {
    const snapshot = await get(ref(db, getPath('analysts')));
    if (!snapshot.exists()) throw new Error('Analista não encontrado');
    const analystsObj = snapshot.val();
    const analyst = Object.values(analystsObj).find((u: any) => u.id === id);
    if (!analyst) throw new Error('Analista não encontrado');
    return analyst;
  },

  async getAnalyses() {
    const snapshot = await get(ref(db, getPath('analyses')));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()).filter(Boolean);
  },

  async createAnalysis(data: any) {
    const analystsSnapshot = await get(ref(db, getPath('analysts')));
    let analystName = '';
    let analystMatricula = '';
    
    if (analystsSnapshot.exists()) {
      const analysts = Object.values(analystsSnapshot.val()) as any[];
      const analyst = analysts.find(u => u.id === Number(data.analyst_id));
      if (analyst) {
        analystName = analyst.name;
        analystMatricula = analyst.matricula;
      }
    }

    const nextId = await getNextId('analyses');
    const newAnalysis = { 
      ...data, 
      id: nextId,
      analyst_name: analystName,
      analyst_matricula: analystMatricula,
      created_at: new Date().toISOString()
    };
    
    const newRef = push(ref(db, getPath('analyses')));
    await set(newRef, newAnalysis);
    await logAction('Criar Monitoria', `Monitoria ${data.demand_number} criada`);
    return newAnalysis;
  },

  async updateAnalysis(id: number, data: any) {
    const snapshot = await get(ref(db, getPath('analyses')));
    if (!snapshot.exists()) throw new Error('Monitoria não encontrada');
    
    const analysesObj = snapshot.val();
    const analysisKey = Object.keys(analysesObj).find(key => analysesObj[key].id === id);
    if (!analysisKey) throw new Error('Monitoria não encontrada');
    
    if (data.analyst_id) {
      const analystsSnapshot = await get(ref(db, getPath('analysts')));
      if (analystsSnapshot.exists()) {
        const analysts = Object.values(analystsSnapshot.val()) as any[];
        const analyst = analysts.find(u => u.id === Number(data.analyst_id));
        if (analyst) {
          data.analyst_name = analyst.name;
          data.analyst_matricula = analyst.matricula;
        }
      }
    }
    
    await update(ref(db, getPath(`analyses/${analysisKey}`)), data);
    await logAction('Atualizar Monitoria', `Monitoria ID ${id} atualizada`);
    return { ...analysesObj[analysisKey], ...data };
  },

  async deleteAnalysis(id: number) {
    const snapshot = await get(ref(db, getPath('analyses')));
    if (!snapshot.exists()) return { success: true };
    
    const analysesObj = snapshot.val();
    const analysisKey = Object.keys(analysesObj).find(key => analysesObj[key].id === id);
    if (analysisKey) {
      await remove(ref(db, getPath(`analyses/${analysisKey}`)));
      await logAction('Excluir Monitoria', `Monitoria ID ${id} excluída`);
    }
    return { success: true };
  },

  async deleteAnalyses(period: string) {
    const snapshot = await get(ref(db, getPath('analyses')));
    if (!snapshot.exists()) return { success: true };
    
    const analyses = snapshot.val();
    const now = new Date().getTime();
    const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
    
    const updates: any = {};
    Object.keys(analyses).forEach(key => {
      const analysis = analyses[key];
      const analysisTime = new Date(analysis.created_at || new Date().toISOString()).getTime();
      
      let shouldDelete = false;
      if (period === 'all') {
        shouldDelete = true;
      } else {
        const days = parseInt(period);
        if (now - analysisTime > daysToMs(days)) {
          shouldDelete = true;
        }
      }
      
      if (shouldDelete) {
        updates[key] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(db, getPath('analyses')), updates);
      await logAction('Limpar Histórico', `Histórico de monitorias limpo (Período: ${period})`);
    }
    return { success: true };
  },

  async getLogs() {
    const snapshot = await get(ref(logsDb, getPath('logs')));
    if (!snapshot.exists()) return [];
    const logs = Object.values(snapshot.val()) as any[];
    return logs.map(log => {
      const actionParts = (log.action || '').split(' ');
      const actionType = actionParts[0] || 'Ação';
      const module = actionParts.slice(1).join(' ') || 'Sistema';
      
      return {
        id: log.id,
        user_name: log.user_name || 'Sistema',
        user_role: log.user_role || '',
        action_type: actionType,
        timestamp: log.created_at || new Date().toISOString(),
        module: module,
        record_id: log.record_id || '',
        old_data: log.old_data || '',
        new_data: log.new_data || '',
        user_email: log.user_email || '',
        details: log.details || ''
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async deleteLogs(period: string) {
    const snapshot = await get(ref(logsDb, getPath('logs')));
    if (!snapshot.exists()) return { success: true };
    
    const logs = snapshot.val();
    const now = new Date().getTime();
    const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
    
    const updates: any = {};
    Object.keys(logs).forEach(key => {
      const log = logs[key];
      const logTime = new Date(log.created_at || new Date().toISOString()).getTime();
      
      let shouldDelete = false;
      if (period === 'all') {
        shouldDelete = true;
      } else {
        const days = parseInt(period);
        if (now - logTime > daysToMs(days)) {
          shouldDelete = true;
        }
      }
      
      if (shouldDelete) {
        updates[key] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(logsDb, getPath('logs')), updates);
    }
    return { success: true };
  },

  async getUsers() {
    const snapshot = await get(ref(db, getPath('users')));
    if (!snapshot.exists()) return [];
    const users = Object.values(snapshot.val()) as any[];
    return users.map(({ password, ...u }) => u);
  },

  async getTemplates() {
    const snapshot = await get(ref(db, getPath('templates')));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()) as any[];
  },

  async createTemplate(templateData: any) {
    const id = Date.now().toString();
    const newTemplate = { ...templateData, id };
    await set(ref(db, getPath(`templates/${id}`)), newTemplate);
    await logAction('Criar Template', `Template ${templateData.name} criado`);
    return newTemplate;
  },

  async updateTemplate(id: string, templateData: any) {
    await update(ref(db, getPath(`templates/${id}`)), templateData);
    
    // Update all users that use this template
    const usersSnapshot = await get(ref(db, getPath('users')));
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const updates: any = {};
      Object.keys(users).forEach(key => {
        if (users[key].templateId === id) {
          updates[`${key}/permissions`] = templateData.permissions;
          if (templateData.name) {
            updates[`${key}/role`] = templateData.name;
          }
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db, getPath('users')), updates);
      }
    }
    
    await logAction('Editar Template', `Template ${templateData.name || id} atualizado`);
    return { success: true };
  },

  async deleteTemplate(id: string) {
    await remove(ref(db, getPath(`templates/${id}`)));
    await logAction('Excluir Template', `Template ID ${id} excluído`);
    return { success: true };
  },

  async getUser(id: number) {
    const snapshot = await get(ref(db, getPath('users')));
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    const usersObj = snapshot.val();
    const user = Object.values(usersObj).find((u: any) => u.id === id);
    if (!user) throw new Error('Usuário não encontrado');
    const { password, ...u } = user as any;
    return u;
  },

  async createUser(data: any) {
    const snapshot = await get(ref(db, getPath('users')));
    const normalizedEmail = String(data.email || '').toLowerCase().trim();
    if (snapshot.exists()) {
      const users = Object.values(snapshot.val()) as any[];
      if (users.some(u => String(u.email || '').toLowerCase().trim() === normalizedEmail)) {
        throw new Error('E-mail já cadastrado');
      }
    }

    const nextId = await getNextId('users');
    const newUser = {
      ...data,
      email: normalizedEmail || '',
      id: nextId,
      matricula: normalizedEmail ? normalizedEmail.split('@')[0] : '',
      created_at: new Date().toISOString(),
      is_first_access: true,
      permissions: data.permissions || DEFAULT_PERMISSIONS
    };
    
    const newRef = push(ref(db, getPath('users')));
    await set(newRef, newUser);
    await logAction('Criar Usuário', `Usuário ${data.name} criado`);
    return newUser;
  },

  async updateUser(id: number, data: any) {
    const snapshot = await get(ref(db, getPath('users')));
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const userKey = Object.keys(usersObj).find(key => usersObj[key].id === id);
    if (!userKey) throw new Error('Usuário não encontrado');
    
    await update(ref(db, getPath(`users/${userKey}`)), data);
    await logAction('Atualizar Usuário', `Usuário ID ${id} atualizado`);
    return { ...usersObj[userKey], ...data };
  },

  async deleteUser(id: number) {
    const snapshot = await get(ref(db, getPath('users')));
    if (!snapshot.exists()) return { success: true };
    
    const usersObj = snapshot.val();
    const userKey = Object.keys(usersObj).find(key => usersObj[key].id === id);
    if (userKey) {
      await remove(ref(db, getPath(`users/${userKey}`)));
      await logAction('Excluir Usuário', `Usuário ID ${id} excluído`);
    }
    return { success: true };
  },

  async getDashboard(params?: { track?: string; analyst_id?: string; start_date?: string; end_date?: string }) {
    const analysesSnapshot = await get(ref(db, getPath('analyses')));
    const usersSnapshot = await get(ref(db, getPath('users')));
    
    const analyses = analysesSnapshot.exists() ? Object.values(analysesSnapshot.val()) as any[] : [];
    const users = usersSnapshot.exists() ? Object.values(usersSnapshot.val()) as any[] : [];
    
    let filtered = [...analyses];

    if (params?.start_date) {
      filtered = filtered.filter(a => a.treatment_date >= params.start_date!);
    }
    if (params?.end_date) {
      filtered = filtered.filter(a => a.treatment_date <= params.end_date!);
    }
    if (params?.analyst_id) {
      filtered = filtered.filter(a => Number(a.analyst_id) === Number(params.analyst_id));
    }
    if (params?.track) {
      filtered = filtered.filter(a => a.track === params.track);
    }

    const byStatusMap = filtered.reduce((acc, a) => {
      const status = a.status || 'Não';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

    const byTrackMap = filtered.reduce((acc, a) => {
      const trackName = a.track || 'Desconhecido';
      acc[trackName] = (acc[trackName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byTrack = Object.entries(byTrackMap).map(([track, count]) => ({ track, count }));

    // Productivity aggregation
    const analystsSnapshot = await get(ref(db, getPath('analysts')));
    const allAnalysts = analystsSnapshot.exists() ? Object.values(analystsSnapshot.val()) as any[] : [];
    
    const productivityByAnalystMap: Record<string, number> = {};
    const productivityByTrackMap: Record<string, number> = {};
    
    allAnalysts.forEach(analyst => {
      if (params?.analyst_id && Number(analyst.id) !== Number(params.analyst_id)) return;
      
      let analystTotal = 0;
      if (analyst.productivity) {
        Object.entries(analyst.productivity).forEach(([dateKey, value]) => {
          if (params?.start_date && dateKey < params.start_date) return;
          if (params?.end_date && dateKey > params.end_date) return;
          
          const val = Number(value) || 0;
          analystTotal += val;
          
          if (!params?.track || analyst.esteira === params.track) {
            productivityByTrackMap[analyst.esteira] = (productivityByTrackMap[analyst.esteira] || 0) + val;
          }
        });
      }
      
      if (!params?.track || analyst.esteira === params.track) {
        productivityByAnalystMap[analyst.name] = (productivityByAnalystMap[analyst.name] || 0) + analystTotal;
      }
    });

    const productivityByAnalyst = Object.entries(productivityByAnalystMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const productivityByTrack = Object.entries(productivityByTrackMap)
      .map(([track, count]) => ({ track, count }))
      .sort((a, b) => b.count - a.count);

    const evolution: any[] = [];
    const referenceDate = params?.start_date ? new Date(params.start_date + 'T12:00:00Z') : new Date();
    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth();
    
    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(Date.UTC(year, month, (i * 7) + 1));
      if (weekStart.getUTCMonth() !== month) break;
      
      let weekEnd = new Date(Date.UTC(year, month, (i * 7) + 7));
      if (weekEnd.getUTCMonth() !== month) {
        weekEnd = new Date(Date.UTC(year, month + 1, 0));
      }
      
      const weekLabel = `Semana ${i + 1}`;
      
      const weekAnalyses = filtered.filter(a => {
        if (!a.treatment_date) return false;
        const parts = String(a.treatment_date).split('-');
        if (parts.length !== 3) return false;
        const [y, m, d] = parts.map(Number);
        const dTime = Date.UTC(y, m - 1, d);
        return dTime >= weekStart.getTime() && dTime <= weekEnd.getTime();
      });

      let weekProductivity = 0;
      allAnalysts.forEach(analyst => {
        if (params?.analyst_id && Number(analyst.id) !== Number(params.analyst_id)) return;
        if (params?.track && analyst.esteira !== params.track) return;

        if (analyst.productivity) {
          Object.entries(analyst.productivity).forEach(([dateKey, value]) => {
            const parts = dateKey.split('-');
            if (parts.length !== 3) return;
            const [y, m, d] = parts.map(Number);
            const dTime = Date.UTC(y, m - 1, d);
            if (dTime >= weekStart.getTime() && dTime <= weekEnd.getTime()) {
              weekProductivity += (Number(value) || 0);
            }
          });
        }
      });

      const daily: { day: string, count: number, errors: number, productivity: number }[] = [];
      const daysInWeek = (weekEnd.getUTCDate() - weekStart.getUTCDate()) + 1;
      for (let d = 0; d < daysInWeek; d++) {
        const dayDate = new Date(Date.UTC(year, month, weekStart.getUTCDate() + d));
        const dayLabel = `${dayDate.getUTCDate().toString().padStart(2, '0')}/${(dayDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        const dayKey = `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dayDate.getUTCDate()).padStart(2, '0')}`;
        
        const dayAnalyses = weekAnalyses.filter(a => {
          if (!a.treatment_date) return false;
          const parts = String(a.treatment_date).split('-');
          if (parts.length !== 3) return false;
          const [ay, am, ad] = parts.map(Number);
          return ad === dayDate.getUTCDate() && (am - 1) === dayDate.getUTCMonth() && ay === dayDate.getUTCFullYear();
        });

        let dayProductivity = 0;
        allAnalysts.forEach(analyst => {
          if (params?.analyst_id && Number(analyst.id) !== Number(params.analyst_id)) return;
          if (params?.track && analyst.esteira !== params.track) return;
          if (analyst.productivity && analyst.productivity[dayKey]) {
            dayProductivity += (Number(analyst.productivity[dayKey]) || 0);
          }
        });

        if (dayAnalyses.length > 0 || dayProductivity > 0) {
          daily.push({ 
            day: dayLabel, 
            count: dayAnalyses.length,
            errors: dayAnalyses.filter(a => a.status === 'Sim').length,
            productivity: dayProductivity
          });
        }
      }

      evolution.push({
        week: weekLabel,
        count: weekAnalyses.length,
        errors: weekAnalyses.filter(a => a.status === 'Sim').length,
        productivity: weekProductivity,
        daily
      });
    }

    const errorsByTrackMap = filtered.filter(a => a.status === 'Sim').reduce((acc, a) => {
      acc[a.track] = (acc[a.track] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const errorsByTrack = Object.entries(errorsByTrackMap).map(([track, count]) => ({ track, count }));

    return {
      totalAnalyses: { count: filtered.length },
      byStatus,
      byTrack,
      evolution,
      errorsByTrack,
      productivityByAnalyst,
      productivityByTrack
    };
  },

  async getTracks() {
    const snapshot = await get(ref(db, getPath('tracks')));
    if (!snapshot.exists()) return [];

    const tracksMap = new Map();
    const allTracks = Object.values(snapshot.val()).filter(Boolean) as any[];
    
    // Sort by date to keep the oldest one if duplicates exist
    allTracks.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    allTracks.forEach(track => {
      const normalizedName = String(track.name || '').toLowerCase().trim();
      if (!tracksMap.has(normalizedName)) {
        tracksMap.set(normalizedName, track);
      }
    });

    return Array.from(tracksMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  async createTrack(trackData: any) {
    const snapshot = await get(ref(db, getPath('tracks')));
    if (snapshot.exists()) {
      const existing = Object.values(snapshot.val()).filter(Boolean) as any[];
      if (existing.some(t => String(t.name || '').toLowerCase().trim() === String(trackData.name || '').toLowerCase().trim())) {
        throw new Error('Já existe uma esteira com este nome');
      }
    }

    const newRef = push(ref(db, getPath('tracks')));
    const track = { ...trackData, id: newRef.key, created_at: new Date().toISOString() };
    await set(newRef, track);
    await logAction('Criar Esteira', `Esteira ${track.name} criada`);
    return track;
  },

  async cleanupTracks() {
    const snapshot = await get(ref(db, getPath('tracks')));
    if (!snapshot.exists()) return;

    const allTracks = Object.values(snapshot.val()).filter(Boolean) as any[];
    const tracksMap = new Map();
    const toDelete: string[] = [];

    // Sort by date to keep the oldest
    allTracks.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    allTracks.forEach(track => {
      const normalizedName = String(track.name || '').toLowerCase().trim();
      if (!tracksMap.has(normalizedName)) {
        tracksMap.set(normalizedName, track.id);
      } else {
        toDelete.push(track.id);
      }
    });

    for (const id of toDelete) {
      await remove(ref(db, getPath(`tracks/${id}`)));
    }
    
    await logAction('Limpeza de Esteiras', `${toDelete.length} esteiras duplicadas removidas`);
    return toDelete.length;
  },

  async updateTrack(id: string, trackData: any) {
    const snapshot = await get(ref(db, getPath('tracks')));
    if (!snapshot.exists()) return null;
    const tracks = snapshot.val();
    const trackKey = Object.keys(tracks).find(key => tracks[key].id === id || key === id);
    
    if (trackKey) {
      await update(ref(db, getPath(`tracks/${trackKey}`)), trackData);
      await logAction('Editar Esteira', `Esteira ${trackData.name || id} editada`);
      return { ...tracks[trackKey], ...trackData };
    }
    return null;
  },

  async bulkRenameDemandType(oldName: string, newName: string, trackIds: string[]) {
    // 1. Update Tracks
    const tracksSnapshot = await get(ref(db, getPath('tracks')));
    const trackNames: string[] = [];
    if (tracksSnapshot.exists()) {
      const tracks = tracksSnapshot.val();
      const trackUpdates: any = {};
      Object.keys(tracks).forEach(key => {
        if (trackIds.includes(tracks[key].id)) {
          trackNames.push(tracks[key].name);
          const currentTypes = tracks[key].formConfig?.demandTypes || [];
          if (currentTypes.includes(oldName)) {
            const newTypes = currentTypes.map((t: string) => t === oldName ? newName : t);
            trackUpdates[`tracks/${key}/formConfig/demandTypes`] = newTypes;
          }
        }
      });
      if (Object.keys(trackUpdates).length > 0) {
        await update(ref(db), trackUpdates);
      }
    }

    // 2. Update Analyses
    const analysesSnapshot = await get(ref(db, getPath('analyses')));
    if (analysesSnapshot.exists()) {
      const analyses = analysesSnapshot.val();
      const analysisUpdates: any = {};
      Object.keys(analyses).forEach(key => {
        const analysis = analyses[key];
        // Only update if it belongs to one of the selected tracks AND has the old name
        if (trackNames.includes(analysis.track) && analysis.demand_type === oldName) {
          analysisUpdates[`analyses/${key}/demand_type`] = newName;
        }
      });
      if (Object.keys(analysisUpdates).length > 0) {
        await update(ref(db), analysisUpdates);
      }
    }
    
    await logAction('Renomear Tipo de Demanda', `Renomeado de "${oldName}" para "${newName}" em ${trackIds.length} esteiras`);
    return { success: true };
  },

  async deleteTrack(id: string) {
    const snapshot = await get(ref(db, getPath('tracks')));
    if (!snapshot.exists()) return { success: false };
    const tracks = snapshot.val();
    const trackKey = Object.keys(tracks).find(key => tracks[key].id === id || key === id);
    
    if (trackKey) {
      await remove(ref(db, getPath(`tracks/${trackKey}`)));
      await logAction('Excluir Esteira', `Esteira ID ${id} excluída`);
    }
    return { success: true };
  },

  async saveConsolidatedData(data: any[], segment?: string) {
    const now = new Date().toISOString();
    await set(ref(db, getPath('consolidated_data', segment)), data);
    await set(ref(db, getPath('metadata/last_processing_date', segment)), now);
    await logAction('Consolidar Base', `${data.length} registros consolidados na base ${segment || 'Atual'}`);
    return { success: true };
  },

  async getLastProcessingDate(segment?: string) {
    const snapshot = await get(ref(db, getPath('metadata/last_processing_date', segment)));
    if (!snapshot.exists()) return null;
    return snapshot.val() as string;
  },

  async getConsolidatedData(segment?: string) {
    const snapshot = await get(ref(db, getPath('consolidated_data', segment)));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Array.isArray(data) ? data : Object.values(data);
  },

  async deleteConsolidatedData(segment?: string) {
    await remove(ref(db, getPath('consolidated_data', segment)));
    await remove(ref(db, getPath('metadata/last_processing_date', segment)));
    
    // Also clear productivity from all analysts
    const analystsSnapshot = await get(ref(db, getPath('analysts', segment)));
    if (analystsSnapshot.exists()) {
      const analystsObj = analystsSnapshot.val();
      const updates: any = {};
      Object.keys(analystsObj).forEach(key => {
        updates[`${getPath('analysts', segment)}/${key}/productivity`] = null;
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    }

    await logAction('Excluir Base Consolidada', `Toda a base de dados consolidada e produtividade dos analistas da base ${segment || 'Atual'} foram excluídas`);
    return { success: true };
  },

  async updateAnalystsProductivity(productivityMap: Record<string, Record<string, number>>, segment?: string) {
    const snapshot = await get(ref(db, getPath('analysts', segment)));
    if (!snapshot.exists()) return { success: false };
    
    const analystsObj = snapshot.val();
    const updates: any = {};
    
    Object.keys(analystsObj).forEach(key => {
      const analyst = analystsObj[key];
      const normalizedAnalystName = normalizeString(analyst.name);
      
      if (productivityMap[normalizedAnalystName]) {
        // Sanitize keys in the inner map to ensure they are safe for Firebase
        const sanitizedMap: Record<string, number> = {};
        Object.entries(productivityMap[normalizedAnalystName]).forEach(([dateKey, value]) => {
          const safeKey = dateKey.replace(/[\.\#\$\/\[\]]/g, '-');
          sanitizedMap[safeKey] = value;
        });
        updates[`${getPath('analysts', segment)}/${key}/productivity`] = sanitizedMap;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      await logAction('Atualizar Produtividade', `Produtividade de ${Object.keys(updates).length} analistas atualizada na base ${segment || 'Atual'}`);
    }
    
    return { success: true };
  }
};
