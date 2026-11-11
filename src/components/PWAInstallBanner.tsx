import React, { useState } from 'react';
import { Download, Smartphone, X, WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-xs border border-amber-400/40 animate-fade-in">
          <WifiOff className="h-4 w-4" />
          <span>Modalità Offline: I dati vengono salvati localmente e sono al sicuro.</span>
        </div>
      )}

      {/* PWA Install Button in Header or Bar */}
      {!isInstalled && !dismissed && (isInstallable || isIOS) && (
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/60 border-b border-blue-500/20 px-4 py-2 text-xs flex items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-400 shrink-0" />
            <span>
              Installa <strong className="text-white">ADocar</strong> come app sul tuo dispositivo per usarla a tutto schermo e offline.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 font-semibold text-white shadow-xs transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Installa App</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 font-semibold text-slate-200 border border-slate-700 transition"
              >
                <span>Installa su iPhone/iPad</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-white"
              aria-label="Nascondi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-400" />
                Installa su iOS (iPhone/iPad)
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-4 space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold text-[11px]">
                  1
                </span>
                <span>Tocca l'icona <strong>Condividi</strong> nella barra di Safari in basso.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold text-[11px]">
                  2
                </span>
                <span>Scorri il menu e tocca <strong>"Aggiungi alla schermata Home"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold text-[11px]">
                  3
                </span>
                <span>Conferma con <strong>Aggiungi</strong> in alto a destra.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
