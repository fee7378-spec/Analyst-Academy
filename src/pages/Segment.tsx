import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export const Segment: React.FC = () => {
  const [segment, setSegment] = useState(localStorage.getItem('segment') || 'PJ');

  const handleSegmentChange = (newSegment: string) => {
    setSegment(newSegment);
    localStorage.setItem('segment', newSegment);
    toast.success(`Segmento alterado para ${newSegment}.`);
    
    // Reload to re-fetch all data and reset states globally
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Configuração de Segmento</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
        A alteração do segmento separará as visões de analistas, esteiras, monitorias e bases consolidadas.
        Por favor confira no qual você precisa do acesso antes de prosseguir.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <button
          onClick={() => handleSegmentChange('PJ')}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            segment === 'PJ'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${segment === 'PJ' ? 'text-blue-900 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>Pessoa Jurídica (PJ)</h3>
            {segment === 'PJ' && (
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Ativo</span>
            )}
          </div>
          <p className={`text-sm ${segment === 'PJ' ? 'text-blue-800/80 dark:text-blue-200/70' : 'text-slate-500 dark:text-slate-400'}`}>
            Ambiente com os sistemas, processos e dados direcionados para o acompanhamento de Pessoas Jurídicas.
          </p>
        </button>

        <button
          onClick={() => handleSegmentChange('PF')}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            segment === 'PF'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${segment === 'PF' ? 'text-blue-900 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>Pessoa Física (PF)</h3>
            {segment === 'PF' && (
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Ativo</span>
            )}
          </div>
          <p className={`text-sm ${segment === 'PF' ? 'text-blue-800/80 dark:text-blue-200/70' : 'text-slate-500 dark:text-slate-400'}`}>
            Ambiente apartado com sua própria esteira, bases e dados exclusivos para acompanhamento de Pessoas Físicas.
          </p>
        </button>
      </div>
    </div>
  );
};
