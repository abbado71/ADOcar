export type VehicleType = 'auto' | 'moto';

export interface DeadlineItem {
  expiryDate: string; // YYYY-MM-DD or DD/MM/YYYY
  cost: number;
}

export interface FixedDeadlines {
  revisione: DeadlineItem;
  assicurazione: DeadlineItem;
  bollo: DeadlineItem;
}

export interface MaintenanceRecord {
  id: string;
  manutenzioneEffettuata: string;
  presso: string;
  note: string;
  costo: number;
  data: string;
  km: number;
  prossimoIntervento?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleModel {
  id: string;
  name: string; // MEZZO (es. "Jeep Compass", "Suzuki Swift")
  sheetTabName: string; // Nome della scheda nel foglio
  plate: string; // TARGA (es. "FZ613BN")
  type: VehicleType;
  brand: string;
  modelName: string;
  deadlines: FixedDeadlines;
  records: MaintenanceRecord[];
  notes?: string;
  createdAt: string;
  updatedAt?: string; // ultima modifica del mezzo (usata per la sincronizzazione tra dispositivi)
}

export interface DriveFolderConfig {
  folderName: string; // "ADocar"
  spreadsheetName: string; // "ADOcar_manutenzione_Auto_Moto"
  isConnected: boolean;
  userEmail?: string;
  lastSyncedAt?: string;
  webhookUrl?: string;
}
