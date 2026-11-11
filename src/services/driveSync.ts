import { VehicleModel, MaintenanceRecord } from '../types';
import { findOrCreateADocarFolder, findOrCreateSpreadsheet, syncFleetToGoogle, DriveSyncResult } from './driveSheetsService';
import { parseDateToISO } from '../utils/excelExporter';
import { normalizeNextInterventionCell } from '../utils/nextIntervention';

/**
 * Sincronizzazione nei DUE sensi tra i dispositivi.
 *
 * - I dati completi vengono salvati in un file di archivio "adocar_dati.json" nella cartella ADocar di Drive.
 * - Ogni sincronizzazione: scarica l'archivio, UNISCE i dati con quelli del dispositivo
 *   (per ID, vince la modifica più recente), rimanda l'archivio aggiornato e riscrive il foglio Google.
 * - Prima di riscrivere il foglio, legge le RIGHE NUOVE scritte a mano nelle schede dei mezzi
 *   e le aggiunge come interventi (utile per migrare dati da altre app).
 * - Le cancellazioni sono registrate ("tombstones") così un elemento eliminato su un dispositivo
 *   non ricompare dall'altro.
 */

const ARCHIVE_NAME = 'adocar_dati.json';
const TOMB_KEY = 'adocar_tombstones_v1';

export interface Tombstones {
  models: Record<string, string>;
  records: Record<string, string>;
}

interface Archive {
  version: 1;
  updatedAt: string;
  models: VehicleModel[];
  deleted: Tombstones;
  /** Righe presenti nel foglio all'ultima scrittura: servono a riconoscere le righe NUOVE scritte a mano */
  sheetKeys?: string[];
}

export interface BidirectionalSyncResult extends DriveSyncResult {
  models: VehicleModel[];
  importedFromSheet: number;
}

const ts = (s?: string): number => (s ? Date.parse(s) || 0 : 0);

/* ---------- Cancellazioni (tombstones) ---------- */

export function loadTombstones(): Tombstones {
  try {
    const raw = localStorage.getItem(TOMB_KEY);
    if (!raw) return { models: {}, records: {} };
    const p = JSON.parse(raw);
    return { models: p?.models || {}, records: p?.records || {} };
  } catch {
    return { models: {}, records: {} };
  }
}

function saveTombstones(t: Tombstones) {
  try {
    localStorage.setItem(TOMB_KEY, JSON.stringify(t));
  } catch (e) {
    console.error('Errore salvataggio cancellazioni:', e);
  }
}

export function markModelDeleted(modelId: string) {
  const t = loadTombstones();
  t.models[modelId] = new Date().toISOString();
  saveTombstones(t);
}

export function markRecordDeleted(recordId: string) {
  const t = loadTombstones();
  t.records[recordId] = new Date().toISOString();
  saveTombstones(t);
}

function mergeTombstones(a: Tombstones, b?: Partial<Tombstones> | null): Tombstones {
  const out: Tombstones = { models: { ...a.models }, records: { ...a.records } };
  for (const kind of ['models', 'records'] as const) {
    const src = b?.[kind] || {};
    for (const id of Object.keys(src)) {
      if (!out[kind][id] || ts(src[id]) > ts(out[kind][id])) out[kind][id] = src[id];
    }
  }
  return out;
}

/* ---------- Unione dei dati ---------- */

const modelTs = (m: VehicleModel) => ts(m.updatedAt) || ts(m.createdAt);
const recTs = (r: MaintenanceRecord) => ts(r.updatedAt) || ts(r.createdAt);

function recordDateKey(r: MaintenanceRecord): number {
  const d = r.data || '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);
  const it = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(d);
  if (it) return Date.UTC(+it[3], +it[2] - 1, +it[1]);
  return ts(r.createdAt);
}

export function mergeModels(local: VehicleModel[], remote: VehicleModel[], tomb: Tombstones): VehicleModel[] {
  const L = new Map(local.map((m) => [m.id, m]));
  const R = new Map(remote.map((m) => [m.id, m]));
  const ids = [...L.keys(), ...[...R.keys()].filter((id) => !L.has(id))];
  const out: VehicleModel[] = [];

  for (const id of ids) {
    const l = L.get(id);
    const r = R.get(id);
    const base = l && r ? (modelTs(r) > modelTs(l) ? r : l) : (l || r)!;

    const del = tomb.models[id];
    if (del && ts(del) >= modelTs(base)) continue; // mezzo eliminato

    const recs = new Map<string, MaintenanceRecord>();
    for (const rec of [...(l?.records || []), ...(r?.records || [])]) {
      const ex = recs.get(rec.id);
      if (!ex || recTs(rec) > recTs(ex)) recs.set(rec.id, rec);
    }
    const records = [...recs.values()]
      .filter((rec) => {
        const d = tomb.records[rec.id];
        return !(d && ts(d) >= recTs(rec)); // intervento eliminato
      })
      .sort((a, b) => recordDateKey(b) - recordDateKey(a) || ts(b.createdAt) - ts(a.createdAt));

    out.push({ ...base, records });
  }
  return out;
}

/* ---------- Importazione di righe scritte a mano nel foglio ---------- */

function hashStr(str: string): string {
  // cyrb53: hash deterministico, così lo stesso rigo importato da dispositivi diversi ha lo stesso ID
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function toNumber(v: any): number {
  if (typeof v === 'number') return v;
  if (v === undefined || v === null) return 0;
  let s = String(v).replace(/[€\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // 75.000 -> 75000
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const norm = (v: any) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function baseKey(desc: any, presso: any, costo: number, data: string, km: number): string {
  return [norm(desc), norm(presso), costo.toFixed(2), data, Math.round(km)].join('|');
}

/** Chiavi "mezzo|intervento#n" di tutti gli interventi (n = n-esima occorrenza identica) */
function recordKeys(model: VehicleModel): Set<string> {
  const seen: Record<string, number> = {};
  const keys = new Set<string>();
  for (const r of model.records) {
    const b = baseKey(r.manutenzioneEffettuata, r.presso, Number(r.costo) || 0, parseDateToISO(r.data), Number(r.km) || 0);
    seen[b] = (seen[b] || 0) + 1;
    keys.add(`${model.id}|${b}#${seen[b]}`);
  }
  return keys;
}

export function snapshotKeys(models: VehicleModel[]): string[] {
  return models.flatMap((m) => [...recordKeys(m)]);
}

/**
 * Aggiunge ai mezzi le righe della scheda che l'app non conosce.
 * Una riga è "nuova" se non corrisponde a un intervento già presente
 * e non era già nel foglio all'ultima sincronizzazione (altrimenti è un intervento cancellato nell'app).
 */
export function importRowsIntoModels(
  models: VehicleModel[],
  tabRows: Record<string, any[][]>,
  previousSheetKeys: Set<string>,
  tomb: Tombstones
): { models: VehicleModel[]; imported: number } {
  let imported = 0;
  const out = models.map((model) => {
    const title = Object.keys(tabRows).find((t) => t.toLowerCase() === (model.sheetTabName || model.name).toLowerCase());
    if (!title) return model;
    const rows = tabRows[title] || [];
    const headerIdx = rows.findIndex((r) => norm(r?.[0]) === 'manutenzione effettuata');
    if (headerIdx < 0) return model;

    const existing = recordKeys(model);
    const seen: Record<string, number> = {};
    const added: MaintenanceRecord[] = [];
    const now = new Date().toISOString();

    for (const row of rows.slice(headerIdx + 1)) {
      if (!row || norm(row[0]) === '') continue; // serve almeno la descrizione dell'intervento
      const costo = toNumber(row[3]);
      const data = parseDateToISO(row[4]);
      const km = toNumber(row[5]);
      const b = baseKey(row[0], row[1], costo, data, km);
      seen[b] = (seen[b] || 0) + 1;
      const full = `${model.id}|${b}#${seen[b]}`;
      if (existing.has(full) || previousSheetKeys.has(full)) continue;

      const id = 'imp_' + hashStr(full);
      if (tomb.records[id]) continue;
      added.push({
        id,
        manutenzioneEffettuata: String(row[0]).trim(),
        presso: String(row[1] ?? '').trim(),
        note: String(row[2] ?? '').trim(),
        costo,
        data,
        km,
        prossimoIntervento: normalizeNextInterventionCell(row[6]),
        createdAt: now,
        updatedAt: now,
      });
      existing.add(full);
    }
    if (added.length === 0) return model;
    imported += added.length;
    return mergeModels([model], [{ ...model, records: added }], tomb)[0];
  });
  return { models: out, imported };
}

async function readSheetTabs(token: string, spreadsheetId: string, models: VehicleModel[]): Promise<Record<string, any[][]>> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Impossibile leggere il foglio Google: ${await metaRes.text()}`);
  const titles: string[] = ((await metaRes.json()).sheets || []).map((s: any) => s.properties.title);

  const wanted = models
    .map((m) => titles.find((t) => t.toLowerCase() === (m.sheetTabName || m.name).toLowerCase()))
    .filter((t): t is string => !!t);
  if (wanted.length === 0) return {};

  const params = wanted
    .map((t) => `ranges=${encodeURIComponent(`'${t.replace(/'/g, "''")}'!A1:G2000`)}`)
    .join('&');
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params}&valueRenderOption=UNFORMATTED_VALUE`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Impossibile leggere le schede del foglio Google: ${await res.text()}`);
  const data = await res.json();
  const out: Record<string, any[][]> = {};
  (data.valueRanges || []).forEach((vr: any, i: number) => {
    out[wanted[i]] = vr.values || [];
  });
  return out;
}

/* ---------- Archivio su Drive ---------- */

async function findArchiveId(token: string, folderId: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${ARCHIVE_NAME}' and '${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime%20desc&fields=files(id,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Errore ricerca archivio dati in Drive: ${await res.text()}`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function readArchive(token: string, fileId: string): Promise<Archive> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Errore lettura archivio dati da Drive: ${await res.text()}`);
  let parsed: any;
  try {
    parsed = await res.json();
  } catch {
    // Non sovrascriviamo un archivio che non riusciamo a leggere
    throw new Error('Archivio dati su Drive non leggibile: sincronizzazione annullata per non perdere dati.');
  }
  if (!parsed || !Array.isArray(parsed.models)) {
    throw new Error('Archivio dati su Drive con formato non valido: sincronizzazione annullata per non perdere dati.');
  }
  return parsed as Archive;
}

async function writeArchive(token: string, folderId: string, fileId: string | null, archive: Archive) {
  const json = JSON.stringify(archive);
  if (fileId) {
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: json,
    });
    if (!res.ok) throw new Error(`Errore salvataggio archivio dati su Drive: ${await res.text()}`);
    return;
  }
  const boundary = 'adocar_' + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: ARCHIVE_NAME, parents: [folderId], mimeType: 'application/json' });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${json}\r\n` +
    `--${boundary}--`;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Errore creazione archivio dati su Drive: ${await res.text()}`);
}

/**
 * Sincronizzazione completa: scarica da Drive, unisce con i dati locali,
 * salva l'archivio aggiornato e riscrive il foglio Google.
 */
export async function syncBothWays(token: string, localModels: VehicleModel[]): Promise<BidirectionalSyncResult> {
  const { folderId } = await findOrCreateADocarFolder(token);
  const archiveId = await findArchiveId(token, folderId);
  const remote = archiveId ? await readArchive(token, archiveId) : null;

  const tomb = mergeTombstones(loadTombstones(), remote?.deleted);
  let merged = mergeModels(localModels, remote?.models || [], tomb);
  saveTombstones(tomb);

  // Righe nuove scritte a mano nel foglio -> diventano interventi dell'app.
  // Se la lettura fallisce ci fermiamo: riscrivere il foglio cancellerebbe quelle righe.
  const { spreadsheetId } = await findOrCreateSpreadsheet(token, folderId);
  const tabs = await readSheetTabs(token, spreadsheetId, merged);
  const imp = importRowsIntoModels(merged, tabs, new Set(remote?.sheetKeys || []), tomb);
  merged = imp.models;

  await writeArchive(token, folderId, archiveId, {
    version: 1,
    updatedAt: new Date().toISOString(),
    models: merged,
    deleted: tomb,
    sheetKeys: snapshotKeys(merged),
  });

  const sheet = await syncFleetToGoogle(token, merged);
  return { ...sheet, models: merged, importedFromSheet: imp.imported };
}
