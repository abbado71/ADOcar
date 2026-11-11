import React, { useState } from 'react';
import { 
  X, 
  FolderSync, 
  FileSpreadsheet, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Info,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { DriveFolderConfig, VehicleModel } from '../types';

interface DriveFolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DriveFolderConfig;
  onSaveConfig: (config: DriveFolderConfig) => void;
  models: VehicleModel[];
}

export const DriveFolderSettingsModal: React.FC<DriveFolderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  models,
}) => {
  const [folderName, setFolderName] = useState(config.folderName || 'ADocar');
  const [spreadsheetName, setSpreadsheetName] = useState(config.spreadsheetName || 'ADocar_Gestione_Mezzi');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);

  const sampleAppsScript = `// Codice Google Apps Script per la cartella ADocar
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var folderName = "ADocar";
  var ssName = "ADocar_Gestione_Mezzi";
  
  // Trova o crea cartella ADocar
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  
  // Trova o crea Foglio
  var files = folder.getFilesByName(ssName);
  var ss = files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(ssName);
  
  // Trova o crea tab per il modello del veicolo
  var sheet = ss.getSheetByName(data.sheetTabName);
  if (!sheet) {
    sheet = ss.insertSheet(data.sheetTabName);
    if (data.headers) sheet.appendRow(data.headers);
  }
  
  if (data.row) {
    sheet.appendRow(data.row);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: "ok"})).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleAppsScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      folderName: folderName.trim() || 'ADocar',
      spreadsheetName: spreadsheetName.trim() || 'ADocar_Gestione_Mezzi',
      webhookUrl: webhookUrl.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FolderSync className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurazione Google Drive & Fogli</h2>
              <p className="text-xs text-slate-400">
                Struttura per la cartella <span className="text-emerald-400 font-mono">/{folderName}</span>
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

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Drive Folder & Sheet name inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Cartella in Google Drive *
              </label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm">
                <FolderOpen className="h-4 w-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="bg-transparent text-white font-mono text-sm w-full focus:outline-hidden"
                  placeholder="ADocar"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                La cartella nel tuo Drive dove risiede il foglio.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome File Foglio di Calcolo *
              </label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={spreadsheetName}
                  onChange={(e) => setSpreadsheetName(e.target.value)}
                  className="bg-transparent text-white font-mono text-sm w-full focus:outline-hidden"
                  placeholder="ADocar_Gestione_Mezzi"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Il file Google Sheet o Excel principale.
              </p>
            </div>
          </div>

          {/* Tab Mapping Overview */}
          <div className="rounded-xl bg-slate-950/70 p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Mappatura Schede Veicoli ({models.length} mezzi configurati)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">1 Mezzo = 1 Foglio</span>
            </div>
            <p className="text-xs text-slate-400">
              Nel file Google Sheet all'interno di <strong className="text-white">/{folderName}</strong>, ogni mezzo ha la propria scheda separata:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {models.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800/90 px-2.5 py-1 text-xs border border-slate-700 font-mono"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-200">{m.sheetTabName}</span>
                  <span className="text-[10px] text-slate-400">({m.records.length} righe)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Webhook Sync method */}
          <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                Opzione Webhook Apps Script (senza popup OAuth)
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedScript ? 'Copiato!' : 'Copia Script'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Puoi anche incollare un URL Web App Google Apps Script per sincronizzare i dati direttamente nella cartella <code className="text-emerald-400 font-mono">ADocar</code> senza richiedere login continuo.
            </p>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec (opzionale)"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

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
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition"
            >
              Salva Configurazione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
