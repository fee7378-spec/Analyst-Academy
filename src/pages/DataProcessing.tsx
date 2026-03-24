import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Table as TableIcon,
  ChevronRight,
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api, normalizeString } from '../lib/api';

interface SheetData {
  name: string;
  data: any[];
  selected: boolean;
}

interface FileData {
  name: string;
  sheets: SheetData[];
}

export const DataProcessing: React.FC = () => {
  const [files, setFiles] = useState<{ pj: FileData | null; pf: FileData | null }>({ pj: null, pf: null });
  const [loading, setLoading] = useState(false);
  const [lastProcessingDate, setLastProcessingDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [columns, setColumns] = useState({
    name: 'A',
    date: 'B',
    track: 'F'
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = currentUser.permissions || {};
  const canEdit = currentUser.role === 'Administrador' || permissions['processamento'] === 'edit';

  React.useEffect(() => {
    loadLastProcessingDate();
  }, []);

  const loadLastProcessingDate = async () => {
    try {
      const date = await api.getLastProcessingDate();
      setLastProcessingDate(date);
    } catch (error) {
      console.error('Erro ao carregar data do último processamento:', error);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'pj' | 'pf') => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }

    // Create a mock event to reuse handleFileUpload logic if possible, 
    // but handleFileUpload expects React.ChangeEvent<HTMLInputElement>.
    // Better to refactor the logic into a separate function.
    processFile(file, type);
  };

  const processFile = async (file: File, type: 'pj' | 'pf') => {
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const sheets: SheetData[] = workbook.SheetNames.map(name => {
        const worksheet = workbook.Sheets[name];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A", raw: false });
        return {
          name,
          data: jsonData,
          selected: true
        };
      });

      setFiles(prev => ({
        ...prev,
        [type]: {
          name: file.name,
          sheets
        }
      }));
      toast.success(`Base ${type.toUpperCase()} carregada com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao ler o arquivo. Verifique se é um Excel válido.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pj' | 'pf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }

    processFile(file, type);
  };

  const handleDeleteConsolidated = async () => {
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    setIsDeleting(true);
    try {
      await api.deleteConsolidatedData();
      await loadLastProcessingDate();
      toast.success('Base consolidada excluída com sucesso!');
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir a base consolidada.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSheet = (type: 'pj' | 'pf', sheetName: string) => {
    const newFiles = { ...files };
    const file = newFiles[type];
    if (file) {
      const sheet = file.sheets.find(s => s.name === sheetName);
      if (sheet) {
        sheet.selected = !sheet.selected;
        setFiles(newFiles);
      }
    }
  };

  const handleConsolidate = async () => {
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }
    const consolidated: any[] = [];
    
    const processFile = (file: FileData | null) => {
      if (!file) return;
      
      file.sheets.forEach(sheet => {
        if (!sheet.selected) return;
        
        sheet.data.forEach((row, index) => {
          if (index === 0 || !row) return;

          const name = row[columns.name.toUpperCase()];
          let date = row[columns.date.toUpperCase()];
          const track = row[columns.track.toUpperCase()];

          if (name && date && track) {
            let dateStr = '';
            const s = String(date).trim();
            
            const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
            const ymdMatch = s.match(/^(\d{2,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
            
            if (dmyMatch) {
              const [_, d, m, y] = dmyMatch;
              const fullYear = y.length === 2 ? `20${y}` : y;
              dateStr = `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (ymdMatch) {
              const [_, y, m, d] = ymdMatch;
              const fullYear = y.length === 2 ? `20${y}` : y;
              dateStr = `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (date instanceof Date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (typeof date === 'number') {
              const d = new Date(Math.round((date - 25569) * 86400 * 1000));
              const year = d.getUTCFullYear();
              const month = String(d.getUTCMonth() + 1).padStart(2, '0');
              const day = String(d.getUTCDate()).padStart(2, '0');
              dateStr = `${year}-${month}-${day}`;
            } else {
              dateStr = s.replace(/[\.\#\$\/\[\]]/g, '-');
            }

            if (dateStr) {
              consolidated.push({
                analyst: String(name).trim().toUpperCase(),
                date: dateStr,
                track: String(track).trim(),
                source: file.name,
                sheet: sheet.name
              });
            }
          }
        });
      });
    };

    processFile(files.pj);
    processFile(files.pf);

    if (consolidated.length === 0) {
      toast.error('Nenhum dado encontrado com as colunas especificadas.');
      return;
    }

    // Automatically fix inverted dates (MM/DD vs DD/MM)
    // Only swap if the month value is greater than 12, which clearly indicates inversion
    consolidated.forEach(item => {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const monthVal = parseInt(m);
        const dayVal = parseInt(d);
        
        if (monthVal > 12) {
          // Swap month and day
          item.date = `${y}-${String(dayVal).padStart(2, '0')}-${String(monthVal).padStart(2, '0')}`;
        }
      }
    });

    try {
      await api.saveConsolidatedData(consolidated);
      
      // Calculate daily productivity per analyst
      const productivityMap: Record<string, Record<string, number>> = {};
      consolidated.forEach(item => {
        const normalizedAnalyst = normalizeString(item.analyst);
        const date = item.date;
        if (!productivityMap[normalizedAnalyst]) {
          productivityMap[normalizedAnalyst] = {};
        }
        productivityMap[normalizedAnalyst][date] = (productivityMap[normalizedAnalyst][date] || 0) + 1;
      });
      
      await api.updateAnalystsProductivity(productivityMap);
      await loadLastProcessingDate();
      
      toast.success(`${consolidated.length} registros consolidados com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar dados consolidados:', error);
      toast.error('Erro ao salvar os dados no Firebase.');
    }
  };

  const removeFile = (type: 'pj' | 'pf') => {
    setFiles(prev => ({ ...prev, [type]: null }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Processamento de Bases</h1>
          <p className="text-slate-500 dark:text-slate-400">Carregue e consolide as bases de tabulação PJ e PF</p>
        </div>
        {lastProcessingDate && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-500 dark:text-blue-400">Último Processamento</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {new Date(lastProcessingDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações de Colunas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configuração de Colunas</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Letra Coluna Nome</label>
                <input 
                  type="text"
                  value={columns.name}
                  onChange={e => setColumns({...columns, name: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all uppercase"
                  placeholder="Ex: A"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Letra Coluna Data</label>
                <input 
                  type="text"
                  value={columns.date}
                  onChange={e => setColumns({...columns, date: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all uppercase"
                  placeholder="Ex: B"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Letra Coluna Esteira</label>
                <input 
                  type="text"
                  value={columns.track}
                  onChange={e => setColumns({...columns, track: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all uppercase"
                  placeholder="Ex: F"
                />
              </div>
            </div>

            {canEdit && (
              <button
                onClick={handleConsolidate}
                disabled={!files.pj && !files.pf}
                className="w-full mt-8 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Consolidar Bases
              </button>
            )}

            {canEdit && (
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Atenção</h2>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Ações irreversíveis que impactam toda a base de dados do sistema.
                </p>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir Base Consolidada
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full mb-6">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmar Exclusão</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">
                    TEM CERTEZA QUE DESEJA EXCLUIR TODA A BASE CONSOLIDADA? ESTA AÇÃO NÃO PODE SER DESFEITA.
                  </p>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isDeleting}
                      className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteConsolidated}
                      disabled={isDeleting}
                      className="px-6 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          Excluir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Upload de Arquivos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PJ Upload */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tabulador PJ</h2>
                </div>
                {files.pj && (
                  <button onClick={() => removeFile('pj')} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!files.pj ? (
                <label 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'pj')}
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Clique ou arraste para selecionar o arquivo PJ</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={e => handleFileUpload(e, 'pj')} />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{files.pj.name}</p>
                    <p className="text-xs text-slate-500">{files.pj.sheets.length} sheets encontradas</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {files.pj.sheets.map(sheet => (
                      <button
                        key={sheet.name}
                        onClick={() => toggleSheet('pj', sheet.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-xs font-medium ${
                          sheet.selected 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-3 h-3" />
                          {sheet.name}
                        </div>
                        {sheet.selected && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PF Upload */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tabulador PF</h2>
                </div>
                {files.pf && (
                  <button onClick={() => removeFile('pf')} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!files.pf ? (
                <label 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'pf')}
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Clique ou arraste para selecionar o arquivo PF</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={e => handleFileUpload(e, 'pf')} />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{files.pf.name}</p>
                    <p className="text-xs text-slate-500">{files.pf.sheets.length} sheets encontradas</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {files.pf.sheets.map(sheet => (
                      <button
                        key={sheet.name}
                        onClick={() => toggleSheet('pf', sheet.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-xs font-medium ${
                          sheet.selected 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-3 h-3" />
                          {sheet.name}
                        </div>
                        {sheet.selected && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium">Processando arquivos...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
