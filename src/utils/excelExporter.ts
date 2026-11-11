import * as XLSX from 'xlsx';
import { VehicleModel, MaintenanceRecord, FixedDeadlines } from '../types';

export function sanitizeSheetName(name: string): string {
  const sanitized = name.replace(/[\\/?*\[\]:]/g, '_').trim();
  return sanitized.slice(0, 31) || 'Mezzo';
}

/**
 * Format date for Excel display (DD/MM/YYYY)
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Parse date from DD/MM/YYYY or timestamp to YYYY-MM-DD
 */
export function parseDateToISO(dateVal: any): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'number') {
    // Excel date serial number
    const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  const str = String(dateVal).trim();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    if (d && m && y) {
      const year = y.length === 2 ? `20${y}` : y;
      const month = m.padStart(2, '0');
      const day = d.padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return str;
}

/**
 * Build worksheet with exact visual format from the user's Excel file:
 * Row 1: MEZZO | TARGA
 * Row 2: [Name] | [Plate]
 * Row 4: [empty] | SCADENZA | COSTO
 * Row 5: REVISIONE: | [Date] | [Cost]
 * Row 6: ASSICURAZIONE: | [Date] | [Cost]
 * Row 7: BOLLO: | [Date] | [Cost]
 * Row 9: [empty] | [empty] | [empty] | SCHEDA MANUTENZIONE
 * Row 10: MANUTENZIONE EFFETTUATA | PRESSO | NOTE | COSTO € | DATA | KM | PROSSIMO INTERVENTO
 * Row 11+: records
 */
export function buildVehicleWorksheet(model: VehicleModel): XLSX.WorkSheet {
  const aoa: any[][] = [];

  // Row 1 & 2: MEZZO & TARGA
  aoa[0] = ['MEZZO', 'TARGA'];
  aoa[1] = [model.name, model.plate || ''];
  aoa[2] = []; // Row 3 empty

  // Row 4 to 7: Scadenze
  aoa[3] = ['', 'SCADENZA', 'COSTO'];
  aoa[4] = [
    'REVISIONE:',
    formatDisplayDate(model.deadlines?.revisione?.expiryDate),
    model.deadlines?.revisione?.cost || 0,
  ];
  aoa[5] = [
    'ASSICURAZIONE:',
    formatDisplayDate(model.deadlines?.assicurazione?.expiryDate),
    model.deadlines?.assicurazione?.cost || 0,
  ];
  aoa[6] = [
    'BOLLO:',
    formatDisplayDate(model.deadlines?.bollo?.expiryDate),
    model.deadlines?.bollo?.cost || 0,
  ];
  aoa[7] = []; // Row 8 empty

  // Row 9: Banner
  aoa[8] = ['', '', '', 'SCHEDA MANUTENZIONE'];

  // Row 10: Maintenance headers
  aoa[9] = [
    'MANUTENZIONE EFFETTUATA',
    'PRESSO',
    'NOTE',
    'COSTO €',
    'DATA',
    'KM',
    'PROSSIMO INTERVENTO',
  ];

  // Row 11+: Records
  model.records.forEach((rec) => {
    aoa.push([
      rec.manutenzioneEffettuata || '',
      rec.presso || '',
      rec.note || '',
      rec.costo !== undefined && rec.costo !== null ? Number(rec.costo) : 0,
      formatDisplayDate(rec.data),
      rec.km !== undefined && rec.km !== null ? Number(rec.km) : '',
      formatDisplayDate(rec.prossimoIntervento),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = [
    { wch: 32 }, // MANUTENZIONE EFFETTUATA / MEZZO
    { wch: 18 }, // PRESSO / TARGA / SCADENZA
    { wch: 48 }, // NOTE / COSTO
    { wch: 14 }, // COSTO €
    { wch: 14 }, // DATA
    { wch: 14 }, // KM
    { wch: 22 }, // PROSSIMO INTERVENTO
  ];

  return ws;
}

/**
 * Export all vehicle models into a single Excel workbook,
 * where each vehicle model has its own sheet with its exact name!
 */
export function exportFleetToExcel(
  models: VehicleModel[],
  fileName: string = 'ADOcar_manutenzione_Auto_Moto.xlsx'
) {
  const wb = XLSX.utils.book_new();

  if (models.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['Nessun veicolo configurato']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Flotta');
  } else {
    models.forEach((model) => {
      const sheetName = sanitizeSheetName(model.sheetTabName || model.name);
      const ws = buildVehicleWorksheet(model);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
  }

  XLSX.writeFile(wb, fileName);
}

/**
 * Export single vehicle sheet to Excel
 */
export function exportSingleModelToExcel(model: VehicleModel) {
  const wb = XLSX.utils.book_new();
  const sheetName = sanitizeSheetName(model.sheetTabName || model.name);
  const ws = buildVehicleWorksheet(model);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${sheetName}_ADOcar.xlsx`);
}

/**
 * Parse user uploaded Excel workbook matching ADOcar format
 */
export async function parseExcelFile(file: File): Promise<VehicleModel[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  const parsedModels: VehicleModel[] = [];

  wb.SheetNames.forEach((sheetName, sIdx) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    if (!rows || rows.length === 0) return;

    // Row 1 & 2: MEZZO & TARGA
    let mezzoName = sheetName;
    let targa = '';

    if (rows.length > 1) {
      if (rows[1] && rows[1][0]) mezzoName = String(rows[1][0]).trim();
      if (rows[1] && rows[1][1]) targa = String(rows[1][1]).trim();
    }

    // Default deadlines
    const deadlines: FixedDeadlines = {
      revisione: { expiryDate: '', cost: 0 },
      assicurazione: { expiryDate: '', cost: 0 },
      bollo: { expiryDate: '', cost: 0 },
    };

    // Find deadline rows
    rows.forEach((row) => {
      if (!row || !row[0]) return;
      const label = String(row[0]).toLowerCase();
      if (label.includes('revisione')) {
        deadlines.revisione = {
          expiryDate: parseDateToISO(row[1]),
          cost: parseFloat(row[2]) || 0,
        };
      } else if (label.includes('assicurazione')) {
        deadlines.assicurazione = {
          expiryDate: parseDateToISO(row[1]),
          cost: parseFloat(row[2]) || 0,
        };
      } else if (label.includes('bollo')) {
        deadlines.bollo = {
          expiryDate: parseDateToISO(row[1]),
          cost: parseFloat(row[2]) || 0,
        };
      }
    });

    // Find row with "MANUTENZIONE EFFETTUATA"
    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r && r[0] && String(r[0]).toUpperCase().includes('MANUTENZIONE EFFETTUATA')) {
        headerRowIdx = i;
        break;
      }
    }

    const records: MaintenanceRecord[] = [];
    if (headerRowIdx >= 0) {
      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || (!r[0] && !r[3] && !r[4])) continue;

        const manutenzione = String(r[0] || '').trim();
        if (!manutenzione) continue;

        records.push({
          id: `rec_${sIdx}_${i}_${Date.now()}`,
          manutenzioneEffettuata: manutenzione,
          presso: String(r[1] || '').trim(),
          note: String(r[2] || '').trim(),
          costo: parseFloat(r[3]) || 0,
          data: parseDateToISO(r[4]),
          km: typeof r[5] === 'number' ? r[5] : parseInt(String(r[5] || '').replace(/\D/g, ''), 10) || 0,
          prossimoIntervento: parseDateToISO(r[6]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    parsedModels.push({
      id: `m_imported_${sIdx}_${Date.now()}`,
      name: mezzoName,
      sheetTabName: sanitizeSheetName(sheetName),
      plate: targa,
      type: sheetName.toLowerCase().includes('moto') ? 'moto' : 'auto',
      brand: mezzoName.split(' ')[0] || 'Mezzo',
      modelName: mezzoName.split(' ').slice(1).join(' ') || mezzoName,
      deadlines,
      records,
      createdAt: new Date().toISOString(),
    });
  });

  return parsedModels;
}
