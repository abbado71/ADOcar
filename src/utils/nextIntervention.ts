/**
 * "Prossimo intervento": può essere una DATA, dei CHILOMETRI, oppure entrambi.
 *
 * Nel record resta una semplice stringa (campo `prossimoIntervento`), così il
 * foglio Google / Excel rimane compatibile. Il valore salvato è già nella forma
 * leggibile che finisce nel foglio:
 *   - solo data  → "04/10/2027"
 *   - solo km    → "80.000 km"
 *   - entrambi   → "04/10/2027 o 80.000 km"
 *
 * Il parser accetta anche i vecchi valori (data ISO "2027-10-04", numeri di
 * serie di Excel, "80000", "80.000 km", ecc.).
 */

export interface NextIntervention {
  /** Data in formato YYYY-MM-DD ('' se assente) */
  date: string;
  /** Chilometri (null se assenti) */
  km: number | null;
}

// Numeri di serie Excel/Sheets tra anno 2000 e 2100: li consideriamo date.
const SERIAL_MIN = 36526;
const SERIAL_MAX = 73415;

const pad = (n: number | string) => String(n).padStart(2, '0');

function isValidDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function serialToISO(serial: number): string {
  return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().split('T')[0];
}

/** 80000 -> "80.000" (punti per le migliaia, sempre, indipendentemente dal browser) */
export function formatKm(km: number): string {
  return String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDateIT(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Legge un valore (stringa o numero) e lo scompone in data e/o km. */
export function parseNextIntervention(raw: unknown): NextIntervention {
  const empty: NextIntervention = { date: '', km: null };
  if (raw === undefined || raw === null || raw === '') return empty;

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return empty;
    return raw >= SERIAL_MIN && raw <= SERIAL_MAX
      ? { date: serialToISO(raw), km: null }
      : { date: '', km: Math.round(raw) };
  }

  let s = String(raw).trim();
  if (!s) return empty;

  let date = '';

  // YYYY-MM-DD
  const iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (anche anno a 2 cifre)
  const it = /(?<!\d)(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/.exec(s);

  if (iso && isValidDate(+iso[1], +iso[2], +iso[3])) {
    date = `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
    s = s.replace(iso[0], ' ');
  } else if (it) {
    const year = it[3].length === 2 ? 2000 + +it[3] : +it[3];
    if (isValidDate(year, +it[2], +it[1])) {
      date = `${year}-${pad(it[2])}-${pad(it[1])}`;
      s = s.replace(it[0], ' ');
    }
  }

  // Km: ciò che resta dopo aver tolto la data ("80.000 km", "80000", "80 000 km")
  let km: number | null = null;
  const kmMatch = /(\d[\d.,'\s]*)\s*(?:km|kms|chilometri)?/i.exec(s);
  if (kmMatch) {
    const digits = kmMatch[1].replace(/\D/g, '');
    if (digits) km = parseInt(digits, 10);
  }

  // Nulla di riconoscibile (es. testo libero): lo trattiamo come vuoto
  if (!date && (km === null || km <= 0)) return empty;
  return { date, km: km !== null && km > 0 ? km : null };
}

/** Costruisce la stringa da salvare (e da scrivere nel foglio). */
export function buildNextIntervention(date?: string, km?: number | string | null): string {
  const parts: string[] = [];
  if (date) parts.push(formatDateIT(date));
  const kmNum = typeof km === 'string' ? parseInt(km.replace(/\D/g, ''), 10) : km;
  if (kmNum && kmNum > 0) parts.push(`${formatKm(kmNum)} km`);
  return parts.join(' o ');
}

/** Testo formattato in italiano per qualsiasi valore (vecchio o nuovo). */
export function formatNextIntervention(raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return '';
  const { date, km } = parseNextIntervention(raw);
  // Testo libero non riconosciuto: lo lasciamo com'è per non perdere dati nel foglio
  return buildNextIntervention(date, km) || String(raw).trim();
}

/**
 * Normalizza il contenuto di una cella del foglio / Excel
 * (può arrivare come numero di serie data, testo, "80.000 km"...).
 */
export function normalizeNextInterventionCell(cell: unknown): string {
  if (cell === undefined || cell === null || cell === '') return '';
  const parsed = parseNextIntervention(cell);
  const out = buildNextIntervention(parsed.date, parsed.km);
  // Testo non riconosciuto: lo conserviamo così com'è per non perdere dati
  return out || String(cell).trim();
}
