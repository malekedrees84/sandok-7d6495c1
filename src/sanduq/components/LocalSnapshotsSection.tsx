import React, { useEffect, useState } from 'react';
import { History, Loader2, RotateCcw, Trash2, Plus } from 'lucide-react';
import { createSnapshot, deleteSnapshot, listSnapshots, restoreSnapshot, Snapshot } from '../services/localSnapshots';

export const LocalSnapshotsSection: React.FC<{ onRestored: () => void }> = ({ onRestored }) => {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => setSnaps(await listSnapshots());
  useEffect(() => { refresh(); }, []);

  const fmt = (iso: string) => new Date(iso).toLocaleString('ar', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const handleCreate = async () => {
    setBusy('new');
    try { await createSnapshot('يدوي'); await refresh(); } catch (e: any) { alert('تعذر حفظ النسخة: ' + (e?.message || e)); }
    setBusy(null);
  };

  const handleRestore = async (s: Snapshot) => {
    if (!window.confirm(`استرجاع البيانات كما كانت بتاريخ ${fmt(s.createdAt)}؟\nسيتم استبدال البيانات الحالية (يتم حفظ نسخة من الوضع الحالي قبل ذلك).`)) return;
    setBusy(s.id);
    try { await restoreSnapshot(s); alert('تم الاسترجاع بنجاح ✅'); await refresh(); onRestored(); }
    catch (e: any) { alert('فشل الاسترجاع: ' + (e?.message || e)); }
    setBusy(null);
  };

  const handleDelete = async (s: Snapshot) => {
    if (!window.confirm('حذف هذه النسخة؟')) return;
    await deleteSnapshot(s.id); refresh();
  };

  return (
    <section className="bg-muted border border-border p-4 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-foreground"><History size={18} /> نسخ محلية حسب التاريخ</h3>
        <button onClick={handleCreate} disabled={!!busy} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
          {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} نسخة الآن
        </button>
      </div>
      <p className="text-xs text-muted-foreground">تُحفظ نسخة تلقائياً على هذا الجهاز كل 6 ساعات (آخر 60 نسخة).</p>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {snaps.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">لا توجد نسخ بعد</p>}
        {snaps.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-2 bg-card border border-border rounded-lg p-2">
            <div className="text-xs">
              <div className="font-bold text-foreground">{fmt(s.createdAt)} <span className="text-muted-foreground font-normal">({s.reason})</span></div>
              <div className="text-muted-foreground">{s.counts.members} عضو · {s.counts.payments} دفعة</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleRestore(s)} disabled={!!busy} title="استرجاع" className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50">
                {busy === s.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              </button>
              <button onClick={() => handleDelete(s)} disabled={!!busy} title="حذف" className="p-1.5 rounded-md hover:bg-accent text-destructive disabled:opacity-50"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
