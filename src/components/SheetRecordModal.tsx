import React, { useState, useEffect } from 'react';
import { X, Calendar, Wrench, User, FileText, Gauge, DollarSign } from 'lucide-react';
import { VehicleModel, MaintenanceRecord } from '../types';
import { parseNextIntervention, buildNextIntervention } from '../utils/nextIntervention';

interface SheetRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MaintenanceRecord) => void;
  model: VehicleModel;
  initialRecord?: MaintenanceRecord | null;
}

export const SheetRecordModal: React.FC<SheetRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  model,
  initialRecord,
}) => {
  const isEditing = !!initialRecord;

  const [manutenzioneEffettuata, setManutenzioneEffettuata] = useState('');
  const [presso, setPresso] = useState('');
  const [note, setNote] = useState('');
  const [costo, setCosto] = useState('');
  const [data, setData] = useState('');
  const [km, setKm] = useState('');
  // Prossimo intervento: per data e/o per chilometri (i due pulsanti sono attivabili anche insieme)
  const [nextByDate, setNextByDate] = useState(false);
  const [nextByKm, setNextByKm] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [nextKm, setNextKm] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setManutenzioneEffettuata(initialRecord.manutenzioneEffettuata || '');
      setPresso(initialRecord.presso || '');
      setNote(initialRecord.note || '');
      setCosto(initialRecord.costo !== undefined && initialRecord.costo !== null && initialRecord.costo !== 0 ? String(initialRecord.costo) : '');
      setData(initialRecord.data || '');
      setKm(initialRecord.km !== undefined && initialRecord.km !== null && initialRecord.km !== 0 ? String(initialRecord.km) : '');
      const next = parseNextIntervention(initialRecord.prossimoIntervento);
      setNextDate(next.date);
      setNextKm(next.km !== null ? String(next.km) : '');
      setNextByDate(!!next.date);
      setNextByKm(next.km !== null);
    } else {
      setManutenzioneEffettuata('');
      setPresso('');
      setNote('');
      setCosto('');
      setData(new Date().toISOString().split('T')[0]);
      setKm('');
      setNextDate('');
      setNextKm('');
      setNextByDate(false);
      setNextByKm(false);
    }
  }, [initialRecord, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordToSave: MaintenanceRecord = {
      id: initialRecord ? initialRecord.id : `rec_${Date.now()}`,
      manutenzioneEffettuata: manutenzioneEffettuata.trim(),
      presso: presso.trim(),
      note: note.trim(),
      costo: costo ? parseFloat(costo) || 0 : 0,
      data: data || new Date().toISOString().split('T')[0],
      km: km ? parseInt(km.replace(/\D/g, ''), 10) || 0 : 0,
      prossimoIntervento: buildNextIntervention(
        nextByDate ? nextDate : '',
        nextByKm ? nextKm : null
      ),
      createdAt: initialRecord ? initialRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(recordToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-400" />
              <span>{isEditing ? 'Modifica Intervento' : 'Nuovo Intervento'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mezzo: <strong className="text-white">{model.name}</strong> ({model.plate})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* MANUTENZIONE EFFETTUATA (OBBLIGATORIO) */}
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1">
              Manutenzione effettuata *
            </label>
            <input
              type="text"
              required
              placeholder="es. Tagliando, Sostituzione pastiglie, Cambio gomme..."
              value={manutenzioneEffettuata}
              onChange={(e) => setManutenzioneEffettuata(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* DATA INTERVENTO (OBBLIGATORIO) */}
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1">
              Data intervento *
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* PRESSO & COSTO (ENTRAMBI FACOLTATIVI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Presso (Officina / Meccanico) <span className="text-slate-500 text-[10px]">(opzionale)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="es. Luigi, Seminara..."
                  value={presso}
                  onChange={(e) => setPresso(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Costo € <span className="text-slate-500 text-[10px]">(opzionale)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono font-bold">€</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 text-xs text-white font-mono text-emerald-400 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* KM (FACOLTATIVO) */}
          <div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chilometri (KM) <span className="text-slate-500 text-[10px]">(opzionale)</span>
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  placeholder="es. 73958"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* PROSSIMO INTERVENTO: per data e/o per km */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Prossimo intervento <span className="text-slate-500 text-[10px]">(opzionale)</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={nextByDate}
                onClick={() => setNextByDate((v) => !v)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  nextByDate
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>📅 Per Data</span>
              </button>
              <button
                type="button"
                aria-pressed={nextByKm}
                onClick={() => setNextByKm((v) => !v)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  nextByKm
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Gauge className="h-3.5 w-3.5" />
                <span>⏱️ Per Chilometri (KM)</span>
              </button>
            </div>

            {(nextByDate || nextByKm) && (
              <div className={`mt-2 grid grid-cols-1 gap-2 ${nextByDate && nextByKm ? 'sm:grid-cols-2' : ''}`}>
                {nextByDate && (
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                  />
                )}
                {nextByKm && (
                  <div className="relative">
                    <Gauge className="absolute left-3 top-2.5 h-3.5 w-3.5 text-blue-400" />
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="es. 80000"
                      value={nextKm}
                      onChange={(e) => setNextKm(e.target.value)}
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-8 pr-10 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                    />
                    <span className="absolute right-3 top-2 text-[11px] text-slate-500 font-mono">km</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NOTE (FACOLTATIVO) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Note & Ricambi <span className="text-slate-500 text-[10px]">(opzionale)</span>
            </label>
            <textarea
              rows={3}
              placeholder="es. filtro olio, candele, litri olio, codici, osservazioni..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition"
            >
              {isEditing ? 'Salva Modifiche' : 'Aggiungi Intervento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
