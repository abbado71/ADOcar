import React, { useState } from 'react';
import { 
  Car, 
  Bike, 
  Plus, 
  Edit3, 
  Calendar, 
  Search, 
  Clock, 
  ChevronRight, 
  Wrench, 
  ShieldCheck, 
  DollarSign, 
  Gauge, 
  AlertTriangle,
  User
} from 'lucide-react';
import { VehicleModel, MaintenanceRecord } from '../types';
import { formatDisplayDate } from '../utils/excelExporter';

interface ModelSheetViewProps {
  model: VehicleModel;
  onOpenEditModel: () => void;
  onOpenAddRecord: () => void;
  onSelectRecord: (record: MaintenanceRecord) => void;
  onOpenEditDeadlines: () => void;
}

export const ModelSheetView: React.FC<ModelSheetViewProps> = ({
  model,
  onOpenEditModel,
  onOpenAddRecord,
  onSelectRecord,
  onOpenEditDeadlines,
}) => {
  const [activeTab, setActiveTab] = useState<'scadenze' | 'interventi'>('interventi');
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter
  const filteredRecords = model.records.filter((rec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (rec.manutenzioneEffettuata || '').toLowerCase().includes(q) ||
      (rec.presso || '').toLowerCase().includes(q) ||
      (rec.note || '').toLowerCase().includes(q) ||
      (rec.data || '').toLowerCase().includes(q)
    );
  });

  // Expiration check helper
  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Non impostata', days: null, color: 'text-slate-500 bg-slate-800/80 border-slate-700' };
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Scaduta', days: diffDays, color: 'text-rose-400 bg-rose-950/60 border-rose-700/50' };
    }
    if (diffDays <= 30) {
      return { label: `In scadenza (${diffDays} gg)`, days: diffDays, color: 'text-amber-400 bg-amber-950/60 border-amber-700/50' };
    }
    return { label: `Valida (${diffDays} gg)`, days: diffDays, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50' };
  };

  const totalMaintenanceCost = model.records.reduce((sum, r) => sum + (Number(r.costo) || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Vehicle Header & Tab Navigation */}
      <div className="px-4 lg:px-8 pt-5 pb-0 border-b border-slate-800 bg-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${
                model.type === 'auto'
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {model.type === 'auto' ? <Car className="h-6 w-6" /> : <Bike className="h-6 w-6" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {model.name}
                </h1>
                {model.plate && (
                  <span className="rounded-lg bg-amber-400/15 px-2.5 py-0.5 text-xs font-mono font-black text-amber-300 border border-amber-400/30">
                    {model.plate}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    model.type === 'auto'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {model.type === 'auto' ? 'Auto' : 'Moto'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {model.records.length} {model.records.length === 1 ? 'intervento registrato' : 'interventi registrati'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEditModel}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              title="Modifica targa o scadenze del mezzo"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
              <span>Modifica Mezzo</span>
            </button>

            <button
              onClick={onOpenAddRecord}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Nuovo Intervento</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: "Interventi" & "Scadenze" */}
        <div className="flex gap-2 border-b border-transparent">
          <button
            onClick={() => setActiveTab('interventi')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition relative ${
              activeTab === 'interventi'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Elenco Interventi</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.2 text-xs font-mono font-bold text-slate-300">
              {model.records.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scadenze')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition relative ${
              activeTab === 'scadenze'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Scadenze Mezzo</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: ELENCO INTERVENTI */}
      {activeTab === 'interventi' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search bar inside interventions */}
          <div className="px-4 lg:px-8 py-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca per manutenzione effettuata, data o meccanico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div className="text-xs text-slate-400">
              {totalMaintenanceCost > 0 && (
                <span>
                  Totale: <strong className="text-emerald-400 font-mono font-bold">€ {totalMaintenanceCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
            </div>
          </div>

          {/* List of Interventions */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
                <Wrench className="h-10 w-10 text-amber-400/60 mb-3" />
                <h3 className="text-sm font-bold text-white">Nessun intervento trovato</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  {searchQuery ? 'Nessun risultato per la ricerca inserita.' : 'Inizia ad aggiungere tagliandi, pastiglie freni, cambi gomme o controlli.'}
                </p>
                <button
                  onClick={onOpenAddRecord}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Aggiungi Primo Intervento</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 px-2 flex items-center justify-between">
                  <span>Tocca o clicca su una voce per visualizzare, modificare o eliminare i dettagli</span>
                  <span>{filteredRecords.length} voci</span>
                </div>

                {filteredRecords.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onSelectRecord(rec)}
                    className="group relative flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-500/50 p-4 cursor-pointer transition shadow-xs active:scale-[0.995]"
                  >
                    {/* Left: Manutenzione effettuata & Data */}
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition">
                        <Wrench className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Manutenzione effettuata (Testo completo senza troncamento) */}
                        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-amber-300 transition break-words">
                          {rec.manutenzioneEffettuata}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          {/* Data Intervento */}
                          <span className="flex items-center gap-1 font-mono font-medium text-slate-200">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            {formatDisplayDate(rec.data) || 'Data non specificata'}
                          </span>

                          {/* Presso (se presente) */}
                          {rec.presso && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-300">
                              <User className="h-3 w-3 text-slate-500" />
                              <strong className="font-normal text-amber-200/90">{rec.presso}</strong>
                            </span>
                          )}

                          {/* Km (se presente) */}
                          {rec.km ? (
                            <span className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                              <Gauge className="h-3 w-3 text-blue-400" />
                              {Number(rec.km).toLocaleString('it-IT')} km
                            </span>
                          ) : null}

                          {/* Prossimo intervento (se presente) */}
                          {rec.prossimoIntervento && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-300 font-mono">
                              <Clock className="h-3 w-3 text-amber-400" />
                              Prossimo: {formatDisplayDate(rec.prossimoIntervento)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Costo & Freccia */}
                    <div className="flex items-center gap-3 shrink-0">
                      {rec.costo !== undefined && rec.costo !== null && rec.costo !== 0 ? (
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-emerald-400">
                            € {Number(rec.costo).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : null}

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SCADENZE MEZZO */}
      {activeTab === 'scadenze' && (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Scadenze &amp; Obblighi di Legge</h2>
              <p className="text-xs text-slate-400">
                Monitoraggio periodico di revisione ministeriale, assicurazione RCA e bollo auto
              </p>
            </div>
            <button
              onClick={onOpenEditDeadlines}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Modifica Scadenze</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* REVISIONE */}
            <div
              onClick={onOpenEditDeadlines}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 p-5 shadow-lg relative overflow-hidden cursor-pointer transition active:scale-[0.99] group"
              title="Clicca per modificare la scadenza della revisione"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition">
                  REVISIONE
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getExpiryStatus(model.deadlines?.revisione?.expiryDate).color}`}>
                  {getExpiryStatus(model.deadlines?.revisione?.expiryDate).label}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Data Scadenza</span>
                  <span className="text-lg font-bold font-mono text-white">
                    {formatDisplayDate(model.deadlines?.revisione?.expiryDate) || 'Non specificata'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Costo previsto</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    € {Number(model.deadlines?.revisione?.cost || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-amber-400/70 group-hover:text-amber-300 flex items-center justify-end gap-1">
                <Edit3 className="h-3 w-3" />
                <span>Modifica</span>
              </div>
            </div>

            {/* ASSICURAZIONE */}
            <div
              onClick={onOpenEditDeadlines}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 p-5 shadow-lg relative overflow-hidden cursor-pointer transition active:scale-[0.99] group"
              title="Clicca per modificare la scadenza dell'assicurazione"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition">
                  ASSICURAZIONE
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getExpiryStatus(model.deadlines?.assicurazione?.expiryDate).color}`}>
                  {getExpiryStatus(model.deadlines?.assicurazione?.expiryDate).label}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Data Scadenza</span>
                  <span className="text-lg font-bold font-mono text-white">
                    {formatDisplayDate(model.deadlines?.assicurazione?.expiryDate) || 'Non specificata'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Costo polizza</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    € {Number(model.deadlines?.assicurazione?.cost || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-amber-400/70 group-hover:text-amber-300 flex items-center justify-end gap-1">
                <Edit3 className="h-3 w-3" />
                <span>Modifica</span>
              </div>
            </div>

            {/* BOLLO */}
            <div
              onClick={onOpenEditDeadlines}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 p-5 shadow-lg relative overflow-hidden cursor-pointer transition active:scale-[0.99] group"
              title="Clicca per modificare la scadenza del bollo auto"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition">
                  BOLLO AUTO
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getExpiryStatus(model.deadlines?.bollo?.expiryDate).color}`}>
                  {getExpiryStatus(model.deadlines?.bollo?.expiryDate).label}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Data Scadenza</span>
                  <span className="text-lg font-bold font-mono text-white">
                    {formatDisplayDate(model.deadlines?.bollo?.expiryDate) || 'Non specificata'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Importo tassa</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    € {Number(model.deadlines?.bollo?.cost || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-amber-400/70 group-hover:text-amber-300 flex items-center justify-end gap-1">
                <Edit3 className="h-3 w-3" />
                <span>Modifica</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
