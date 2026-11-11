import React, { useState } from 'react';
import { 
  X, 
  FolderSync, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  FileSpreadsheet, 
  RefreshCw, 
  LogOut,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { DriveFolderConfig, VehicleModel } from '../types';
import { googleSignIn, getAccessToken, logoutGoogle } from '../services/googleAuth';
import { syncFleetToGoogle, DriveSyncResult } from '../services/driveSheetsService';

interface DriveConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DriveFolderConfig;
  onUpdateConfig: (newConfig: DriveFolderConfig) => void;
  models: VehicleModel[];
}

export const DriveConnectionModal: React.FC<DriveConnectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  models,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<DriveSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectAndSync = async () => {
    setError(null);
    setIsSyncing(true);

    try {
      let token = await getAccessToken();
      let userEmail = config.userEmail;

      if (!token) {
        const authResult = await googleSignIn();
        if (!authResult) {
          throw new Error('Accesso Google annullato.');
        }
        token = authResult.accessToken;
        userEmail = authResult.user.email || 'ado.domenico@gmail.com';
      }

      // Perform real sync: Create "ADocar" folder and "ADOcar_manutenzione_Auto_Moto" spreadsheet
      const result = await syncFleetToGoogle(token, models);
      setSyncResult(result);

      onUpdateConfig({
        ...config,
        isConnected: true,
        userEmail,
        lastSyncedAt: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Errore durante la connessione a Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logoutGoogle();
    } catch (e) {
      // ignore
    }
    onUpdateConfig({
      ...config,
      isConnected: false,
      userEmail: undefined,
      lastSyncedAt: undefined,
    });
    setSyncResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {/* Google Drive SVG Tri-color Icon */}
              <svg className="h-6 w-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Drive &amp; Fogli</h2>
              <p className="text-xs text-slate-400">Cartella /ADocar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="space-y-3 rounded-xl border border-rose-800/80 bg-rose-950/60 p-4 text-xs text-rose-200 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-white text-xs">
                    {error.toLowerCase().includes('popup') || error.toLowerCase().includes('finestra')
                      ? 'Finestra di accesso chiusa o bloccata'
                      : 'Errore di connessione'}
                  </h4>
                  <p className="mt-1 leading-relaxed text-rose-200/90">{error}</p>
                </div>
              </div>

              {(error.toLowerCase().includes('popup') || error.toLowerCase().includes('finestra')) && (
                <div className="mt-2 rounded-lg bg-slate-900/80 border border-slate-800 p-3 space-y-2 text-[11px] text-slate-300">
                  <div className="font-semibold text-amber-300">Come risolvere in 2 passaggi:</div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      1
                    </span>
                    <span>
                      Verifica se nella barra degli indirizzi in alto a destra compare l'icona del <strong>blocco popup</strong> (una finestrella con la crocetta rossa). Cliccaci e seleziona <strong>"Consenti sempre i popup"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      2
                    </span>
                    <span>
                      Clicca su <strong>Riprova Connessione</strong> qui sotto, seleziona il tuo account Google e conferma l'autorizzazione.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isSyncing}
                onClick={handleConnectAndSync}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-98 py-2 text-xs font-bold text-white transition disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Riprova Connessione</span>
              </button>
            </div>
          )}

          {config.isConnected ? (
            <div className="space-y-4">
              {/* Connected Banner */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">Google Drive Connesso</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {config.userEmail || 'ado.domenico@gmail.com'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-700/50">
                  Attivo
                </span>
              </div>

              {/* Folder & Sheet direct links */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> Cartella Drive:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">/{config.folderName}</span>
                    {syncResult?.folderUrl && (
                      <a
                        href={syncResult.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 underline font-medium"
                      >
                        Apri <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> File Foglio:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200">{config.spreadsheetName}</span>
                    {syncResult?.spreadsheetUrl && (
                      <a
                        href={syncResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 underline font-medium"
                      >
                        Apri <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {config.lastSyncedAt && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400">Ultima sincronizzazione:</span>
                    <span className="text-slate-300 font-mono">oggi alle {config.lastSyncedAt}</span>
                  </div>
                )}
              </div>

              {syncResult?.success && (
                <div className="flex items-start gap-2.5 text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div className="leading-relaxed">
                    Cartella <strong>ADocar</strong> e foglio sincronizzati con successo sul tuo Google Drive! Ciascun mezzo ha la propria scheda dedicata.
                  </div>
                </div>
              )}

              {/* Sync Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleConnectAndSync}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 active:scale-98 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizzazione in corso...' : 'Sincronizza Ora su Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition"
                  title="Disconnetti account Drive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnetti</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicca sul pulsante per autorizzare e creare automaticamente nel tuo <strong>Google Drive</strong> personale la cartella <strong className="text-amber-400 font-mono">/ADocar</strong> e il foglio di calcolo con le schede dei tuoi mezzi.
              </p>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Crea la cartella <strong>ADocar</strong> nel tuo Drive</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Genera il file <strong>{config.spreadsheetName}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Crea una scheda (tab) per ciascun mezzo ({models.map(m => m.name).join(', ')})</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSyncing}
                onClick={handleConnectAndSync}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 active:scale-98 transition disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creazione cartella ADOcar e sincronizzazione...</span>
                  </>
                ) : (
                  <>
                    {/* Google Drive SVG Tri-color Icon */}
                    <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#ffffff"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#ffffff"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ffffff"/>
                    </svg>
                    <span>Connetti e Crea Cartella ADOcar</span>
                  </>
                )}
              </button>

              <div className="pt-1 text-center">
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-amber-400 underline decoration-slate-600 transition"
                  title="Apri l'app direttamente in una nuova scheda del browser"
                >
                  <span>Oppure apri l'app a schermo intero in una nuova scheda</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
