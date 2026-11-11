import { VehicleModel, DriveFolderConfig, FixedDeadlines } from '../types';

const STORAGE_KEY_MODELS = 'adocar_models_v2';
const STORAGE_KEY_DRIVE = 'adocar_drive_config_v2';

export const INITIAL_MODELS: VehicleModel[] = [
  {
    id: 'm_jeep_compass',
    name: 'Jeep Compass',
    sheetTabName: 'Jeep Compass',
    plate: 'FZ613BN',
    type: 'auto',
    brand: 'Jeep',
    modelName: 'Compass',
    deadlines: {
      revisione: { expiryDate: '2027-03-15', cost: 68.5 },
      assicurazione: { expiryDate: '2027-08-07', cost: 370.0 },
      bollo: { expiryDate: '2027-01-31', cost: 200.29 },
    },
    notes: 'Suv familiare aziendale - tagliandi regolari con Luigi e pneumatici da Seminara',
    createdAt: '2026-01-01T08:00:00Z',
    records: [
      {
        id: 'rec_jc_1',
        manutenzioneEffettuata: 'Sostituzione 2 pneumatici anteriori',
        presso: 'Seminara',
        note: 'Pneumatici KEBLER',
        costo: 250.0,
        data: '2026-09-25',
        km: 73958,
        prossimoIntervento: '',
        createdAt: '2026-09-25T10:00:00Z',
        updatedAt: '2026-09-25T10:00:00Z',
      },
      {
        id: 'rec_jc_2',
        manutenzioneEffettuata: 'Sostituzione pastiglie anteriori',
        presso: 'Luigi',
        note: '34,00 pastiglie , 20,00 lavoro',
        costo: 54.0,
        data: '2026-08-21',
        km: 72467,
        prossimoIntervento: '',
        createdAt: '2026-08-21T11:00:00Z',
        updatedAt: '2026-08-21T11:00:00Z',
      },
      {
        id: 'rec_jc_3',
        manutenzioneEffettuata: 'Tagliando',
        presso: 'Luigi',
        note: 'filtro olio, aria e gasolio, 5 litri olio Selenia 0W-20 costi: olio: 15 € litro, filtro olio + aria: 14, gasolio era a casa, manodopera 40€',
        costo: 129.0,
        data: '2025-10-04',
        km: 61100,
        prossimoIntervento: '2026-10-04',
        createdAt: '2025-10-04T09:30:00Z',
        updatedAt: '2025-10-04T09:30:00Z',
      },
      {
        id: 'rec_jc_4',
        manutenzioneEffettuata: 'Sostituzione 4 pneumatici',
        presso: 'Seminara',
        note: 'Pneumatici KEBLER',
        costo: 520.0,
        data: '2024-10-04',
        km: 52000,
        prossimoIntervento: '',
        createdAt: '2024-10-04T15:00:00Z',
        updatedAt: '2024-10-04T15:00:00Z',
      },
      {
        id: 'rec_jc_5',
        manutenzioneEffettuata: 'Sostituzione batteria',
        presso: 'Luigi',
        note: 'Batteria 70ah marca AAA comprata da Schillaci 130,00 + 10,00 per il montaggio',
        costo: 140.0,
        data: '2024-09-21',
        km: 51200,
        prossimoIntervento: '',
        createdAt: '2024-09-21T10:15:00Z',
        updatedAt: '2024-09-21T10:15:00Z',
      },
      {
        id: 'rec_jc_6',
        manutenzioneEffettuata: 'Tagliando',
        presso: 'Luigi',
        note: 'filtro olio, aria, 5 litri olio Selenia 0W-20 (15 €/l FILTRO GASOLIO comparato ma NON SOSTITUITO) costo totale materiale € 115 costo lavoro € 40,00',
        costo: 155.0,
        data: '2024-04-05',
        km: 44307,
        prossimoIntervento: '2025-04-05',
        createdAt: '2024-04-05T08:45:00Z',
        updatedAt: '2024-04-05T08:45:00Z',
      },
      {
        id: 'rec_jc_7',
        manutenzioneEffettuata: 'Sostituzione pastiglie anteriori',
        presso: 'Luigi',
        note: 'Controllo usura dischi effettuato',
        costo: 60.0,
        data: '2023-08-29',
        km: 37700,
        prossimoIntervento: '',
        createdAt: '2023-08-29T16:00:00Z',
        updatedAt: '2023-08-29T16:00:00Z',
      },
      {
        id: 'rec_jc_8',
        manutenzioneEffettuata: 'Inversione pneumatici',
        presso: 'Seminara',
        note: 'Equilibratura e controllo convergenza',
        costo: 0.0,
        data: '2023-06-23',
        km: 35600,
        prossimoIntervento: '',
        createdAt: '2023-06-23T14:30:00Z',
        updatedAt: '2023-06-23T14:30:00Z',
      },
      {
        id: 'rec_jc_9',
        manutenzioneEffettuata: 'Tagliando',
        presso: 'Luigi',
        note: 'filtro olio, aria, gasolio ed abitacolo',
        costo: 145.0,
        data: '2023-03-17',
        km: 30822,
        prossimoIntervento: '2024-03-17',
        createdAt: '2023-03-17T09:00:00Z',
        updatedAt: '2023-03-17T09:00:00Z',
      },
    ],
  },
  {
    id: 'm_suzuki_swift',
    name: 'Suzuki Swift',
    sheetTabName: 'Suzuki Swift',
    plate: 'GL941TK',
    type: 'auto',
    brand: 'Suzuki',
    modelName: 'Swift 1.2 Hybrid',
    deadlines: {
      revisione: { expiryDate: '2027-06-30', cost: 79.02 },
      assicurazione: { expiryDate: '2027-09-15', cost: 310.0 },
      bollo: { expiryDate: '2027-05-31', cost: 165.5 },
    },
    notes: 'City car ibrida - tagliandi annuali',
    createdAt: '2026-01-01T08:00:00Z',
    records: [
      {
        id: 'rec_sw_1',
        manutenzioneEffettuata: 'Tagliando e cambio candele',
        presso: 'Officina Suzuki',
        note: 'Tagliando ufficiale 30.000 km, olio 0W-16 e filtri',
        costo: 195.0,
        data: '2026-05-12',
        km: 28500,
        prossimoIntervento: '2027-05-12',
        createdAt: '2026-05-12T10:00:00Z',
        updatedAt: '2026-05-12T10:00:00Z',
      },
      {
        id: 'rec_sw_2',
        manutenzioneEffettuata: 'Sostituzione tergicristalli e controllo livelli',
        presso: 'Luigi',
        note: 'Spazzole Bosch Aerotwin',
        costo: 35.0,
        data: '2025-11-18',
        km: 21200,
        prossimoIntervento: '',
        createdAt: '2025-11-18T16:00:00Z',
        updatedAt: '2025-11-18T16:00:00Z',
      },
    ],
  },
];

export const INITIAL_DRIVE_CONFIG: DriveFolderConfig = {
  folderName: 'ADocar',
  spreadsheetName: 'ADOcar_manutenzione_Auto_Moto',
  isConnected: false,
};

export function loadStoredModels(): VehicleModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODELS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(INITIAL_MODELS));
      return INITIAL_MODELS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MODELS;
  } catch (e) {
    console.error('Error loading stored models:', e);
    return INITIAL_MODELS;
  }
}

export function saveStoredModels(models: VehicleModel[]) {
  try {
    localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(models));
  } catch (e) {
    console.error('Error saving models:', e);
  }
}

export function loadDriveConfig(): DriveFolderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRIVE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DRIVE, JSON.stringify(INITIAL_DRIVE_CONFIG));
      return INITIAL_DRIVE_CONFIG;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_DRIVE_CONFIG;
  }
}

export function saveDriveConfig(config: DriveFolderConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_DRIVE, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Drive config:', e);
  }
}
