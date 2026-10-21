import { supabase } from '@/integrations/supabase/client';

export type StaffRole = 'admin' | 'moderator';

export function selectStaffRole(roles: string[]): StaffRole | null {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('moderator')) return 'moderator';
  return null;
}

export async function getStaffRole(): Promise<StaffRole | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (roleError) return null;
  return selectStaffRole((data || []).map(row => row.role));
}

export async function signInStaff(username: string, password: string): Promise<StaffRole> {
  const { data, error } = await supabase.functions.invoke('master-login', { body: { username, password } });
  if (error || !data?.session) {
    let message = 'بيانات الدخول غير صحيحة أو الخدمة غير متاحة';
    if (error?.context instanceof Response) {
      const result = await error.context.json().catch(() => null);
      if (typeof result?.error === 'string') message = result.error;
    }
    throw new Error(message);
  }
  const { error: sessionError } = await supabase.auth.setSession(data.session);
  if (sessionError) throw new Error('تعذر تسجيل الدخول');
  const role = await getStaffRole();
  if (!role) {
    await supabase.auth.signOut();
    throw new Error('لا توجد صلاحية لهذا الحساب');
  }
  return role;
}