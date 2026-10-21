import React, { useEffect, useState } from 'react';
import { Check, FileText, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { attachmentUrl, getGrants, grantCategories, grantStatuses, reviewGrant, GrantApplication, GrantStatus } from '../services/grants';
import { formatCurrency } from '../utils';

export function GrantReviewModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [requests, setRequests] = useState<GrantApplication[]>([]);
  const [selected, setSelected] = useState<GrantApplication | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const load = async () => {
    setBusy(true); setError('');
    try { setRequests(await getGrants()); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل الطلبات'); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (isOpen) { setSelected(null); void load(); } else setRequests([]); }, [isOpen]);
  const decide = async (status: GrantStatus) => {
    if (!selected) return;
    setBusy(true); setError(''); setSaved(false);
    try { const updated = await reviewGrant(selected.id, status, notes); setSelected(updated); setRequests(prev => prev.map(r => r.id === updated.id ? updated : r)); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر حفظ القرار'); }
    finally { setBusy(false); }
  };
  const openFile = async (path: string) => {
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    try { const url = await attachmentUrl(path); if (popup) popup.location.href = url; else setError('اسمح بفتح نافذة المرفق ثم حاول مجدداً'); }
    catch (e) { popup?.close(); setError(e instanceof Error ? e.message : 'تعذر فتح المرفق'); }
  };
  const filtered = requests.filter(r => (filter === 'all' || r.status === filter) && `${r.applicant_name} ${r.phone} ${r.id}`.includes(query));
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}><DialogContent dir="rtl" aria-describedby={undefined} className="w-[calc(100%-2rem)] max-w-4xl max-h-[90dvh] overflow-y-auto rounded-lg bg-card p-5 sm:p-6">
    <DialogTitle className="pr-5 text-right tracking-normal">مراجعة طلبات المنح</DialogTitle>
    <div className="flex flex-wrap items-center gap-2"><div className="relative min-w-0 flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="بحث في طلبات المنح" placeholder="الاسم، الهاتف أو رقم الطلب" value={query} onChange={e => setQuery(e.target.value)} className="pr-9" /></div><select aria-label="حالة الطلب" value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm"><option value="all">كل الحالات</option>{Object.entries(grantStatuses).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select><Button variant="outline" size="icon" title="تحديث الطلبات" aria-label="تحديث الطلبات" disabled={busy} onClick={load}><RefreshCw /></Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid min-h-60 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <div className="space-y-2 md:max-h-[60dvh] md:overflow-y-auto">
        <p className="text-xs text-muted-foreground">{filtered.length} طلب</p>
        {busy && !requests.length ? <p role="status">جاري تحميل الطلبات...</p> : !filtered.length ? <p className="py-8 text-center text-muted-foreground">لا توجد طلبات</p> : filtered.map(r => <Button key={r.id} variant="outline" onClick={() => { setSelected(r); setNotes(r.review_notes); setSaved(false); }} className={`h-auto w-full flex-col items-stretch gap-2 whitespace-normal p-3 text-right ${selected?.id === r.id ? 'border-primary bg-primary/5' : ''}`}><span className="flex items-start justify-between gap-2"><span className="break-words font-bold">{r.applicant_name}</span><span className="shrink-0 text-xs text-primary">{grantStatuses[r.status]}</span></span><span className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{new Date(r.created_at).toLocaleDateString('ar')}</span><span>{formatCurrency(r.requested_amount)}</span></span></Button>)}
      </div>
      {selected ? <section className="min-w-0 space-y-4 border-t border-border pt-4 md:border-t-0 md:border-r md:pr-5 md:pt-0">
        <div><h3 className="text-lg font-bold break-words">{selected.applicant_name}</h3><p className="mt-1 text-xs text-muted-foreground break-all">رقم الطلب: {selected.id}</p></div>
        <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">الهاتف</dt><dd dir="ltr" className="text-right">{selected.phone}</dd></div><div><dt className="text-muted-foreground">المبلغ المطلوب</dt><dd className="font-bold">{formatCurrency(selected.requested_amount)}</dd></div><div><dt className="text-muted-foreground">نوع المنحة</dt><dd>{grantCategories[selected.category]}</dd></div><div><dt className="text-muted-foreground">تاريخ التسجيل</dt><dd>{new Date(selected.created_at).toLocaleString('ar')}</dd></div><div className="col-span-2"><dt className="text-muted-foreground">العنوان</dt><dd className="break-words">{selected.address}</dd></div></dl>
        <div><h4 className="mb-2 text-sm font-bold">سبب الطلب</h4><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{selected.reason}</p></div>
        <div className="space-y-2"><h4 className="text-sm font-bold">المرفقات ({selected.attachments.length})</h4>{selected.attachments.map(a => <Button key={a.path} variant="outline" className="h-auto max-w-full whitespace-normal" onClick={() => openFile(a.path)}><FileText /><span className="break-all">{a.name}</span></Button>)}</div>
        <label className="block space-y-2 text-sm font-bold">ملاحظات الإدارة<Textarea value={notes} onChange={e => { setNotes(e.target.value); setSaved(false); }} maxLength={4000} disabled={busy} /></label>
        <p className="text-sm">الحالة: <strong>{grantStatuses[selected.status]}</strong></p>
        {selected.reviewed_at && <p className="text-xs text-muted-foreground">آخر مراجعة: {new Date(selected.reviewed_at).toLocaleString('ar')}</p>}
        <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => decide('approved')}><Check />قبول</Button><Button disabled={busy} variant="destructive" onClick={() => decide('rejected')}><X />رفض</Button><Button disabled={busy} variant="outline" onClick={() => decide('reviewing')}>قيد المراجعة</Button><Button disabled={busy} variant="secondary" onClick={() => decide(selected.status)}>حفظ الملاحظات</Button></div>
        {saved && <p role="status" className="text-sm text-primary">تم حفظ القرار والملاحظات</p>}
      </section> : <div className="flex items-center justify-center text-muted-foreground text-sm">لم يتم اختيار طلب</div>}
    </div>
  </DialogContent></Dialog>;
}