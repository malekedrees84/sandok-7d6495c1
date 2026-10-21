import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const bodySchema = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(256) });
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'بيانات الدخول غير صحيحة' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond({ error: 'خدمة الدخول غير متاحة' }, 503);
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const attemptKey = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed, error: rateError } = await client.rpc('consume_login_attempt', { attempt_key: attemptKey });
    if (rateError) return respond({ error: 'خدمة الدخول غير متاحة' }, 503);
    if (!allowed) return respond({ error: 'محاولات كثيرة، حاول بعد 15 دقيقة' }, 429);
    const { username, password } = parsed.data;
    const role = username === 'admin' ? 'admin' : username === 'edrees' ? 'moderator' : null;
    const expected = role === 'admin' ? Deno.env.get('SANDUQ_MASTER_PASSWORD') : role === 'moderator' ? Deno.env.get('SANDUQ_MODERATOR_PASSWORD') : undefined;
    if (!role || !expected) return respond({ error: 'بيانات الدخول غير صحيحة' }, 401);
    const [submittedHash, expectedHash] = await Promise.all([password, expected].map(value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
    const a = new Uint8Array(submittedHash), b = new Uint8Array(expectedHash);
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
    if (mismatch !== 0) return respond({ error: 'بيانات الدخول غير صحيحة' }, 401);
    let userId = '3259aaae-035e-47be-a06a-d62c20b441e6';
    if (role === 'moderator') {
      const { data: users, error } = await client.auth.admin.listUsers();
      if (error) throw error;
      const existing = users.users.find(user => user.email === 'edrees@sandok.local');
      if (existing) userId = existing.id;
      else {
        const { data: created, error: createError } = await client.auth.admin.createUser({ email: 'edrees@sandok.local', password: crypto.randomUUID(), email_confirm: true });
        if (createError || !created.user) throw createError || new Error('Account unavailable');
        userId = created.user.id;
        const { error: roleError } = await client.from('user_roles').insert({ user_id: userId, role: 'moderator' });
        if (roleError) throw roleError;
      }
    }
    const { data: permission, error: permissionError } = await client.rpc('has_role', { _user_id: userId, _role: role });
    if (permissionError || !permission) return respond({ error: 'لا توجد صلاحية لهذا الحساب' }, 403);
    const { data: account, error: accountError } = await client.auth.admin.getUserById(userId);
    if (accountError || !account.user.email) throw accountError || new Error('Account unavailable');
    const { data: link, error: linkError } = await client.auth.admin.generateLink({ type: 'magiclink', email: account.user.email });
    if (linkError) throw linkError;
    const { data: verified, error: verifyError } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
    if (verifyError || !verified.session) throw verifyError || new Error('Session unavailable');
    return respond({ session: verified.session });
  } catch {
    return respond({ error: 'تعذر تسجيل الدخول، أعد المحاولة' }, 503);
  }
});