import { VehicleModel, MaintenanceRecord } from '../types';
import { findOrCreateADocarFolder, syncFleetToGoogle, DriveSyncResult } from './driveSheetsService';

/**
 * Sincronizzazione nei DUE sensi tra i dispositivi.
 *
 * - I dati completi vengono salvati in un file di archivio "adocar_dati.json" nella cartella ADocar di Drive.
 * - Ogni sincronizzazione: scarica l'archivio, UNISCE i dati con quelli del dispositivo
 *   (per ID, vince la modifica più recente), rimanda l'archivio aggiornato e riscrive il foglio Google.
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
}

export interface BidirectionalSyncResult extends DriveSyncResult {
  models: VehicleModel[];
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
  const merged = mergeModels(localModels, remote?.models || [], tomb);
  saveTombstones(tomb);

  await writeArchive(token, folderId, archiveId, {
    version: 1,
    updatedAt: new Date().toISOString(),
    models: merged,
    deleted: tomb,
  });

  const sheet = await syncFleetToGoogle(token, merged);
  return { ...sheet, models: merged };
}
