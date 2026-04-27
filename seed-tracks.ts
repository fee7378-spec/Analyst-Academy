import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAwdvP1QHX3hBjh_XFOEvVEok9GwKGdky0",
  authDomain: "analyst-academy-e814d.firebaseapp.com",
  databaseURL: "https://analyst-academy-e814d-default-rtdb.firebaseio.com",
  projectId: "analyst-academy-e814d",
  storageBucket: "analyst-academy-e814d.firebasestorage.app",
  messagingSenderId: "910476714098",
  appId: "1:910476714098:web:a803bba8d4b7be5b9522eb",
  measurementId: "G-KMSR274KP3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

async function seedTracks() {
  console.log('Starting to seed tracks...');
  const tracksRef = ref(db, 'tracks');
  const snapshot = await get(tracksRef);
  const existingTracks = snapshot.exists() ? Object.values(snapshot.val()) as any[] : [];
  
  for (const trackInfo of tracksToCreate) {
    const exists = existingTracks.some(t => t.name.toLowerCase().trim() === trackInfo.name.toLowerCase().trim());
    
    if (!exists) {
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
          demandTypes: [
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
          ],
          tags: [
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
          ]
        }
      });
      console.log(`Created track: ${trackInfo.name}`);
    } else {
      console.log(`Track already exists: ${trackInfo.name}`);
    }
  }
  console.log('Finished seeding tracks.');
  process.exit(0);
}

seedTracks().catch(err => {
  console.error(err);
  process.exit(1);
});
