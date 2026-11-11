import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseExcelFile } from '../utils/excelExporter';
import { VehicleModel } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportModels: (newModels: VehicleModel[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportModels,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedModels, setParsedModels] = useState<VehicleModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setIsLoading(true);

    try {
      const models = await parseExcelFile(selected);
      if (models.length === 0) {
        setError('Nessun foglio valido trovato nel file Excel.');
      } else {
        setParsedModels(models);
      }
    } catch (err: any) {
      console.error(err);
      setError('Errore nella lettura del file Excel. Assicurati che sia in formato .xlsx, .xls o .csv.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!parsedModels) return;
    onImportModels(parsedModels);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importa File Excel ADOcar</h2>
              <p className="text-xs text-slate-400">
                Carica il tuo file Excel: ogni foglio (tab) diventerà una scheda mezzo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-8 bg-slate-950/50 transition">
            <Upload className="h-10 w-10 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-white">
              {file ? file.name : 'Seleziona o trascina il tuo file Excel'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supporta file con struttura ADOcar (MEZZO, TARGA, Scadenze e Tabella Manutenzioni)
            </p>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {isLoading && (
            <div className="text-center text-xs text-amber-400 font-semibold animate-pulse">
              Analisi del file Excel in corso...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsedModels && parsedModels.length > 0 && (
            <div className="rounded-xl bg-slate-950/80 p-4 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Riconosciuti {parsedModels.length} mezzi/fogli:</span>
              </div>
              <div className="space-y-1.5">
                {parsedModels.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-xs border border-slate-800"
                  >
                    <div>
                      <strong className="text-white">{m.name}</strong>{' '}
                      {m.plate && <span className="font-mono text-amber-400">({m.plate})</span>}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {m.records.length} interventi
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-lg transition"
              >
                Importa {parsedModels.length} Fogli Veicolo
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
