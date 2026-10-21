import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
export { validateAttachments } from '../../../supabase/functions/submit-grant/validation';

export const grantSchema = z.object({
  applicant_name: z.string().trim().min(3, 'أدخل الاسم الكامل').max(150),
  phone: z.string().trim().regex(/^[+\d\s()-]{7,25}$/, 'أدخل رقم هاتف صحيح'),
  address: z.string().trim().min(2, 'أدخل العنوان').max(300),
  category: z.enum(['education', 'medical', 'emergency', 'other']),
  requested_amount: z.coerce.number().finite().positive('أدخل مبلغاً أكبر من صفر').max(1000000),
  reason: z.string().trim().min(10, 'اكتب سبب الطلب (10 أحرف على الأقل)').max(4000),
});
export type GrantInput = z.infer<typeof grantSchema>;
export type GrantStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';
export const grantCategories = { education: 'تعليم', medical: 'علاج', emergency: 'حالة طارئة', other: 'أخرى' };
export const grantStatuses: Record<GrantStatus, string> = { pending: 'جديد', reviewing: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' };
export interface GrantAttachment { name: string; path: string; size: number; type: string }
export interface GrantApplication extends GrantInput {
  id: string; attachments: GrantAttachment[]; status: GrantStatus; review_notes: string;
  created_at: string; reviewed_at: string | null;
}
export async function submitGrant(input: GrantInput, files: File[]): Promise<string> {
  const form = new FormData();
  Object.entries(grantSchema.parse(input)).forEach(([key, value]) => form.append(key, String(value)));
  files.forEach(file => form.append('files', file));
  const { data, error } = await supabase.functions.invoke('submit-grant', { body: form });
  if (error || !data?.id) {
    let message = 'لم يتم حفظ الطلب، يرجى إعادة المحاولة';
    if (error?.context instanceof Response) {
      const body = await error.context.json().catch(() => null);
      if (typeof body?.error === 'string') message = body.error;
    }
    throw new Error(message);
  }
  return data.id;
}
export async function getGrants(): Promise<GrantApplication[]> {
  const { data, error } = await supabase.from('grant_applications').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('تعذر تحميل الطلبات');
  return (data ?? []).map(row => ({ ...row, attachments: row.attachments as unknown as GrantAttachment[], category: row.category as GrantInput['category'], status: row.status as GrantStatus }));
}
export async function reviewGrant(id: string, status: GrantStatus, review_notes: string): Promise<GrantApplication> {
  const { data, error } = await supabase.from('grant_applications').update({ status, review_notes }).eq('id', id).select('*').single();
  if (error) throw new Error('لم يتم حفظ القرار، تأكد من صلاحيتك وأعد المحاولة');
  return { ...data, attachments: data.attachments as unknown as GrantAttachment[], category: data.category as GrantInput['category'], status: data.status as GrantStatus };
}
export async function attachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('grant-attachments').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error('تعذر فتح المرفق');
  return data.signedUrl;
}