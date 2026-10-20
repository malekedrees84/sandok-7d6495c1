import { supabase } from '@/integrations/supabase/client';

// Local (on-device) dated snapshots of the full database, stored in IndexedDB.
const DB_NAME = 'sanduq_snapshots';
const STORE = 'snapshots';
const MAX_SNAPSHOTS = 60;
const AUTO_INTERVAL_MS = 6 * 60 * 60 * 1000; // auto snapshot at most every 6 hours

const TABLES = ['members', 'payments', 'expenses', 'audit_logs', 'announcements', 'treasury_transactions'] as const;
type TableName = typeof TABLES[number];

export interface Snapshot {
  id: string;
  createdAt: string;
  reason: string;
  counts: Record<string, number>;
  data: Record<TableName, any[]>;
}

const openDB = () => new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const idb = await openDB();
  return new Promise<T>((resolve, reject) => {
    const r = fn(idb.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

const fetchAll = async (table: TableName) => {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
};

export const listSnapshots = async (): Promise<Snapshot[]> => {
  const all = await tx<Snapshot[]>('readonly', s => s.getAll() as IDBRequest<Snapshot[]>);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const deleteSnapshot = (id: string) => tx('readwrite', s => s.delete(id));

export const createSnapshot = async (reason = 'يدوي'): Promise<Snapshot> => {
  const data = {} as Record<TableName, any[]>;
  for (const t of TABLES) data[t] = await fetchAll(t);
  if (data.members.length === 0 && data.payments.length === 0) throw new Error('القاعدة فارغة أو غير متاحة - لم يتم حفظ النسخة');
  const counts: Record<string, number> = {};
  TABLES.forEach(t => (counts[t] = data[t].length));
  const snap: Snapshot = { id: Date.now().toString(), createdAt: new Date().toISOString(), reason, counts, data };
  await tx('readwrite', s => s.put(snap));
  const all = await listSnapshots();
  for (const old of all.slice(MAX_SNAPSHOTS)) await deleteSnapshot(old.id);
  return snap;
};

export const autoSnapshotIfDue = async () => {
  try {
    const all = await listSnapshots();
    const last = all[0];
    if (last && Date.now() - new Date(last.createdAt).getTime() < AUTO_INTERVAL_MS) return;
    await createSnapshot('تلقائي');
  } catch (e) { console.warn('auto snapshot skipped:', e); }
};

const check = (error: any) => { if (error) throw error; };

export const restoreSnapshot = async (snap: Snapshot) => {
  // Safety: snapshot the current state before overwriting
  try { await createSnapshot('قبل الاستعادة'); } catch { /* ignore if empty */ }
  const d = snap.data;
  check((await supabase.from('payments').delete().neq('id', '')).error);
  check((await supabase.from('treasury_transactions').delete().neq('id', '')).error);
  check((await supabase.from('expenses').delete().neq('id', '')).error);
  check((await supabase.from('audit_logs').delete().neq('id', '')).error);
  check((await supabase.from('announcements').delete().neq('id', '')).error);
  check((await supabase.from('members').update({ head_member_id: null }).neq('id', '')).error);
  check((await supabase.from('members').delete().neq('id', '')).error);

  const chunks = <T,>(arr: T[]) => { const out: T[][] = []; for (let i = 0; i < arr.length; i += 500) out.push(arr.slice(i, i + 500)); return out; };
  for (const c of chunks(d.members.map(m => ({ ...m, head_member_id: null })))) check((await supabase.from('members').insert(c)).error);
  for (const c of chunks(d.members.filter(m => m.head_member_id))) check((await supabase.from('members').upsert(c)).error);
  for (const t of ['payments', 'expenses', 'audit_logs', 'announcements', 'treasury_transactions'] as const) {
    for (const c of chunks(d[t] || [])) check((await supabase.from(t).insert(c)).error);
  }
};
