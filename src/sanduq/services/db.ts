import { supabase } from '@/integrations/supabase/client';
import { Member, PaymentTransaction, Expense, AuditLog, VisitorLog, Announcement } from '../types';

// Helper to convert DB row to Member
const toMember = (row: any): Member => ({
  id: row.id,
  name: row.name,
  phone: row.phone || '',
  joinDate: row.join_date,
  paidUntil: row.paid_until,
  totalPaid: Number(row.total_paid),
  lastReminderDate: row.last_reminder_date || undefined,
  status: row.status as 'active' | 'inactive',
  profileImage: row.profile_image || undefined,
});

const toPayment = (row: any): PaymentTransaction => ({
  id: row.id,
  memberId: row.member_id,
  amount: Number(row.amount),
  date: row.date,
  monthsCovered: row.months_covered,
  previousPaidUntil: row.previous_paid_until || '',
  newPaidUntil: row.new_paid_until || '',
});

const toExpense = (row: any): Expense => ({
  id: row.id,
  title: row.title,
  category: row.category,
  amount: Number(row.amount),
  date: row.date,
  notes: row.notes || undefined,
});

const toAuditLog = (row: any): AuditLog => ({
  id: row.id,
  user: row.user,
  action: row.action,
  details: row.details,
  timestamp: row.timestamp,
});

const toVisitorLog = (row: any): VisitorLog => ({
  phone: row.phone,
  timestamp: row.timestamp,
});

const toAnnouncement = (row: any): Announcement => ({
  id: row.id,
  text: row.text || '',
  image: row.image || undefined,
  createdAt: row.created_at_text,
  active: row.active,
});

export const db = {
  // MEMBERS
  async getMembers(): Promise<Member[]> {
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: true });
    if (error) { console.error('getMembers error:', error); return []; }
    return (data || []).map(toMember);
  },
  async upsertMember(m: Member) {
    const { error } = await supabase.from('members').upsert({
      id: m.id, name: m.name, phone: m.phone, join_date: m.joinDate,
      paid_until: m.paidUntil, total_paid: m.totalPaid,
      last_reminder_date: m.lastReminderDate || null,
      status: m.status, profile_image: m.profileImage || null,
    });
    if (error) console.error('upsertMember error:', error);
  },
  async deleteMember(id: string) {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) console.error('deleteMember error:', error);
  },
  async deleteAllMembers() {
    const { error } = await supabase.from('members').delete().neq('id', '');
    if (error) console.error('deleteAllMembers error:', error);
  },

  // PAYMENTS
  async getPayments(): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getPayments error:', error); return []; }
    return (data || []).map(toPayment);
  },
  async insertPayment(p: PaymentTransaction) {
    const { error } = await supabase.from('payments').insert({
      id: p.id, member_id: p.memberId, amount: p.amount, date: p.date,
      months_covered: p.monthsCovered, previous_paid_until: p.previousPaidUntil,
      new_paid_until: p.newPaidUntil,
    });
    if (error) console.error('insertPayment error:', error);
  },
  async deletePayment(id: string) {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) console.error('deletePayment error:', error);
  },
  async deleteAllPayments() {
    const { error } = await supabase.from('payments').delete().neq('id', '');
    if (error) console.error('deleteAllPayments error:', error);
  },

  // EXPENSES
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getExpenses error:', error); return []; }
    return (data || []).map(toExpense);
  },
  async insertExpense(e: Omit<Expense, 'id'> & { id: string }) {
    const { error } = await supabase.from('expenses').insert({
      id: e.id, title: e.title, category: e.category, amount: e.amount,
      date: e.date, notes: e.notes || null,
    });
    if (error) console.error('insertExpense error:', error);
  },
  async updateExpense(e: Expense) {
    const { error } = await supabase.from('expenses').update({
      title: e.title, category: e.category, amount: e.amount,
      date: e.date, notes: e.notes || null,
    }).eq('id', e.id);
    if (error) console.error('updateExpense error:', error);
  },
  async deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) console.error('deleteExpense error:', error);
  },
  async deleteAllExpenses() {
    const { error } = await supabase.from('expenses').delete().neq('id', '');
    if (error) console.error('deleteAllExpenses error:', error);
  },

  // AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAuditLogs error:', error); return []; }
    return (data || []).map(toAuditLog);
  },
  async insertAuditLog(log: AuditLog) {
    const { error } = await supabase.from('audit_logs').insert({
      id: log.id, user: log.user, action: log.action, details: log.details, timestamp: log.timestamp,
    });
    if (error) console.error('insertAuditLog error:', error);
  },
  async deleteAllAuditLogs() {
    const { error } = await supabase.from('audit_logs').delete().neq('id', '');
    if (error) console.error('deleteAllAuditLogs error:', error);
  },

  // VISITOR LOGS
  async getVisitorLogs(): Promise<VisitorLog[]> {
    const { data, error } = await supabase.from('visitor_logs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getVisitorLogs error:', error); return []; }
    return (data || []).map(toVisitorLog);
  },
  async insertVisitorLog(log: VisitorLog) {
    const { error } = await supabase.from('visitor_logs').insert({
      phone: log.phone, timestamp: log.timestamp,
    });
    if (error) console.error('insertVisitorLog error:', error);
  },
  async deleteAllVisitorLogs() {
    const { error } = await supabase.from('visitor_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('deleteAllVisitorLogs error:', error);
  },

  // ANNOUNCEMENTS
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getAnnouncements error:', error); return []; }
    return (data || []).map(toAnnouncement);
  },
  async insertAnnouncement(a: Announcement) {
    const { error } = await supabase.from('announcements').insert({
      id: a.id, text: a.text, image: a.image || null, created_at_text: a.createdAt, active: a.active,
    });
    if (error) console.error('insertAnnouncement error:', error);
  },
  async deleteAnnouncement(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) console.error('deleteAnnouncement error:', error);
  },
  async deleteAllAnnouncements() {
    const { error } = await supabase.from('announcements').delete().neq('id', '');
    if (error) console.error('deleteAllAnnouncements error:', error);
  },
};
