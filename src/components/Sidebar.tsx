import React, { useState } from 'react';
import { 
  Car, 
  Bike, 
  Plus, 
  X, 
  ChevronRight, 
  Search
} from 'lucide-react';
import { VehicleModel } from '../types';

interface SidebarProps {
  models: VehicleModel[];
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  onOpenNewModel: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onOpenNewModel,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'auto' | 'moto'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = models.filter((m) => {
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.plate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const autoCount = models.filter((m) => m.type === 'auto').length;
  const motoCount = models.filter((m) => m.type === 'moto').length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-76 flex-col bg-slate-900 border-r border-slate-800 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding (Icon + Name) - Nascosto su PC/Desktop per evitare doppioni */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 bg-slate-950/70 lg:hidden">
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}assets/icon-192.png`}
              alt="ADOcar"
              className="h-10 w-10 rounded-xl object-cover border border-amber-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1 font-black text-white text-base leading-none">
                <span className="text-amber-400">ADO</span>
                <span>car</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Gestione Mezzi &amp; Manutenzioni</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Chiudi menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Button: Nuovo Mezzo */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenNewModel();
              if (isOpenMobile) onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-[0.99] transition"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Nuovo Mezzo Auto / Moto</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-3 pb-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca mezzo o targa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-800/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 border border-slate-700/60 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-950/60 p-1 text-[11px] font-medium border border-slate-800/60">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded py-1 transition ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tutti ({models.length})
            </button>
            <button
              onClick={() => setFilterType('auto')}
              className={`flex items-center justify-center gap-1 rounded py-1 transition ${
                filterType === 'auto'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="h-3 w-3" /> ({autoCount})
            </button>
            <button
              onClick={() => setFilterType('moto')}
              className={`flex items-center justify-center gap-1 rounded py-1 transition ${
                filterType === 'moto'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bike className="h-3 w-3" /> ({motoCount})
            </button>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 pt-1 flex items-center justify-between">
            <span>I tuoi Mezzi ({filteredModels.length})</span>
          </div>

          {filteredModels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center">
              <p className="text-xs text-slate-400">Nessun mezzo trovato.</p>
              <button
                onClick={onOpenNewModel}
                className="mt-2 text-xs font-bold text-amber-400 hover:underline"
              >
                Aggiungi mezzo
              </button>
            </div>
          ) : (
            filteredModels.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    if (isOpenMobile) onCloseMobile();
                  }}
                  className={`group relative flex w-full items-center justify-between rounded-xl p-2.5 text-left transition ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                      : 'border border-transparent hover:bg-slate-800/60 hover:text-white text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        model.type === 'auto'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {model.type === 'auto' ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate text-white">
                        {model.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        {model.plate && (
                          <span className="font-mono text-[10px] text-amber-300">
                            {model.plate}
                          </span>
                        )}
                        <span>•</span>
                        <span>{model.records.length} int.</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className={`h-4 w-4 shrink-0 transition ${isSelected ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
