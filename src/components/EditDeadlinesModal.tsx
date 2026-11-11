import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Check, ShieldCheck, Car } from 'lucide-react';
import { VehicleModel, FixedDeadlines } from '../types';

interface EditDeadlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: VehicleModel;
  onSaveDeadlines: (modelId: string, deadlines: FixedDeadlines) => void;
}

export const EditDeadlinesModal: React.FC<EditDeadlinesModalProps> = ({
  isOpen,
  onClose,
  model,
  onSaveDeadlines,
}) => {
  const [revDate, setRevDate] = useState('');
  const [revCost, setRevCost] = useState('');

  const [assDate, setAssDate] = useState('');
  const [assCost, setAssCost] = useState('');

  const [bolDate, setBolDate] = useState('');
  const [bolCost, setBolCost] = useState('');

  useEffect(() => {
    if (model && isOpen) {
      setRevDate(model.deadlines?.revisione?.expiryDate || '');
      setRevCost(
        model.deadlines?.revisione?.cost !== undefined && model.deadlines.revisione.cost !== null && model.deadlines.revisione.cost !== 0
          ? String(model.deadlines.revisione.cost)
          : ''
      );

      setAssDate(model.deadlines?.assicurazione?.expiryDate || '');
      setAssCost(
        model.deadlines?.assicurazione?.cost !== undefined && model.deadlines.assicurazione.cost !== null && model.deadlines.assicurazione.cost !== 0
          ? String(model.deadlines.assicurazione.cost)
          : ''
      );

      setBolDate(model.deadlines?.bollo?.expiryDate || '');
      setBolCost(
        model.deadlines?.bollo?.cost !== undefined && model.deadlines.bollo.cost !== null && model.deadlines.bollo.cost !== 0
          ? String(model.deadlines.bollo.cost)
          : ''
      );
    }
  }, [model, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedDeadlines: FixedDeadlines = {
      revisione: {
        expiryDate: revDate,
        cost: revCost ? parseFloat(revCost) || 0 : 0,
      },
      assicurazione: {
        expiryDate: assDate,
        cost: assCost ? parseFloat(assCost) || 0 : 0,
      },
      bollo: {
        expiryDate: bolDate,
        cost: bolCost ? parseFloat(bolCost) || 0 : 0,
      },
    };

    onSaveDeadlines(model.id, updatedDeadlines);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Modifica Scadenze Mezzo</h2>
              <p className="text-xs text-amber-400 font-mono">
                {model.name} {model.plate ? `(${model.plate})` : ''}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* REVISIONE */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Revisione Ministeriale
              </span>
              <span className="text-[10px] text-slate-500">Obbligatoria ogni 2 anni</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Data Scadenza
                </label>
                <input
                  type="date"
                  value={revDate}
                  onChange={(e) => setRevDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Costo Previsto (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="68.50"
                    value={revCost}
                    onChange={(e) => setRevCost(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ASSICURAZIONE */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Assicurazione RCA
              </span>
              <span className="text-[10px] text-slate-500">Polizza annuale / semestrale</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Data Scadenza
                </label>
                <input
                  type="date"
                  value={assDate}
                  onChange={(e) => setAssDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Costo Polizza (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="370.00"
                    value={assCost}
                    onChange={(e) => setAssCost(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOLLO AUTO */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Bollo Auto (Tassa di Possesso)
              </span>
              <span className="text-[10px] text-slate-500">Scadenza regionale</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Data Scadenza
                </label>
                <input
                  type="date"
                  value={bolDate}
                  onChange={(e) => setBolDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Importo Tassa (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="200.29"
                    value={bolCost}
                    onChange={(e) => setBolCost(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition"
            >
              Salva Scadenze
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
