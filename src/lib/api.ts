import { User, Supervisor, Analysis } from '../types';
import { db, auth, logsDb, ref, get, set, update, remove, push } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { DEMAND_TYPES, TAGS } from '../constants';

export const normalizeString = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const DEFAULT_PERMISSIONS = {
  dashboard: 'view',
  'nova-monitoria': 'view',
  supervisores: 'none',
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
  supervisores: 'edit',
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
    const usersRef = ref(db, 'users');
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

    // Initialize Default Tracks
    const tracksRef = ref(db, 'tracks');
    const tracksSnapshot = await get(tracksRef);
    if (!tracksSnapshot.exists()) {
      const tracksToCreate = [
        { name: 'Extranet', icon: 'Globe' },
        { name: 'Abertura', icon: 'FilePlus' },
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
  } catch (e) {
    console.error("Error initializing DB:", e);
  }
};

initDb();

const logAction = async (action: string, details: string) => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const logsRef = ref(logsDb, 'logs');
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
  const counterRef = ref(db, `counters/${counterName}`);
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
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const normalizedId = identifier.toLowerCase().trim();
    
    const userKey = Object.keys(usersObj).find(key => {
      const u = usersObj[key];
      if (!u || typeof u !== 'object') return false;
      const emailMatch = u.email?.toLowerCase().trim() === normalizedId;
      const matriculaMatch = u.matricula?.toLowerCase().trim() === normalizedId;
      return emailMatch || matriculaMatch;
    });
    
    if (!userKey) throw new Error('Usuário não encontrado');
    const user = usersObj[userKey];
    return { isFirstAccess: user.is_first_access, email: user.email };
  },

  async setPassword(identifier: string, password: string) {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const normalizedId = identifier.toLowerCase().trim();
    const userKey = Object.keys(usersObj).find(key => {
      const u = usersObj[key];
      if (!u || typeof u !== 'object') return false;
      const emailMatch = u.email?.toLowerCase().trim() === normalizedId;
      const matriculaMatch = u.matricula?.toLowerCase().trim() === normalizedId;
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
        await update(ref(db, `users/${userKey}`), { is_first_access: false, password: password });
        
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
    await update(ref(db, `users/${userKey}`), { is_first_access: false });
    
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

    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const userKey = Object.keys(usersObj).find(key => usersObj[key].id === userId);
    if (!userKey) throw new Error('Usuário não encontrado');

    const targetUser = usersObj[userKey];
    
    await update(ref(db, `users/${userKey}`), { 
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
    const normalizedId = identifier.toLowerCase().trim();
    
    // First, find the user in the database to get their actual email
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let userData = null;
    let actualEmail = null;
    let userKey = null;
    
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      userKey = Object.keys(usersObj).find(key => {
        const u = usersObj[key];
        if (!u || typeof u !== 'object') return false;
        const emailMatch = u.email?.toLowerCase().trim() === normalizedId;
        const matriculaMatch = u.matricula?.toLowerCase().trim() === normalizedId;
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
            await update(ref(db, `users/${userKey}`), { password: null });
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
    const snapshot = await get(ref(db, 'analysts'));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()) as any[];
  },

  async createAnalyst(data: any) {
    const nextId = await getNextId('analysts');
    const newAnalyst = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString()
    };
    
    const newRef = push(ref(db, 'analysts'));
    await set(newRef, newAnalyst);
    await logAction('Criar Analista', `Analista ${data.name} criado`);
    return newAnalyst;
  },

  async updateAnalyst(id: number, data: any) {
    const snapshot = await get(ref(db, 'analysts'));
    if (!snapshot.exists()) throw new Error('Analista não encontrado');
    
    const analystsObj = snapshot.val();
    const analystKey = Object.keys(analystsObj).find(key => analystsObj[key].id === id);
    if (!analystKey) throw new Error('Analista não encontrado');
    
    await update(ref(db, `analysts/${analystKey}`), data);
    await logAction('Atualizar Analista', `Analista ID ${id} atualizado`);
    return { ...analystsObj[analystKey], ...data };
  },

  async deleteAnalyst(id: number) {
    const snapshot = await get(ref(db, 'analysts'));
    if (!snapshot.exists()) return { success: true };
    
    const analystsObj = snapshot.val();
    const analystKey = Object.keys(analystsObj).find(key => analystsObj[key].id === id);
    if (analystKey) {
      await remove(ref(db, `analysts/${analystKey}`));
      await logAction('Excluir Analista', `Analista ID ${id} excluído`);
    }
    return { success: true };
  },

  async getAnalyst(id: number) {
    const snapshot = await get(ref(db, 'analysts'));
    if (!snapshot.exists()) throw new Error('Analista não encontrado');
    const analystsObj = snapshot.val();
    const analyst = Object.values(analystsObj).find((u: any) => u.id === id);
    if (!analyst) throw new Error('Analista não encontrado');
    return analyst;
  },

  async getSupervisors() {
    const snapshot = await get(ref(db, 'supervisors'));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val());
  },

  async createSupervisor(data: any) {
    const nextId = await getNextId('supervisors');
    const newSup = { ...data, id: nextId };
    const newRef = push(ref(db, 'supervisors'));
    await set(newRef, newSup);
    await logAction('Criar Supervisor', `Supervisor ${data.name} criado`);
    return newSup;
  },

  async updateSupervisor(id: number, data: any) {
    const snapshot = await get(ref(db, 'supervisors'));
    if (!snapshot.exists()) throw new Error('Supervisor não encontrado');
    
    const supsObj = snapshot.val();
    const supKey = Object.keys(supsObj).find(key => supsObj[key].id === id);
    if (!supKey) throw new Error('Supervisor não encontrado');
    
    const oldName = supsObj[supKey].name;
    const newName = data.name;

    await update(ref(db, `supervisors/${supKey}`), data);

    if (newName && oldName && newName !== oldName) {
      const analystsSnapshot = await get(ref(db, 'analysts'));
      if (analystsSnapshot.exists()) {
        const analystsObj = analystsSnapshot.val();
        const updates: any = {};
        Object.keys(analystsObj).forEach(key => {
          if (analystsObj[key].supervisor === oldName) {
            updates[`analysts/${key}/supervisor`] = newName;
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }
    }

    await logAction('Atualizar Supervisor', `Supervisor ID ${id} atualizado`);
    return { ...supsObj[supKey], ...data };
  },

  async deleteSupervisor(id: number) {
    const snapshot = await get(ref(db, 'supervisors'));
    if (!snapshot.exists()) return { success: true };
    
    const supsObj = snapshot.val();
    const supKey = Object.keys(supsObj).find(key => supsObj[key].id === id);
    if (supKey) {
      const oldName = supsObj[supKey].name;
      await remove(ref(db, `supervisors/${supKey}`));
      
      const analystsSnapshot = await get(ref(db, 'analysts'));
      if (analystsSnapshot.exists()) {
        const analystsObj = analystsSnapshot.val();
        const updates: any = {};
        Object.keys(analystsObj).forEach(key => {
          if (analystsObj[key].supervisor === oldName) {
            updates[`analysts/${key}/supervisor`] = 'N/A';
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }

      await logAction('Excluir Supervisor', `Supervisor ID ${id} excluído`);
    }
    return { success: true };
  },

  async getAnalyses() {
    const snapshot = await get(ref(db, 'analyses'));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val());
  },

  async createAnalysis(data: any) {
    const analystsSnapshot = await get(ref(db, 'analysts'));
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
    
    const newRef = push(ref(db, 'analyses'));
    await set(newRef, newAnalysis);
    await logAction('Criar Monitoria', `Monitoria ${data.demand_number} criada`);
    return newAnalysis;
  },

  async updateAnalysis(id: number, data: any) {
    const snapshot = await get(ref(db, 'analyses'));
    if (!snapshot.exists()) throw new Error('Monitoria não encontrada');
    
    const analysesObj = snapshot.val();
    const analysisKey = Object.keys(analysesObj).find(key => analysesObj[key].id === id);
    if (!analysisKey) throw new Error('Monitoria não encontrada');
    
    if (data.analyst_id) {
      const analystsSnapshot = await get(ref(db, 'analysts'));
      if (analystsSnapshot.exists()) {
        const analysts = Object.values(analystsSnapshot.val()) as any[];
        const analyst = analysts.find(u => u.id === Number(data.analyst_id));
        if (analyst) {
          data.analyst_name = analyst.name;
          data.analyst_matricula = analyst.matricula;
        }
      }
    }
    
    await update(ref(db, `analyses/${analysisKey}`), data);
    await logAction('Atualizar Monitoria', `Monitoria ID ${id} atualizada`);
    return { ...analysesObj[analysisKey], ...data };
  },

  async deleteAnalysis(id: number) {
    const snapshot = await get(ref(db, 'analyses'));
    if (!snapshot.exists()) return { success: true };
    
    const analysesObj = snapshot.val();
    const analysisKey = Object.keys(analysesObj).find(key => analysesObj[key].id === id);
    if (analysisKey) {
      await remove(ref(db, `analyses/${analysisKey}`));
      await logAction('Excluir Monitoria', `Monitoria ID ${id} excluída`);
    }
    return { success: true };
  },

  async deleteAnalyses(period: string) {
    const snapshot = await get(ref(db, 'analyses'));
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
      await update(ref(db, 'analyses'), updates);
      await logAction('Limpar Histórico', `Histórico de monitorias limpo (Período: ${period})`);
    }
    return { success: true };
  },

  async getLogs() {
    const snapshot = await get(ref(logsDb, 'logs'));
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
    const snapshot = await get(ref(logsDb, 'logs'));
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
      await update(ref(logsDb, 'logs'), updates);
    }
    return { success: true };
  },

  async getUsers() {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) return [];
    const users = Object.values(snapshot.val()) as any[];
    return users.map(({ password, ...u }) => u);
  },

  async getTemplates() {
    const snapshot = await get(ref(db, 'templates'));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()) as any[];
  },

  async createTemplate(templateData: any) {
    const id = Date.now().toString();
    const newTemplate = { ...templateData, id };
    await set(ref(db, `templates/${id}`), newTemplate);
    await logAction('Criar Template', `Template ${templateData.name} criado`);
    return newTemplate;
  },

  async updateTemplate(id: string, templateData: any) {
    await update(ref(db, `templates/${id}`), templateData);
    
    // Update all users that use this template
    const usersSnapshot = await get(ref(db, 'users'));
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
        await update(ref(db, 'users'), updates);
      }
    }
    
    await logAction('Editar Template', `Template ${templateData.name || id} atualizado`);
    return { success: true };
  },

  async deleteTemplate(id: string) {
    await remove(ref(db, `templates/${id}`));
    await logAction('Excluir Template', `Template ID ${id} excluído`);
    return { success: true };
  },

  async getUser(id: number) {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    const usersObj = snapshot.val();
    const user = Object.values(usersObj).find((u: any) => u.id === id);
    if (!user) throw new Error('Usuário não encontrado');
    const { password, ...u } = user as any;
    return u;
  },

  async createUser(data: any) {
    const snapshot = await get(ref(db, 'users'));
    const normalizedEmail = data.email?.toLowerCase().trim();
    if (snapshot.exists()) {
      const users = Object.values(snapshot.val()) as any[];
      if (users.some(u => u.email?.toLowerCase().trim() === normalizedEmail)) {
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
    
    const newRef = push(ref(db, 'users'));
    await set(newRef, newUser);
    await logAction('Criar Usuário', `Usuário ${data.name} criado`);
    return newUser;
  },

  async updateUser(id: number, data: any) {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) throw new Error('Usuário não encontrado');
    
    const usersObj = snapshot.val();
    const userKey = Object.keys(usersObj).find(key => usersObj[key].id === id);
    if (!userKey) throw new Error('Usuário não encontrado');
    
    await update(ref(db, `users/${userKey}`), data);
    await logAction('Atualizar Usuário', `Usuário ID ${id} atualizado`);
    return { ...usersObj[userKey], ...data };
  },

  async deleteUser(id: number) {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) return { success: true };
    
    const usersObj = snapshot.val();
    const userKey = Object.keys(usersObj).find(key => usersObj[key].id === id);
    if (userKey) {
      await remove(ref(db, `users/${userKey}`));
      await logAction('Excluir Usuário', `Usuário ID ${id} excluído`);
    }
    return { success: true };
  },

  async getDashboard(params?: { track?: string; analyst_id?: string; supervisor_name?: string; start_date?: string; end_date?: string }) {
    const analysesSnapshot = await get(ref(db, 'analyses'));
    const usersSnapshot = await get(ref(db, 'users'));
    
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
    if (params?.supervisor_name) {
      filtered = filtered.filter(a => {
        const analyst = users.find(u => u.id === Number(a.analyst_id));
        return analyst && analyst.supervisor === params.supervisor_name;
      });
    }

    const byStatusMap = filtered.reduce((acc, a) => {
      const status = a.status || 'Não';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

    const byTypeMap = filtered.reduce((acc, a) => {
      const type = a.demand_type || 'Desconhecido';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byType = Object.entries(byTypeMap).map(([demand_type, count]) => ({ demand_type, count }));

    const byTrackMap = filtered.reduce((acc, a) => {
      const trackName = a.track || 'Desconhecido';
      acc[trackName] = (acc[trackName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byTrack = Object.entries(byTrackMap).map(([track, count]) => ({ track, count }));

    // Productivity aggregation
    const analystsSnapshot = await get(ref(db, 'analysts'));
    const allAnalysts = analystsSnapshot.exists() ? Object.values(analystsSnapshot.val()) as any[] : [];
    
    const productivityByAnalystMap: Record<string, number> = {};
    const productivityByTrackMap: Record<string, number> = {};
    
    allAnalysts.forEach(analyst => {
      if (params?.analyst_id && Number(analyst.id) !== Number(params.analyst_id)) return;
      if (params?.supervisor_name && analyst.supervisor !== params.supervisor_name) return;
      
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
        if (params?.supervisor_name && analyst.supervisor !== params.supervisor_name) return;
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
          if (params?.supervisor_name && analyst.supervisor !== params.supervisor_name) return;
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

    const errorsByTypeMap = filtered.filter(a => a.status === 'Sim').reduce((acc, a) => {
      acc[a.demand_type] = (acc[a.demand_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const errorsByType = Object.entries(errorsByTypeMap).map(([demand_type, count]) => ({ demand_type, count }));

    const errorsByTrackMap = filtered.filter(a => a.status === 'Sim').reduce((acc, a) => {
      acc[a.track] = (acc[a.track] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const errorsByTrack = Object.entries(errorsByTrackMap).map(([track, count]) => ({ track, count }));

    return {
      totalAnalyses: { count: filtered.length },
      byStatus,
      byType,
      byTrack,
      evolution,
      errorsByType,
      errorsByTrack,
      productivityByAnalyst,
      productivityByTrack
    };
  },

  async getTracks() {
    const snapshot = await get(ref(db, 'tracks'));
    if (!snapshot.exists()) return [];

    const tracksMap = new Map();
    const allTracks = Object.values(snapshot.val()).filter(Boolean) as any[];
    
    // Sort by date to keep the oldest one if duplicates exist
    allTracks.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    allTracks.forEach(track => {
      const normalizedName = (track.name || '').toLowerCase().trim();
      if (!tracksMap.has(normalizedName)) {
        tracksMap.set(normalizedName, track);
      }
    });

    return Array.from(tracksMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  async createTrack(trackData: any) {
    const snapshot = await get(ref(db, 'tracks'));
    if (snapshot.exists()) {
      const existing = Object.values(snapshot.val()).filter(Boolean) as any[];
      if (existing.some(t => (t.name || '').toLowerCase().trim() === (trackData.name || '').toLowerCase().trim())) {
        throw new Error('Já existe uma esteira com este nome');
      }
    }

    const newRef = push(ref(db, 'tracks'));
    const track = { ...trackData, id: newRef.key, created_at: new Date().toISOString() };
    await set(newRef, track);
    await logAction('Criar Esteira', `Esteira ${track.name} criada`);
    return track;
  },

  async cleanupTracks() {
    const snapshot = await get(ref(db, 'tracks'));
    if (!snapshot.exists()) return;

    const allTracks = Object.values(snapshot.val()).filter(Boolean) as any[];
    const tracksMap = new Map();
    const toDelete: string[] = [];

    // Sort by date to keep the oldest
    allTracks.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    allTracks.forEach(track => {
      const normalizedName = (track.name || '').toLowerCase().trim();
      if (!tracksMap.has(normalizedName)) {
        tracksMap.set(normalizedName, track.id);
      } else {
        toDelete.push(track.id);
      }
    });

    for (const id of toDelete) {
      await remove(ref(db, `tracks/${id}`));
    }
    
    await logAction('Limpeza de Esteiras', `${toDelete.length} esteiras duplicadas removidas`);
    return toDelete.length;
  },

  async updateTrack(id: string, trackData: any) {
    const snapshot = await get(ref(db, 'tracks'));
    if (!snapshot.exists()) return null;
    const tracks = snapshot.val();
    const trackKey = Object.keys(tracks).find(key => tracks[key].id === id || key === id);
    
    if (trackKey) {
      await update(ref(db, `tracks/${trackKey}`), trackData);
      await logAction('Editar Esteira', `Esteira ${trackData.name || id} editada`);
      return { ...tracks[trackKey], ...trackData };
    }
    return null;
  },

  async bulkRenameDemandType(oldName: string, newName: string, trackIds: string[]) {
    // 1. Update Tracks
    const tracksSnapshot = await get(ref(db, 'tracks'));
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
    const analysesSnapshot = await get(ref(db, 'analyses'));
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
    const snapshot = await get(ref(db, 'tracks'));
    if (!snapshot.exists()) return { success: false };
    const tracks = snapshot.val();
    const trackKey = Object.keys(tracks).find(key => tracks[key].id === id || key === id);
    
    if (trackKey) {
      await remove(ref(db, `tracks/${trackKey}`));
      await logAction('Excluir Esteira', `Esteira ID ${id} excluída`);
    }
    return { success: true };
  },

  async saveConsolidatedData(data: any[]) {
    const now = new Date().toISOString();
    await set(ref(db, 'consolidated_data'), data);
    await set(ref(db, 'metadata/last_processing_date'), now);
    await logAction('Consolidar Base', `${data.length} registros consolidados`);
    return { success: true };
  },

  async getLastProcessingDate() {
    const snapshot = await get(ref(db, 'metadata/last_processing_date'));
    if (!snapshot.exists()) return null;
    return snapshot.val() as string;
  },

  async getConsolidatedData() {
    const snapshot = await get(ref(db, 'consolidated_data'));
    if (!snapshot.exists()) return [];
    return snapshot.val() as any[];
  },

  async deleteConsolidatedData() {
    await remove(ref(db, 'consolidated_data'));
    await logAction('Excluir Base Consolidada', 'Toda a base de dados consolidada foi excluída');
    return { success: true };
  },

  async updateAnalystsProductivity(productivityMap: Record<string, Record<string, number>>) {
    const snapshot = await get(ref(db, 'analysts'));
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
        updates[`analysts/${key}/productivity`] = sanitizedMap;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      await logAction('Atualizar Produtividade', `Produtividade de ${Object.keys(updates).length} analistas atualizada`);
    }
    
    return { success: true };
  }
};
