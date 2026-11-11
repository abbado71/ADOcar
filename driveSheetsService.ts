import { VehicleModel } from '../types';
import { formatDisplayDate } from '../utils/excelExporter';

export interface DriveSyncResult {
  success: boolean;
  folderId: string;
  folderUrl: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Find or create the "ADocar" folder in the user's root Google Drive
 */
export async function findOrCreateADocarFolder(accessToken: string): Promise<{ folderId: string; folderUrl: string }> {
  // Check if folder "ADocar" already exists
  const query = encodeURIComponent("name = 'ADocar' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Errore durante la ricerca della cartella ADocar in Drive: ${errText}`);
  }

  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    const existing = listData.files[0];
    return {
      folderId: existing.id,
      folderUrl: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
    };
  }

  // Create "ADocar" folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'ADocar',
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Impossibile creare la cartella ADocar in Drive: ${errText}`);
  }

  const newFolder = await createRes.json();
  return {
    folderId: newFolder.id,
    folderUrl: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
  };
}

/**
 * Find or create the spreadsheet "ADOcar_manutenzione_Auto_Moto" inside folder ADocar
 */
export async function findOrCreateSpreadsheet(
  accessToken: string,
  folderId: string,
  spreadsheetName: string = 'ADOcar_manutenzione_Auto_Moto'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Check if spreadsheet already exists in folder
  const query = encodeURIComponent(`name = '${spreadsheetName}' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    if (listData.files && listData.files.length > 0) {
      const existing = listData.files[0];
      return {
        spreadsheetId: existing.id,
        spreadsheetUrl: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
      };
    }
  }

  // Create new Google Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: spreadsheetName,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Impossibile creare il foglio di calcolo: ${errText}`);
  }

  const newSheet = await createRes.json();
  const spreadsheetId = newSheet.spreadsheetId;

  // Move the spreadsheet into the ADocar folder
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (err) {
    console.warn('Avviso spostamento file nella cartella:', err);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Synchronize all vehicle models and records into the Google Sheet in Drive
 */
export async function syncFleetToGoogle(
  accessToken: string,
  models: VehicleModel[]
): Promise<DriveSyncResult> {
  // 1. Ensure folder "ADocar" exists in Drive
  const { folderId, folderUrl } = await findOrCreateADocarFolder(accessToken);

  // 2. Ensure spreadsheet "ADOcar_manutenzione_Auto_Moto" exists in "ADocar"
  const { spreadsheetId, spreadsheetUrl } = await findOrCreateSpreadsheet(accessToken, folderId);

  // 3. Fetch current sheets metadata to check existing tabs
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Impossibile leggere i fogli di calcolo: ${errText}`);
  }

  const metaData = await metaRes.json();
  const existingSheets: { sheetId: number; title: string }[] = (metaData.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));

  // 4. Create missing tabs for each model
  const requests: any[] = [];
  const modelSheetNames: string[] = [];

  for (const model of models) {
    const tabName = model.sheetTabName || model.name;
    modelSheetNames.push(tabName);
    const exists = existingSheets.some((s) => s.title.toLowerCase() === tabName.toLowerCase());

    if (!exists) {
      requests.push({
        addSheet: {
          properties: {
            title: tabName,
            gridProperties: {
              rowCount: 100,
              columnCount: 10,
            },
          },
        },
      });
    }
  }

  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  // 5. Populate each vehicle's sheet tab with exact layout
  for (const model of models) {
    const tabName = model.sheetTabName || model.name;

    const values: any[][] = [];

    // Row 1 & 2: MEZZO | TARGA
    values.push(['MEZZO', 'TARGA']);
    values.push([model.name, model.plate || '']);
    values.push([]); // Row 3

    // Row 4-7: Scadenze & Costi
    values.push(['', 'SCADENZA', 'COSTO']);
    values.push([
      'REVISIONE:',
      formatDisplayDate(model.deadlines?.revisione?.expiryDate),
      model.deadlines?.revisione?.cost || 0,
    ]);
    values.push([
      'ASSICURAZIONE:',
      formatDisplayDate(model.deadlines?.assicurazione?.expiryDate),
      model.deadlines?.assicurazione?.cost || 0,
    ]);
    values.push([
      'BOLLO:',
      formatDisplayDate(model.deadlines?.bollo?.expiryDate),
      model.deadlines?.bollo?.cost || 0,
    ]);
    values.push([]); // Row 8

    // Row 9: SCHEDA MANUTENZIONE
    values.push(['', '', '', 'SCHEDA MANUTENZIONE']);

    // Row 10: Headers
    values.push([
      'MANUTENZIONE EFFETTUATA',
      'PRESSO',
      'NOTE',
      'COSTO €',
      'DATA',
      'KM',
      'PROSSIMO INTERVENTO',
    ]);

    // Rows 11+: Maintenance rows
    (model.records || []).forEach((rec) => {
      values.push([
        rec.manutenzioneEffettuata || '',
        rec.presso || '',
        rec.note || '',
        rec.costo !== undefined && rec.costo !== null ? Number(rec.costo) : 0,
        formatDisplayDate(rec.data),
        rec.km !== undefined && rec.km !== null ? Number(rec.km) : '',
        formatDisplayDate(rec.prossimoIntervento),
      ]);
    });

    // Write values to tab
    const safeTabName = tabName.replace(/'/g, "''");
    const range = `'${safeTabName}'!A1:G${values.length}`;

    // Svuota la scheda prima di riscriverla: se hai eliminato interventi, non restano righe vecchie
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${safeTabName}'!A1:G2000`)}:clear`,
      { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}' }
    );
    if (!clearRes.ok) {
      throw new Error(`Impossibile aggiornare la scheda "${tabName}" del foglio: ${await clearRes.text()}`);
    }

    const putRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values,
        }),
      }
    );
    if (!putRes.ok) {
      throw new Error(`Impossibile scrivere la scheda "${tabName}" del foglio: ${await putRes.text()}`);
    }
  }

  return {
    success: true,
    folderId,
    folderUrl,
    spreadsheetId,
    spreadsheetUrl,
  };
}
