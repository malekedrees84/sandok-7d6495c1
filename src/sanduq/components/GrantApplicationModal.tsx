import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, Paperclip, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { grantCategories, grantSchema, submitGrant, validateAttachments, GrantInput } from '../services/grants';

export function GrantApplicationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = grantSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'تأكد من البيانات'); return; }
    const invalid = validateAttachments(files);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError('');
    try { setReceipt(await submitGrant(parsed.data, files)); setFiles([]); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر إرسال الطلب'); }
    finally { setBusy(false); }
  };
  const close = () => { if (!busy) { onClose(); setReceipt(''); setError(''); setFiles([]); } };
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) close(); }}>
    <DialogContent dir="rtl" aria-describedby={undefined} className="w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-lg bg-card p-5 sm:p-6">
      <DialogTitle className="flex items-center gap-2 pr-5 text-right tracking-normal"><FileText className="text-primary" /> طلب منحة من الصندوق</DialogTitle>
      {receipt ? <div className="space-y-5 py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h3 className="text-xl font-bold">تم استلام طلبك</h3>
        <p className="text-muted-foreground">رقم الطلب</p><p className="break-all rounded-lg border border-border bg-secondary p-3 font-mono text-sm" dir="ltr">{receipt}</p>
        <Button onClick={close}>إغلاق</Button>
      </div> : <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">الاسم الكامل *<Input name="applicant_name" required minLength={3} maxLength={150} disabled={busy} /></label>
          <label className="space-y-2 text-sm font-medium">رقم الهاتف *<Input name="phone" type="tel" required maxLength={25} dir="ltr" disabled={busy} /></label>
        </div>
        <label className="block space-y-2 text-sm font-medium">العنوان *<Input name="address" required minLength={2} maxLength={300} disabled={busy} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">نوع المنحة *<select name="category" disabled={busy} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(grantCategories).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label className="space-y-2 text-sm font-medium">المبلغ المطلوب (₪) *<Input name="requested_amount" type="number" min="0.01" max="1000000" step="0.01" required disabled={busy} /></label>
        </div>
        <label className="block space-y-2 text-sm font-medium">سبب الطلب وتفاصيل الحاجة *<Textarea name="reason" required minLength={10} maxLength={4000} rows={4} disabled={busy} /></label>
        <section className="space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-sm">المستندات المرفقة</h3><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}><Paperclip /> إرفاق ملفات</Button></div>
          <p className="text-xs text-muted-foreground">PDF، JPG، PNG · حتى 5 ملفات · 10 ميغابايت لكل ملف</p>
          <input ref={input} type="file" aria-label="المستندات المرفقة" multiple accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={event => {
            const next = [...files, ...Array.from(event.target.files || [])];
            const invalid = validateAttachments(next); if (invalid) setError(invalid); else { setFiles(next); setError(''); }
            event.target.value = '';
          }} />
          {files.map((file, i) => <div key={`${file.name}-${i}`} className="flex min-w-0 items-center gap-2 rounded-md border border-border p-2 text-sm"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 break-all">{file.name}</span><Button type="button" variant="ghost" size="icon" aria-label={`إزالة ${file.name}`} disabled={busy} onClick={() => setFiles(files.filter((_, index) => i !== index))}><Trash2 /></Button></div>)}
        </section>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full"><Send />{busy ? 'جاري حفظ الطلب والمرفقات...' : 'إرسال الطلب'}</Button>
      </form>}
    </DialogContent>
  </Dialog>;
}