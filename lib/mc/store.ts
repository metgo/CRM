/**
 * Client-side data layer for the metgo-crm module.
 *
 * Ported from metgo-crm/src/lib/store.ts — the Supabase client and the
 * localStorage "local mode" are replaced by fetch() against /api/mc/*, which is
 * backed by TypeORM (see lib/mc/server/*). The in-memory cache + subscribe/emit
 * design is unchanged, so every ported page/component works as before.
 */

export type Rec = Record<string, any>;

export const COLLECTIONS = [
  "users", "clients", "clusters", "contacts", "deals", "tenders", "quotes", "contracts",
  "payments", "campaigns", "batches", "merchants", "redemptions", "partners",
  "interactions", "tasks", "events", "automations", "settings"
] as const;
export type CollName = (typeof COLLECTIONS)[number];

const API = "/api/mc";

/* ------------------------------------------------------------------ keys */
export const recToBody = (r: Rec): Rec => {
  const out: Rec = {};
  for (const k of Object.keys(r)) {
    if (k === "id" || k === "createdAt" || k === "updatedAt" || r[k] === undefined) continue;
    out[k] = r[k] === "" ? null : r[k];
  }
  return out;
};

/* ------------------------------------------------------------------ cache */
const cache: Record<string, Rec[]> = {};
COLLECTIONS.forEach((c) => (cache[c] = []));

const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((fn) => fn());
};

export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getVersion = () => version;
export const rows = (c: CollName): Rec[] => cache[c] || [];
export const getRec = (c: CollName, id?: string | null): Rec | undefined =>
  id ? rows(c).find((r) => r.id === id) : undefined;

export type Settings = {
  vat: number; targetYear: number;
  slaLead: number; slaMeeting: number; slaQuote: number; slaVerbal: number; slaPo: number;
  gapOk: number; gapWarn: number; debtAfter: number; docHours: number;
};
export const DEFAULT_SETTINGS: Settings = {
  vat: 18, targetYear: 2900000,
  slaLead: 7, slaMeeting: 14, slaQuote: 21, slaVerbal: 14, slaPo: 30,
  gapOk: 14, gapWarn: 30, debtAfter: 3, docHours: 24
};
export const getSettings = (): Settings => {
  const raw = (getRec("settings", "main") || {}) as Rec;
  const num: Rec = {};
  for (const k of Object.keys(raw)) {
    const n = Number(raw[k]);
    num[k] = Number.isFinite(n) && raw[k] !== null && raw[k] !== "" ? n : raw[k];
  }
  return { ...DEFAULT_SETTINGS, ...num } as Settings;
};

/* ------------------------------------------------------------------- http */
async function req(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------------------------------------------- api */
export async function loadAll(): Promise<void> {
  await Promise.all(
    COLLECTIONS.map(async (c) => {
      try {
        cache[c] = ((await req(`/${c}`)) as Rec[]) || [];
      } catch (e) {
        console.warn(`load ${c}:`, (e as Error).message);
      }
    })
  );
  emit();
}

export async function reload(c: CollName): Promise<void> {
  try {
    cache[c] = ((await req(`/${c}`)) as Rec[]) || [];
    emit();
  } catch (e) {
    console.warn(`reload ${c}:`, (e as Error).message);
  }
}

/** Insert or update one record. Returns the stored record. */
export async function save(c: CollName, id: string | null, body: Rec): Promise<Rec> {
  const payload = recToBody(body);
  const rec: Rec = id
    ? await req(`/${c}/${id}`, { method: "PUT", body: JSON.stringify(payload) })
    : await req(`/${c}`, { method: "POST", body: JSON.stringify(payload) });
  const arr = cache[c];
  const i = arr.findIndex((r) => r.id === rec.id);
  if (i >= 0) arr[i] = rec;
  else arr.push(rec);
  emit();
  return rec;
}

export async function remove(c: CollName, id: string): Promise<void> {
  const prev = cache[c];
  cache[c] = prev.filter((r) => r.id !== id);
  emit();
  try {
    await req(`/${c}/${id}`, { method: "DELETE" });
  } catch (e) {
    cache[c] = prev;
    await reload(c);
    throw new Error((e as Error).message);
  }
}

/** Replaces Supabase realtime: poll every 20s so other users' changes show up. */
export function startRealtime(): () => void {
  const timer = setInterval(() => {
    void loadAll();
  }, 20000);
  return () => clearInterval(timer);
}
