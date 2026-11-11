import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Plus, 
  Car, 
  Bike, 
  Wrench
} from 'lucide-react';
import { VehicleModel, MaintenanceRecord, DriveFolderConfig, FixedDeadlines } from './types';
import { 
  loadStoredModels, 
  saveStoredModels, 
  loadDriveConfig, 
  saveDriveConfig 
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ModelSheetView } from './components/ModelSheetView';
import { ModelEditorModal } from './components/ModelEditorModal';
import { SheetRecordModal } from './components/SheetRecordModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { EditDeadlinesModal } from './components/EditDeadlinesModal';
import { DriveConnectionModal } from './components/DriveConnectionModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

export default function App() {
  const [models, setModels] = useState<VehicleModel[]>(loadStoredModels);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(() => {
    const stored = loadStoredModels();
    return stored.length > 0 ? stored[0].id : null;
  });
  const [driveConfig, setDriveConfig] = useState<DriveFolderConfig>(loadDriveConfig);

  // Mobile drawer state
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Modals state
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);

  // Detail Modal for clicked intervention
  const [detailRecord, setDetailRecord] = useState<MaintenanceRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Dedicated Deadlines Modal
  const [isEditDeadlinesOpen, setIsEditDeadlinesOpen] = useState(false);

  // Drive Connection Modal
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Persist models
  useEffect(() => {
    saveStoredModels(models);
  }, [models]);

  // Persist drive config
  useEffect(() => {
    saveDriveConfig(driveConfig);
  }, [driveConfig]);

  // Current active model
  const activeModel = models.find((m) => m.id === selectedModelId) || models[0] || null;

  // Add / Edit Model Handler
  const handleSaveModel = (savedModel: VehicleModel) => {
    setModels((prev) => {
      const existsIndex = prev.findIndex((m) => m.id === savedModel.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedModel;
        return updated;
      } else {
        return [...prev, savedModel];
      }
    });
    setSelectedModelId(savedModel.id);
  };

  // Delete Model Handler
  const handleDeleteModel = (modelId: string) => {
    setModels((prev) => {
      const remaining = prev.filter((m) => m.id !== modelId);
      if (selectedModelId === modelId) {
        setSelectedModelId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Save Deadlines Handler
  const handleSaveDeadlines = (modelId: string, deadlines: FixedDeadlines) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        return {
          ...m,
          deadlines,
        };
      })
    );
  };

  // Add / Edit Record Handler
  const handleSaveRecord = (savedRecord: MaintenanceRecord) => {
    if (!activeModel) return;

    setModels((prev) => {
      return prev.map((m) => {
        if (m.id !== activeModel.id) return m;

        const recordIndex = m.records.findIndex((r) => r.id === savedRecord.id);
        let updatedRecords: MaintenanceRecord[];
        if (recordIndex >= 0) {
          updatedRecords = [...m.records];
          updatedRecords[recordIndex] = savedRecord;
        } else {
          updatedRecords = [savedRecord, ...m.records];
        }

        return {
          ...m,
          records: updatedRecords,
        };
      });
    });

    // Update detail view if currently open
    if (detailRecord && detailRecord.id === savedRecord.id) {
      setDetailRecord(savedRecord);
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = (recordId: string) => {
    if (!activeModel) return;

    setModels((prev) => {
      return prev.map((m) => {
        if (m.id !== activeModel.id) return m;
        return {
          ...m,
          records: m.records.filter((r) => r.id !== recordId),
        };
      });
    });

    if (detailRecord && detailRecord.id === recordId) {
      setIsDetailModalOpen(false);
      setDetailRecord(null);
    }
  };

  // Click on record item: opens detail modal
  const handleSelectRecord = (rec: MaintenanceRecord) => {
    setDetailRecord(rec);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* TOP ROW: ICONA E NOME DELL'APP A SINISTRA, TASTO DRIVE A DESTRA (COME ADOdoc) */}
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 bg-slate-900 border-b border-slate-800 z-30 shadow-md">
        {/* Left: Hamburger + App Icon + ADOcar Title */}
        <div className="flex items-center gap-3">
          {/* Hamburger on mobile to open left menu */}
          <button
            onClick={() => setIsOpenMobile(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition lg:hidden"
            aria-label="Apri menu veicoli"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* App Icon (logo ADOcar) */}
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}assets/icon-192.png`}
              alt="Icona ADOcar"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover border border-amber-500/50 shadow-md shadow-amber-500/10"
            />
            <div>
              <div className="flex items-center gap-1.5 font-black text-lg sm:text-xl text-white tracking-tight leading-none">
                <span className="text-amber-400">ADO</span>
                <span>car</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 hidden sm:block">
                Manutenzione Auto &amp; Moto
              </p>
            </div>
          </div>
        </div>

        {/* Right: Google Drive Connection Status Button (Stile ADOdoc - No Duplicates) */}
        <div className="flex items-center gap-2">
          {driveConfig.isConnected ? (
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 px-3 py-1.5 text-xs text-white font-medium transition shadow-xs"
              title="Google Drive connesso - Clicca per sincronizzare o gestire"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {/* Google Drive Tri-color Icon */}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span className="font-semibold text-emerald-300 hidden sm:inline">Drive Connesso</span>
              <span className="font-semibold text-emerald-300 sm:hidden">Drive</span>
            </button>
          ) : (
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 px-3 py-1.5 text-xs text-slate-200 font-medium transition shadow-xs"
              title="Connetti al tuo Google Drive"
            >
              {/* Google Drive Tri-color Icon */}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span className="font-semibold text-slate-200 hidden sm:inline">Connetti a Drive</span>
              <span className="font-semibold text-slate-200 sm:hidden">Drive</span>
            </button>
          )}
        </div>
      </header>

      {/* BODY AREA: SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Responsive Left Sidebar Drawer for Vehicles */}
        <Sidebar
          models={models}
          selectedModelId={activeModel?.id || null}
          onSelectModel={(id) => setSelectedModelId(id)}
          onOpenNewModel={() => {
            setEditingModel(null);
            setIsModelModalOpen(true);
          }}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
        />

        {/* Main View Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeModel ? (
            <ModelSheetView
              model={activeModel}
              onOpenEditModel={() => {
                setEditingModel(activeModel);
                setIsModelModalOpen(true);
              }}
              onOpenAddRecord={() => {
                setEditingRecord(null);
                setIsRecordModalOpen(true);
              }}
              onSelectRecord={handleSelectRecord}
              onOpenEditDeadlines={() => setIsEditDeadlinesOpen(true)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-950">
              <img
                src={`${import.meta.env.BASE_URL}assets/icon-192.png`}
                alt="ADOcar"
                className="h-20 w-20 rounded-2xl object-cover border-2 border-amber-500/40 shadow-2xl mb-4"
              />
              <h2 className="text-xl font-bold text-white">Nessun veicolo presente</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">
                Aggiungi la tua prima auto o moto per gestire scadenze di revisione, assicurazione, bollo e tutti gli interventi di manutenzione.
              </p>
              <button
                onClick={() => {
                  setEditingModel(null);
                  setIsModelModalOpen(true);
                }}
                className="mt-6 flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Aggiungi Mezzo</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Edit Vehicle (Auto/Moto, Targa) */}
      <ModelEditorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSave={handleSaveModel}
        onDelete={handleDeleteModel}
        initialModel={editingModel}
        existingNames={models.map((m) => m.name)}
      />

      {/* Modal: Edit Deadlines (Revisione, Assicurazione, Bollo) */}
      {activeModel && (
        <EditDeadlinesModal
          isOpen={isEditDeadlinesOpen}
          onClose={() => setIsEditDeadlinesOpen(false)}
          model={activeModel}
          onSaveDeadlines={handleSaveDeadlines}
        />
      )}

      {/* Modal: Add / Edit Maintenance Intervention */}
      {activeModel && (
        <SheetRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSave={handleSaveRecord}
          model={activeModel}
          initialRecord={editingRecord}
        />
      )}

      {/* Modal: Detail View for Clicked Intervention */}
      {activeModel && (
        <RecordDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailRecord(null);
          }}
          record={detailRecord}
          vehicleName={activeModel.name}
          onEdit={(rec) => {
            setEditingRecord(rec);
            setIsRecordModalOpen(true);
          }}
          onDelete={handleDeleteRecord}
        />
      )}

      {/* Modal: Google Drive Connection & Sync (Stile ADOdoc) */}
      <DriveConnectionModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        config={driveConfig}
        onUpdateConfig={(cfg) => setDriveConfig(cfg)}
        models={models}
      />
    </div>
  );
}
