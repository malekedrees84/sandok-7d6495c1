import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { validateAttachments, matchesFileSignature } from './validation.ts';

const schema = z.object({
  applicant_name: z.string().trim().min(3).max(150),
  phone: z.string().trim().regex(/^[+\d\s()-]{7,25}$/),
  address: z.string().trim().min(2).max(300),
  category: z.enum(['education', 'medical', 'emergency', 'other']),
  requested_amount: z.coerce.number().finite().positive().max(1000000),
  reason: z.string().trim().min(10).max(4000),
});
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return respond({ error: 'خدمة الطلبات غير متاحة حالياً' }, 503);
  const client = createClient(url, key, { auth: { persistSession: false } });
  const uploaded: string[] = [];
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const attempt_key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed, error: limitError } = await client.rpc('consume_grant_submission', { attempt_key });
    if (limitError) throw limitError;
    if (!allowed) return respond({ error: 'طلبات كثيرة، يرجى المحاولة بعد ساعة' }, 429);
    if (Number(req.headers.get('content-length')) > 52 * 1024 * 1024) return respond({ error: 'المرفقات أكبر من الحجم المسموح' }, 413);
    const form = await req.formData();
    const parsed = schema.safeParse(Object.fromEntries(['applicant_name','phone','address','category','requested_amount','reason'].map(name => [name, form.get(name)])));
    if (!parsed.success) return respond({ error: 'تأكد من الاسم والهاتف والعنوان والمبلغ وسبب الطلب (10 أحرف على الأقل)' }, 400);
    const values = form.getAll('files');
    if (values.some(value => !(value instanceof File))) return respond({ error: 'المرفقات غير صالحة' }, 400);
    const files = values.filter((value): value is File => value instanceof File);
    const invalid = validateAttachments(files);
    if (invalid) return respond({ error: invalid }, 400);
    const id = crypto.randomUUID();
    const attachments = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!matchesFileSignature(bytes, file.type)) {
        if (uploaded.length) await client.storage.from('grant-attachments').remove(uploaded);
        return respond({ error: 'محتوى أحد الملفات لا يطابق نوعه' }, 400);
      }
      const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
      const path = `${id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await client.storage.from('grant-attachments').upload(path, bytes, { contentType: file.type, upsert: false });
      if (error) throw error;
      uploaded.push(path);
      attachments.push({ name: file.name.slice(0, 200), path, size: file.size, type: file.type });
    }
    const { error } = await client.from('grant_applications').insert({ id, ...parsed.data, attachments });
    if (error) throw error;
    return respond({ id }, 201);
  } catch {
    if (uploaded.length) await client.storage.from('grant-attachments').remove(uploaded);
    return respond({ error: 'لم يتم حفظ الطلب، يرجى إعادة المحاولة' }, 503);
  }
});