import React from 'react';
import { 
  X, 
  Calendar, 
  User, 
  DollarSign, 
  Gauge, 
  Clock, 
  FileText, 
  Edit3, 
  Trash2,
  Wrench
} from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatDisplayDate } from '../utils/excelExporter';
import { NextInterventionLabel } from './NextInterventionLabel';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord | null;
  vehicleName: string;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (recordId: string) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  vehicleName,
  onEdit,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setConfirmDelete(false);
  }, [isOpen, record?.id]);

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                {vehicleName}
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">
                {record.manutenzioneEffettuata}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-4">
          {/* Main Grid: Data, Costo, Km, Presso */}
          <div className="grid grid-cols-2 gap-3">
            {/* Data */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-amber-400" /> Data Intervento
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {formatDisplayDate(record.data) || '—'}
              </span>
            </div>

            {/* Costo */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Costo
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {record.costo !== undefined && record.costo !== null && record.costo !== 0
                  ? `€ ${Number(record.costo).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </span>
            </div>

            {/* Km */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Gauge className="h-3.5 w-3.5 text-blue-400" /> Chilometraggio
              </span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {record.km ? `${Number(record.km).toLocaleString('it-IT')} km` : '—'}
              </span>
            </div>

            {/* Presso */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="h-3.5 w-3.5 text-amber-400" /> Presso (Officina/Meccanico)
              </span>
              <span className="text-sm font-semibold text-amber-200">
                {record.presso || '—'}
              </span>
            </div>
          </div>

          {/* Prossimo Intervento (se presente) */}
          {record.prossimoIntervento && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                  Prossimo Intervento Programmato
                </span>
                <NextInterventionLabel
                  value={record.prossimoIntervento}
                  className="text-xs font-semibold text-white"
                  iconClassName="h-3.5 w-3.5"
                />
              </div>
            </div>
          )}

          {/* Note complete */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" /> Note &amp; Dettagli Ricambi
            </span>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {record.note || <span className="text-slate-600 italic">Nessuna nota specificata.</span>}
            </p>
          </div>
        </div>

        {/* Footer Actions: Modifica, Elimina */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          {confirmDelete ? (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs text-rose-300 font-medium">Confermi l'eliminazione?</span>
              <button
                type="button"
                onClick={() => {
                  onDelete(record.id);
                  onClose();
                }}
                className="flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sì, Elimina</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Annulla
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Elimina Intervento</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Chiudi
            </button>
            <button
              onClick={() => {
                onEdit(record);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Modifica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
