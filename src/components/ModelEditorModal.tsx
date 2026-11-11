import React, { useState, useEffect } from 'react';
import { 
  X, 
  Car, 
  Bike, 
  Trash2, 
  Check 
} from 'lucide-react';
import { VehicleModel, VehicleType, FixedDeadlines } from '../types';
import { sanitizeSheetName } from '../utils/excelExporter';

interface ModelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: VehicleModel) => void;
  onDelete?: (modelId: string) => void;
  initialModel?: VehicleModel | null;
  existingNames?: string[];
}

export const ModelEditorModal: React.FC<ModelEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialModel,
}) => {
  const isEditing = !!initialModel;

  const [type, setType] = useState<VehicleType>('auto');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    if (initialModel) {
      setType(initialModel.type);
      setName(initialModel.name);
      setPlate(initialModel.plate || '');
      setNotes(initialModel.notes || '');
    } else {
      setType('auto');
      setName('');
      setPlate('');
      setNotes('');
    }
  }, [initialModel, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = name.trim() || 'Nuovo Mezzo';
    const finalSheetName = sanitizeSheetName(initialModel?.sheetTabName || finalName);

    // Preserve existing deadlines when editing, or create default empty
    const deadlines: FixedDeadlines = initialModel?.deadlines || {
      revisione: { expiryDate: '', cost: 0 },
      assicurazione: { expiryDate: '', cost: 0 },
      bollo: { expiryDate: '', cost: 0 },
    };

    const modelToSave: VehicleModel = {
      id: initialModel ? initialModel.id : `m_${Date.now()}`,
      name: finalName,
      sheetTabName: finalSheetName,
      plate: plate.trim().toUpperCase(),
      type,
      brand: initialModel?.brand || finalName.split(' ')[0] || 'Mezzo',
      modelName: initialModel?.modelName || finalName.split(' ').slice(1).join(' ') || finalName,
      deadlines,
      records: initialModel ? initialModel.records : [],
      notes: notes.trim(),
      createdAt: initialModel ? initialModel.createdAt : new Date().toISOString(),
    };

    onSave(modelToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                type === 'auto'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {type === 'auto' ? <Car className="h-5 w-5" /> : <Bike className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Modifica Mezzo` : 'Nuovo Mezzo'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? initialModel?.name : 'Aggiungi una nuova auto o moto'}
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

        {/* Clean, Minimal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vehicle Type (Auto / Moto) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Tipologia Mezzo
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('auto')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 border font-bold text-xs transition ${
                  type === 'auto'
                    ? 'bg-blue-600/25 border-blue-500 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="h-4 w-4 text-blue-400" />
                <span>Automobile</span>
              </button>

              <button
                type="button"
                onClick={() => setType('moto')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 border font-bold text-xs transition ${
                  type === 'moto'
                    ? 'bg-amber-600/25 border-amber-500 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bike className="h-4 w-4 text-amber-400" />
                <span>Moto / Scooter</span>
              </button>
            </div>
          </div>

          {/* MEZZO (Nome Mezzo) */}
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1">
              Nome Mezzo *
            </label>
            <input
              type="text"
              required
              placeholder="es. Jeep Compass, Suzuki Swift..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white font-semibold focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* TARGA */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Targa <span className="text-slate-500 text-[10px]">(opzionale)</span>
            </label>
            <input
              type="text"
              placeholder="es. FZ613BN"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="w-full uppercase font-mono tracking-wider rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white font-bold focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* NOTE / DETTAGLI MEZZO */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Note Mezzo <span className="text-slate-500 text-[10px]">(opzionale)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Dettagli, colore, note generali..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {isEditing && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <span className="text-[11px] text-rose-300 font-medium">Eliminare il mezzo?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(initialModel.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 px-2.5 py-1 text-xs font-bold text-white transition shadow-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Sì, Elimina</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white transition"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-2 rounded-lg hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Elimina Mezzo</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 hover:bg-amber-400 font-bold px-5 py-2 text-xs text-slate-950 shadow-md shadow-amber-500/20 transition"
              >
                {isEditing ? 'Salva Modifiche' : 'Aggiungi Mezzo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
