import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, User, DollarSign, Search, Plus, Wallet, TrendingUp, TrendingDown, Lock, Unlock, FileSpreadsheet, LayoutDashboard, Receipt, Sparkles, Settings, Share2, FileBarChart, Edit, X as XIcon, Eye, ShieldCheck, UserCheck, Bell, Printer, Camera, Menu, X, ChevronDown, ChevronRight, Vault, Pencil, Check } from 'lucide-react';
import { Member, PaymentTransaction, Expense, MONTHLY_FEE, START_DATE, AuditLog, VisitorLog, Announcement, TreasuryTransaction } from './types';
import { StatCard } from './components/StatCard';
import { PaymentModal } from './components/PaymentModal';
import { MemberHistoryModal } from './components/MemberHistoryModal';
import { ExpenseModal } from './components/ExpenseModal';
import { LoginModal } from './components/LoginModal';
import { WhatsAppImportModal } from './components/WhatsAppImportModal';
import { AIChatModal } from './components/AIChatModal';
import { SettingsModal } from './components/SettingsModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { EditMemberModal } from './components/EditMemberModal';
import { RemindersModal } from './components/RemindersModal';
import { SplashScreen } from './components/SplashScreen';
import { PublicInquiryModal } from './components/PublicInquiryModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { NewsTicker } from './components/NewsTicker';
import { ManageNewsModal } from './components/ManageNewsModal';
import { TreasuryModal } from './components/TreasuryModal';
import { FamilyAssignmentModal } from './components/FamilyAssignmentModal';
import { formatCurrency, formatDisplayDate, getMemberStatus, parseMonthStr, formatMonthStr, downloadCSV, compressImage, generatePDF } from './utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, addMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { db } from './services/db';

const STORAGE_KEYS = {
  SESSION_ROLE: 'sanduq_user_role',
  TICKER_DIRECTION: 'sanduq_ticker_direction', TICKER_SPEED: 'sanduq_ticker_speed'
};

export default function SanduqApp() {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [treasuryTx, setTreasuryTx] = useState<TreasuryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSplash, setShowSplash] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'expenses'>('dashboard');
  const [tickerDirection, setTickerDirection] = useState<'rtl' | 'ltr'>('ltr');
  const [tickerDuration, setTickerDuration] = useState<number>(25);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | null>(null);
  const isLoggedIn = userRole !== null;
  const isAdmin = userRole === 'admin';
  const canEdit = userRole === 'admin' || userRole === 'moderator';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'families' | 'members'>('families');
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set());
  const [familyNames, setFamilyNames] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('sanduq_family_names') || '{}'); } catch { return {}; }
  });
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState('');

  // Modals
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMemberHistory, setViewMemberHistory] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isPublicInquiryOpen, setIsPublicInquiryOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);
  const [isFamilyAssignOpen, setIsFamilyAssignOpen] = useState(false);
  const [isAddMemberMode, setIsAddMemberMode] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberJoinDate, setNewMemberJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMemberImage, setNewMemberImage] = useState<string | undefined>(undefined);
  const [newMemberHeadId, setNewMemberHeadId] = useState<string>('');

  // Network
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Load settings from localStorage (only UI prefs)
  useEffect(() => {
    const savedDir = localStorage.getItem(STORAGE_KEYS.TICKER_DIRECTION);
    if (savedDir === 'rtl') setTickerDirection('rtl');
    const savedSpeed = localStorage.getItem(STORAGE_KEYS.TICKER_SPEED);
    if (savedSpeed) setTickerDuration(Number(savedSpeed));
    const savedRole = localStorage.getItem(STORAGE_KEYS.SESSION_ROLE);
    if (savedRole === 'admin' || savedRole === 'moderator') setUserRole(savedRole as any);
  }, []);

  const handleSaveTickerSettings = (dir: 'rtl' | 'ltr', duration: number) => {
    setTickerDirection(dir); setTickerDuration(duration);
    localStorage.setItem(STORAGE_KEYS.TICKER_DIRECTION, dir);
    localStorage.setItem(STORAGE_KEYS.TICKER_SPEED, duration.toString());
  };

  // Load ALL data from Supabase
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [m, p, e, al, vl, an, tt] = await Promise.all([
        db.getMembers(), db.getPayments(), db.getExpenses(),
        db.getAuditLogs(), db.getVisitorLogs(), db.getAnnouncements(), db.getTreasuryTransactions(),
      ]);
      setMembers(m); setPayments(p); setExpenses(e);
      setAuditLogs(al); setVisitorLogs(vl); setAnnouncements(an); setTreasuryTx(tt);
    } catch (err) { console.error('Load error:', err); }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // Helper: run async DB op with saving indicator
  const withSaving = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    try { await fn(); } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const logAction = async (action: string, details: string) => {
    const user = userRole === 'admin' ? 'Admin' : (userRole === 'moderator' ? 'Edrees' : 'System');
    const log: AuditLog = { id: Date.now().toString(), user, action, details, timestamp: new Date().toISOString() };
    setAuditLogs(prev => [log, ...prev]);
    await db.insertAuditLog(log);
  };

  const handleUserLogin = (role: 'admin' | 'moderator') => { setUserRole(role); localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role); setIsLoginModalOpen(false); };
  const handleUserLogout = () => { if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) { setUserRole(null); localStorage.removeItem(STORAGE_KEYS.SESSION_ROLE); setIsAddMemberMode(false); } };

  const handleConfirmPayment = async (amount: number, newPaidUntil: string, treasuryHolder?: string) => {
    if (!selectedMember) return;
    await withSaving(async () => {
      const monthsCovered = Math.floor(amount / MONTHLY_FEE);
      const tx: PaymentTransaction = { id: Date.now().toString(), memberId: selectedMember.id, amount, date: new Date().toISOString().slice(0, 10), monthsCovered, previousPaidUntil: selectedMember.paidUntil, newPaidUntil };
      const updatedMember = { ...selectedMember, paidUntil: newPaidUntil, totalPaid: selectedMember.totalPaid + amount };
      
      await Promise.all([db.insertPayment(tx), db.upsertMember(updatedMember)]);
      setPayments(prev => [tx, ...prev]);
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? updatedMember : m));

      if (treasuryHolder && amount > 0) {
        const treasuryTxItem: TreasuryTransaction = {
          id: crypto.randomUUID(), holder: treasuryHolder, type: 'deposit',
          amount, description: `اشتراك ${selectedMember.name}`, date: new Date().toISOString().slice(0, 10),
        };
        await db.insertTreasuryTransaction(treasuryTxItem);
        setTreasuryTx(prev => [treasuryTxItem, ...prev]);
      }

      await logAction('إضافة دفعة', `استلام ${amount} من ${selectedMember.name}${treasuryHolder ? ` → خزينة ${treasuryHolder}` : ''}`);
    });
    setIsPaymentModalOpen(false); setSelectedMember(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    await withSaving(async () => {
      const newMember: Member = { id: Date.now().toString(), name: newMemberName.trim(), phone: newMemberPhone.trim(), joinDate: newMemberJoinDate, paidUntil: formatMonthStr(addMonths(parseMonthStr(newMemberJoinDate), -1)), totalPaid: 0, status: 'active', profileImage: newMemberImage, headMemberId: newMemberHeadId || undefined };
      await db.upsertMember(newMember);
      setMembers(prev => [...prev, newMember]);
      await logAction('إضافة عضو', `إضافة العضو الجديد: ${newMemberName}`);
    });
    setIsAddMemberMode(false); setNewMemberName(''); setNewMemberPhone(''); setNewMemberImage(undefined); setNewMemberHeadId('');
  };

  const handleUpdateMember = async (updatedInfo: Member) => {
    await withSaving(async () => {
      const existing = members.find(m => m.id === updatedInfo.id);
      if (!existing) return;
      let startDate = parseMonthStr(START_DATE);
      const joinObj = new Date(updatedInfo.joinDate);
      if (!isNaN(joinObj.getTime())) { const jms = new Date(joinObj.getFullYear(), joinObj.getMonth(), 1); if (jms > startDate) startDate = jms; }
      const monthsPaid = Math.floor(existing.totalPaid / MONTHLY_FEE);
      const updated = { ...existing, ...updatedInfo, paidUntil: formatMonthStr(addMonths(startDate, monthsPaid - 1)) };
      await db.upsertMember(updated);
      setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
      await logAction('تعديل عضو', `تحديث بيانات: ${updatedInfo.name}`);
    });
    setIsEditMemberModalOpen(false); setEditingMember(null);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!isAdmin) { alert("عذراً، هذه الصلاحية خاصة بالمشرف العام فقط."); return; }
    const transaction = payments.find(p => p.id === transactionId);
    if (!transaction || !window.confirm('هل أنت متأكد من حذف حركة الدفع؟')) return;
    await withSaving(async () => {
      await db.deletePayment(transactionId);
      setPayments(prev => prev.filter(p => p.id !== transactionId));
      const member = members.find(m => m.id === transaction.memberId);
      if (member) {
        const newTotalPaid = member.totalPaid - transaction.amount;
        let startDate = parseMonthStr(START_DATE);
        if (member.joinDate) { const jo = new Date(member.joinDate); if (!isNaN(jo.getTime())) { const jms = new Date(jo.getFullYear(), jo.getMonth(), 1); if (jms > startDate) startDate = jms; } }
        const updated = { ...member, totalPaid: newTotalPaid, paidUntil: formatMonthStr(addMonths(startDate, Math.floor(newTotalPaid / MONTHLY_FEE) - 1)) };
        await db.upsertMember(updated);
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
      }
      await logAction('حذف دفعة', `حذف دفعة بقيمة ${transaction.amount}`);
    });
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    await withSaving(async () => {
      const full = { ...expense, id: Date.now().toString() };
      await db.insertExpense(full);
      setExpenses(prev => [full, ...prev]);
      await logAction('إضافة مصروف', `صرف ${expense.amount} - ${expense.title}`);
    });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isAdmin) return;
    const exp = expenses.find(e => e.id === id);
    if (!window.confirm('حذف المصروف؟')) return;
    await withSaving(async () => {
      await db.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      await logAction('حذف مصروف', `حذف مصروف: ${exp?.title}`);
    });
  };

  const handlePublicCheck = async (phone: string) => {
    const log: VisitorLog = { phone, timestamp: new Date().toISOString() };
    setVisitorLogs(prev => [log, ...prev]);
    await db.insertVisitorLog(log);
  };

  const handleRecalculateStatus = async () => {
    await withSaving(async () => {
      const updated = members.map(m => {
        let startDate = parseMonthStr(START_DATE);
        if (m.joinDate) { const jo = new Date(m.joinDate); if (!isNaN(jo.getTime())) { const jms = new Date(jo.getFullYear(), jo.getMonth(), 1); if (jms > startDate) startDate = jms; } }
        return { ...m, paidUntil: formatMonthStr(addMonths(startDate, Math.floor(m.totalPaid / MONTHLY_FEE) - 1)) };
      });
      await Promise.all(updated.map(m => db.upsertMember(m)));
      setMembers(updated);
    });
    alert("تم تحديث البيانات.");
  };

  const handleMarkReminderSent = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const updated = { ...member, lastReminderDate: new Date().toISOString() };
    await db.upsertMember(updated);
    setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
  };

  const handleAddAnnouncement = async (text: string, image?: string) => {
    const a: Announcement = { id: Date.now().toString(), text, image, createdAt: new Date().toISOString(), active: true };
    await db.insertAnnouncement(a);
    setAnnouncements(prev => [a, ...prev]);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await db.deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleBatchPayment = async (updates: { memberId: string, amount: number, newPaidUntil: string }[]) => {
    await withSaving(async () => {
      const newTxs: PaymentTransaction[] = updates.map(u => {
        const m = members.find(mem => mem.id === u.memberId);
        return { id: Date.now().toString() + Math.random().toString().slice(2, 5), memberId: u.memberId, amount: u.amount, date: new Date().toISOString().slice(0, 10), monthsCovered: Math.floor(u.amount / MONTHLY_FEE), previousPaidUntil: m?.paidUntil || '', newPaidUntil: u.newPaidUntil };
      });
      await Promise.all(newTxs.map(tx => db.insertPayment(tx)));
      setPayments(prev => [...newTxs, ...prev]);

      const updatedMembers = members.map(m => {
        const u = updates.find(x => x.memberId === m.id);
        return u ? { ...m, paidUntil: u.newPaidUntil, totalPaid: m.totalPaid + u.amount } : m;
      });
      await Promise.all(updatedMembers.filter(m => updates.some(u => u.memberId === m.id)).map(m => db.upsertMember(m)));
      setMembers(updatedMembers);
      await logAction('دفعات مجمعة', `تم تسجيل ${updates.length} دفعة جديدة`);
    });
  };

  const handleDeleteMember = async (id: string) => {
    const m = members.find(x => x.id === id);
    await withSaving(async () => {
      await db.deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      await logAction('حذف عضو', `تم حذف العضو: ${m?.name}`);
    });
  };

  const handleDeleteAllData = async () => {
    await withSaving(async () => {
      await Promise.all([
        db.deleteAllPayments(), db.deleteAllExpenses(), db.deleteAllAuditLogs(),
        db.deleteAllVisitorLogs(), db.deleteAllAnnouncements(), db.deleteAllMembers(),
      ]);
      setMembers([]); setPayments([]); setExpenses([]);
      setAuditLogs([]); setVisitorLogs([]); setAnnouncements([]);
    });
  };

  const handleAddTreasuryTx = async (tx: Omit<TreasuryTransaction, 'id'>) => {
    const newTx: TreasuryTransaction = { ...tx, id: crypto.randomUUID() };
    await withSaving(async () => {
      await db.insertTreasuryTransaction(newTx);
      setTreasuryTx(prev => [newTx, ...prev]);
      await logAction('حركة خزينة', `${tx.type === 'deposit' ? 'إيداع' : 'سحب'} ${tx.amount} - ${tx.holder}`);
    });
  };

  const handleDeleteTreasuryTx = async (id: string) => {
    await withSaving(async () => {
      await db.deleteTreasuryTransaction(id);
      setTreasuryTx(prev => prev.filter(t => t.id !== id));
    });
  };

  const handleFamilyAssign = async (headId: string, dependentIds: string[]) => {
    await withSaving(async () => {
      // Clear old dependents of this head
      const oldDeps = members.filter(m => m.headMemberId === headId);
      for (const dep of oldDeps) {
        if (!dependentIds.includes(dep.id)) {
          const updated = { ...dep, headMemberId: undefined };
          await db.upsertMember(updated);
        }
      }
      // Set new dependents
      for (const depId of dependentIds) {
        const m = members.find(x => x.id === depId);
        if (m) {
          const updated = { ...m, headMemberId: headId };
          await db.upsertMember(updated);
        }
      }
      // Refresh
      const fresh = await db.getMembers();
      setMembers(fresh);
      const head = members.find(m => m.id === headId);
      await logAction('تعيين عائلة', `تعيين ${dependentIds.length} تابع لبيت ${head?.name}`);
    });
    setIsFamilyAssignOpen(false);
  };

  const handleExportMembersPDF = () => {
    const headers = ["الاسم", "تاريخ الانضمام", "مدفوع لغاية", "المجموع", "الحالة"];
    const rows = members.map(m => { const s = getMemberStatus(m.paidUntil); return [m.name, m.joinDate || '-', formatDisplayDate(m.paidUntil), formatCurrency(m.totalPaid), s.text]; });
    generatePDF("قائمة الأعضاء", headers, rows);
  };

  const handleExportMembers = () => { downloadCSV(members.map(m => ({ "الاسم": m.name, "الهاتف": m.phone, "تاريخ الانضمام": m.joinDate, "مدفوع لغاية": m.paidUntil, "المجموع المدفوع": m.totalPaid })), "members_list"); };

  // Chart data
  const totalIncome = members.reduce((sum, m) => sum + m.totalPaid, 0);
  const totalExpenses_val = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses_val;

  const getChartData = () => {
    const today = new Date(); const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = formatMonthStr(d); const monthName = format(d, 'MMM yyyy', { locale: ar });
      const monthlyIncome = payments.filter(p => p.date.startsWith(monthKey)).reduce((sum, p) => sum + p.amount, 0);
      const monthlyExpense = expenses.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0);
      data.push({ name: monthName, income: monthlyIncome, expense: monthlyExpense });
    }
    return data;
  };
  const chartData = getChartData();
  const recentTransactions = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map(t => ({ ...t, memberName: members.find(m => m.id === t.memberId)?.name || 'عضو محذوف' }));

  const getCategoryStyle = (category: string) => {
    if (category.includes('فرح')) return 'bg-pink-50 text-pink-700 border border-pink-200';
    if (category.includes('عزاء')) return 'bg-secondary text-muted-foreground border border-border';
    return 'bg-primary/5 text-primary border border-primary/20';
  };

  const handleExportFinancialsPDF = () => {
    const data = chartData;
    const headers = ["الشهر", "التحصيلات", "المصروفات", "الصافي"];
    const rows = data.map(d => [d.name, formatCurrency(d.income), formatCurrency(d.expense), formatCurrency(d.income - d.expense)]);
    generatePDF("التقرير المالي - آخر 6 أشهر", headers, rows);
  };

  if (showSplash) return <SplashScreen onEnter={() => setShowSplash(false)} />;

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterMonth === 'all' || m.paidUntil === filterMonth));

  // Family color palette using HSL semantic tokens
  const familyColors = [
    { bg: 'hsl(262 83% 58% / 0.08)', border: 'hsl(262 83% 58% / 0.25)', text: 'hsl(262 83% 58%)', headerBg: 'hsl(262 83% 58% / 0.12)' },
    { bg: 'hsl(175 70% 41% / 0.08)', border: 'hsl(175 70% 41% / 0.25)', text: 'hsl(175 70% 41%)', headerBg: 'hsl(175 70% 41% / 0.12)' },
    { bg: 'hsl(330 85% 60% / 0.08)', border: 'hsl(330 85% 60% / 0.25)', text: 'hsl(330 85% 60%)', headerBg: 'hsl(330 85% 60% / 0.12)' },
    { bg: 'hsl(38 92% 50% / 0.08)', border: 'hsl(38 92% 50% / 0.25)', text: 'hsl(38 92% 50%)', headerBg: 'hsl(38 92% 50% / 0.12)' },
    { bg: 'hsl(207 90% 54% / 0.08)', border: 'hsl(207 90% 54% / 0.25)', text: 'hsl(207 90% 54%)', headerBg: 'hsl(207 90% 54% / 0.12)' },
    { bg: 'hsl(160 84% 39% / 0.08)', border: 'hsl(160 84% 39% / 0.25)', text: 'hsl(160 84% 39%)', headerBg: 'hsl(160 84% 39% / 0.12)' },
    { bg: 'hsl(14 90% 55% / 0.08)', border: 'hsl(14 90% 55% / 0.25)', text: 'hsl(14 90% 55%)', headerBg: 'hsl(14 90% 55% / 0.12)' },
    { bg: 'hsl(280 60% 50% / 0.08)', border: 'hsl(280 60% 50% / 0.25)', text: 'hsl(280 60% 50%)', headerBg: 'hsl(280 60% 50% / 0.12)' },
    { bg: 'hsl(220 70% 50% / 0.08)', border: 'hsl(220 70% 50% / 0.25)', text: 'hsl(220 70% 50%)', headerBg: 'hsl(220 70% 50% / 0.12)' },
    { bg: 'hsl(350 80% 50% / 0.08)', border: 'hsl(350 80% 50% / 0.25)', text: 'hsl(350 80% 50%)', headerBg: 'hsl(350 80% 50% / 0.12)' },
  ];

  // Group members by family: heads first, then their dependents
  const groupedMembers = (() => {
    const heads = filteredMembers.filter(m => !m.headMemberId);
    const dependents = filteredMembers.filter(m => m.headMemberId);
    const result: { head: Member | null; members: Member[]; color: typeof familyColors[0] }[] = [];
    heads.forEach((h, i) => {
      const deps = dependents.filter(d => d.headMemberId === h.id);
      result.push({ head: h, members: [h, ...deps], color: familyColors[i % familyColors.length] });
    });
    // Orphan dependents (head not in filtered list)
    const usedDepIds = new Set(result.flatMap(g => g.members.map(m => m.id)));
    const orphans = dependents.filter(d => !usedDepIds.has(d.id));
    if (orphans.length > 0) result.push({ head: null, members: orphans, color: familyColors[result.length % familyColors.length] });
    return result;
  })();

  const toggleFamily = (familyId: string) => {
    setCollapsedFamilies(prev => {
      const next = new Set(prev);
      next.has(familyId) ? next.delete(familyId) : next.add(familyId);
      return next;
    });
  };

  const getFamilyDisplayName = (head: Member) => familyNames[head.id] || `بيت ${head.name}`;

  const saveFamilyName = (headId: string, name: string) => {
    const trimmed = name.trim();
    const updated = { ...familyNames };
    if (trimmed) { updated[headId] = trimmed; } else { delete updated[headId]; }
    setFamilyNames(updated);
    localStorage.setItem('sanduq_family_names', JSON.stringify(updated));
    setEditingFamilyId(null);
  };

  return (
    <div className="min-h-screen font-sans text-foreground pb-20 sm:pb-6 relative transition-colors duration-200 bg-background">
      {/* HEADER */}
      <header className="fluent-acrylic border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ background: 'var(--gradient-primary)' }}>
              <Wallet size={17} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-foreground leading-none truncate">صندوق العائلة</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex rounded-full h-1.5 w-1.5 ${isSaving ? 'bg-[hsl(var(--warning))]' : isOnline ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}`} />
                <p className="text-[10px] text-muted-foreground font-medium">{isSaving ? 'حفظ...' : isOnline ? 'متصل' : 'غير متصل'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button onClick={() => setIsPublicInquiryOpen(true)} className="h-8 px-2 sm:px-3 text-xs font-bold rounded-lg text-white hover:opacity-90 transition flex items-center gap-1.5 shadow-sm" style={{ background: 'var(--gradient-primary)' }} title="افحص اشتراكك">
              <UserCheck size={14} /><span className="hidden sm:inline">افحص حالتك</span>
            </button>
            <button onClick={() => { if (navigator.share) navigator.share({ title: 'صندوق العائلة', url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط'); } }} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition hidden sm:flex items-center justify-center"><Share2 size={15} /></button>
            {isAdmin && (
              <>
                <button onClick={() => setIsAuditLogsOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition hidden sm:flex items-center justify-center"><ShieldCheck size={15} /></button>
                <button onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition hidden sm:flex items-center justify-center"><Settings size={15} /></button>
              </>
            )}
            <button onClick={() => isLoggedIn ? handleUserLogout() : setIsLoginModalOpen(true)} className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${isLoggedIn ? 'text-destructive bg-destructive/10 hover:bg-destructive/15' : 'text-muted-foreground bg-secondary hover:bg-accent'}`}>
              {isLoggedIn ? <><Unlock size={13} /><span className="hidden xs:inline">خروج</span></> : <><Lock size={13} /><span className="hidden xs:inline">دخول</span></>}
            </button>
            {isAdmin && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition sm:hidden flex items-center justify-center">
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>
        {mobileMenuOpen && isAdmin && (
          <div className="sm:hidden border-t border-border px-3 py-2 space-y-0.5 animate-fade-in bg-card">
            <button onClick={() => { setMobileMenuOpen(false); if (navigator.share) navigator.share({ title: 'صندوق العائلة', url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط'); } }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition"><Share2 size={15} /> مشاركة</button>
            <button onClick={() => { setMobileMenuOpen(false); setIsAuditLogsOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition"><ShieldCheck size={15} /> سجل العمليات</button>
            <button onClick={() => { setMobileMenuOpen(false); setIsSettingsOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition"><Settings size={15} /> الإعدادات</button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* TABS */}
        <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl w-full">
          {(['dashboard', 'members', 'expenses'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${activeTab === t ? 'bg-card text-primary shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>
              {t === 'dashboard' ? <LayoutDashboard size={15} /> : t === 'members' ? <Users size={15} /> : <Receipt size={15} />}
              {t === 'dashboard' ? 'الرئيسية' : t === 'members' ? 'الأعضاء' : 'المصروفات'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && <div className="text-center py-20 text-muted-foreground text-sm">جاري تحميل البيانات...</div>}

        {/* DASHBOARD */}
        {!isLoading && activeTab === 'dashboard' && (
          <div className="space-y-3 sm:space-y-5 animate-fluent-reveal">
            <NewsTicker announcements={announcements} canEdit={canEdit} onEdit={() => setIsNewsModalOpen(true)} direction={tickerDirection} duration={tickerDuration} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <StatCard title="الرصيد" value={formatCurrency(netBalance)} icon={<span className="text-lg sm:text-xl font-black">₪</span>} trend="متوفر" gradient="linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 68%))" />
              <StatCard title="التحصيلات" value={formatCurrency(totalIncome)} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, hsl(175 70% 41%), hsl(175 70% 51%))" />
              <StatCard title="المصروفات" value={formatCurrency(totalExpenses_val)} icon={<TrendingDown size={18} />} gradient="linear-gradient(135deg, hsl(330 85% 55%), hsl(330 85% 65%))" />
              <StatCard title="الزوار" value={visitorLogs.length.toString()} icon={<Eye size={18} />} gradient="linear-gradient(135deg, hsl(38 92% 50%), hsl(45 100% 60%))" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="lg:col-span-2 fluent-card p-4 sm:p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">التقرير المالي</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setIsMonthlyReportOpen(true)} className="h-7 px-2.5 text-[11px] font-medium text-primary hover:bg-primary/5 rounded-md flex items-center gap-1 transition"><FileBarChart size={13} /> <span className="hidden sm:inline">جدول</span></button>
                    {canEdit && <button onClick={handleExportFinancialsPDF} className="h-7 px-2.5 text-[11px] font-medium text-destructive hover:bg-destructive/5 rounded-md flex items-center gap-1 transition"><Printer size={13} /> <span className="hidden sm:inline">PDF</span></button>}
                  </div>
                </div>
                <div className="h-44 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                      <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--fluent-shadow)' }} />
                      <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={18} />
                      <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="fluent-card p-4 sm:p-5 flex flex-col gap-3">
                <h3 className="font-semibold text-foreground text-sm">إجراءات سريعة</h3>
                <button onClick={() => setIsAIChatOpen(true)} className="w-full py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold hover:opacity-90 transition shadow-md text-white" style={{ background: 'var(--gradient-primary)' }}>
                  <Sparkles size={16} /> المساعد الذكي
                </button>
                {canEdit && (
                  <button onClick={() => setIsTreasuryOpen(true)} className="w-full py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border-2 border-primary text-primary hover:bg-primary/5 transition">
                    <Vault size={16} /> الخزينة
                  </button>
                )}
                <div className="flex-1 bg-secondary/50 rounded-lg p-3 border border-border overflow-hidden">
                  <h4 className="font-semibold text-foreground mb-2 text-xs">آخر 20 دفعة</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
                    {recentTransactions.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">لا توجد دفعات بعد</p>}
                    {recentTransactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 shrink-0 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{tx.memberName.charAt(0)}</div>
                          <p className="text-[11px] font-medium text-foreground truncate">{tx.memberName}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{format(new Date(tx.date), 'dd/MM/yyyy')}</span>
                          <span className={`text-[11px] font-bold dir-ltr ${tx.amount > 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {canEdit ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsWhatsAppModalOpen(true)} className="flex-1 h-9 bg-[hsl(var(--whatsapp))]/10 hover:bg-[hsl(var(--whatsapp))]/20 text-[hsl(var(--whatsapp-dark))] rounded-md border border-[hsl(var(--whatsapp))]/20 transition flex items-center justify-center gap-1 text-[11px] font-medium">واتساب</button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 h-9 bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-md border border-destructive/20 transition flex items-center justify-center gap-1 text-[11px] font-medium"><Receipt size={13} /> مصروف</button>
                  </div>
                ) : <div className="text-center text-[10px] text-muted-foreground py-3 bg-secondary rounded-md border border-dashed border-border"><Lock size={12} className="mx-auto mb-1 opacity-40" /> يجب تسجيل الدخول</div>}
              </div>
            </div>
          </div>
        )}

        {/* MEMBERS */}
        {!isLoading && activeTab === 'members' && (
          <div className="space-y-3 sm:space-y-4 animate-fluent-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="lg:col-span-3 fluent-card overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">قائمة الأعضاء <span className="text-muted-foreground font-normal">({filteredMembers.length})</span></h2>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => setIsFamilyAssignOpen(true)} className="h-8 px-2.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition flex items-center gap-1 text-xs font-medium"><Users size={13} /><span className="hidden sm:inline"> عائلات</span></button>
                        <button onClick={() => setIsRemindersModalOpen(true)} className="h-8 px-2.5 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] rounded-md hover:bg-[hsl(var(--warning))]/20 transition flex items-center gap-1 text-xs font-medium"><Bell size={13} /><span className="hidden sm:inline"> تذكير</span></button>
                        <button onClick={handleExportMembersPDF} className="h-8 w-8 bg-destructive/5 text-destructive rounded-md hover:bg-destructive/10 transition flex items-center justify-center"><Printer size={14} /></button>
                        <button onClick={handleExportMembers} className="h-8 w-8 bg-[hsl(var(--success))]/5 text-[hsl(var(--success))] rounded-md hover:bg-[hsl(var(--success))]/10 transition hidden sm:flex items-center justify-center"><FileSpreadsheet size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col xs:flex-row gap-2">
                    <div className="relative flex-1"><input type="text" placeholder="بحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-8 pl-3 pr-8 bg-secondary border border-border rounded-md text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" /><Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} /></div>
                    <div className="flex gap-1.5">
                      <div className="flex bg-secondary border border-border rounded-md overflow-hidden">
                        <button onClick={() => setViewMode('families')} className={`h-8 px-2.5 text-[11px] font-medium transition flex items-center gap-1 ${viewMode === 'families' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Users size={12} /> عائلات</button>
                        <button onClick={() => setViewMode('members')} className={`h-8 px-2.5 text-[11px] font-medium transition flex items-center gap-1 ${viewMode === 'members' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><User size={12} /> أفراد</button>
                      </div>
                      <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="h-8 px-2.5 bg-secondary border border-border rounded-md text-xs min-w-0 focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="all">الجميع</option>
                        {Array.from(new Set(members.map(m => m.paidUntil))).sort().reverse().map((date: string) => <option key={date} value={date}>{formatDisplayDate(date)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-secondary/50 text-muted-foreground text-xs font-medium"><tr><th className="px-5 py-3">العضو</th><th className="px-5 py-3">مدفوع لغاية</th><th className="px-5 py-3">المجموع</th><th className="px-5 py-3">الحالة</th><th className="px-5 py-3 text-center">الإجراء</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {viewMode === 'families' ? groupedMembers.map((group, gi) => {
                        const familyId = group.head?.id || `orphan-${gi}`;
                        const isCollapsed = collapsedFamilies.has(familyId);
                        return (
                        <React.Fragment key={gi}>
                          {group.members.length > 1 && group.head && (
                            <tr>
                              <td colSpan={5} className="px-5 py-1.5 cursor-pointer select-none" style={{ backgroundColor: group.color.headerBg }} onClick={() => toggleFamily(familyId)}>
                                <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: group.color.text }}>
                                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                  <Users size={12} />
                                  {editingFamilyId === familyId ? (
                                    <span className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                      <input autoFocus value={editingFamilyName} onChange={e => setEditingFamilyName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveFamilyName(familyId, editingFamilyName); if (e.key === 'Escape') setEditingFamilyId(null); }} className="h-5 px-1.5 text-[11px] font-bold rounded border border-current bg-background/80 outline-none w-32" style={{ color: group.color.text }} />
                                      <button onClick={() => saveFamilyName(familyId, editingFamilyName)} className="p-0.5 rounded hover:bg-background/30"><Check size={11} /></button>
                                      <button onClick={() => setEditingFamilyId(null)} className="p-0.5 rounded hover:bg-background/30"><XIcon size={11} /></button>
                                    </span>
                                  ) : (
                                    <span>{getFamilyDisplayName(group.head)} ({group.members.length} أعضاء)</span>
                                  )}
                                  {canEdit && editingFamilyId !== familyId && (
                                    <button onClick={e => { e.stopPropagation(); setEditingFamilyId(familyId); setEditingFamilyName(familyNames[familyId] || `بيت ${group.head!.name}`); }} className="p-0.5 rounded hover:bg-background/30 opacity-0 group-hover:opacity-100 transition mr-1"><Pencil size={10} /></button>
                                  )}
                                </span>
                              </td>
                            </tr>
                          )}
                          {!isCollapsed && group.members.map(member => {
                            const statusInfo = getMemberStatus(member.paidUntil);
                            const isDependent = !!member.headMemberId;
                            return (
                              <tr key={member.id} onClick={() => setViewMemberHistory(member)} style={{ backgroundColor: group.members.length > 1 ? group.color.bg : undefined, borderRight: group.members.length > 1 ? `3px solid ${group.color.text}` : undefined }} className={`hover:bg-accent/50 transition cursor-pointer group ${statusInfo.status === 'late' ? 'animate-pulse-red-glow' : ''}`}>
                                <td className={`px-5 py-3 ${isDependent ? 'pr-10' : ''}`}><div className="font-medium text-foreground flex items-center gap-3 text-sm">{isDependent && <span className="text-muted-foreground/40 text-xs">└</span>}{member.profileImage ? <img src={member.profileImage} className="w-8 h-8 rounded-md object-cover shrink-0" /> : <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: `${group.color.text}20`, color: group.color.text }}>{member.name.charAt(0)}</div>}<div className="min-w-0"><div className="truncate">{member.name}</div><div className="text-[10px] text-muted-foreground font-normal">{member.phone}</div></div>{canEdit && <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setIsEditMemberModalOpen(true); }} className="text-muted-foreground/30 hover:text-primary p-1 mr-1 shrink-0 opacity-0 group-hover:opacity-100 transition"><Edit size={13} /></button>}</div></td>
                                <td className="px-5 py-3"><span className="font-mono text-xs text-foreground bg-secondary px-2 py-0.5 rounded">{formatDisplayDate(String(member.paidUntil))}</span></td>
                                <td className="px-5 py-3"><span className="font-semibold text-foreground text-sm">{formatCurrency(member.totalPaid)}</span></td>
                                <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusInfo.color}`}>{statusInfo.text}</span></td>
                                <td className="px-5 py-3 flex justify-center">{canEdit && <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setIsPaymentModalOpen(true); }} className="h-8 w-8 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition flex items-center justify-center"><DollarSign size={15} /></button>}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                        );
                      }) : filteredMembers.map(member => {
                        const statusInfo = getMemberStatus(member.paidUntil);
                        return (
                          <tr key={member.id} onClick={() => setViewMemberHistory(member)} className={`hover:bg-accent/50 transition cursor-pointer group ${statusInfo.status === 'late' ? 'animate-pulse-red-glow' : ''}`}>
                            <td className="px-5 py-3"><div className="font-medium text-foreground flex items-center gap-3 text-sm">{member.profileImage ? <img src={member.profileImage} className="w-8 h-8 rounded-md object-cover shrink-0" /> : <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">{member.name.charAt(0)}</div>}<div className="min-w-0"><div className="truncate">{member.name}</div><div className="text-[10px] text-muted-foreground font-normal">{member.phone}</div></div>{canEdit && <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setIsEditMemberModalOpen(true); }} className="text-muted-foreground/30 hover:text-primary p-1 mr-1 shrink-0 opacity-0 group-hover:opacity-100 transition"><Edit size={13} /></button>}</div></td>
                            <td className="px-5 py-3"><span className="font-mono text-xs text-foreground bg-secondary px-2 py-0.5 rounded">{formatDisplayDate(String(member.paidUntil))}</span></td>
                            <td className="px-5 py-3"><span className="font-semibold text-foreground text-sm">{formatCurrency(member.totalPaid)}</span></td>
                            <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusInfo.color}`}>{statusInfo.text}</span></td>
                            <td className="px-5 py-3 flex justify-center">{canEdit && <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setIsPaymentModalOpen(true); }} className="h-8 w-8 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition flex items-center justify-center"><DollarSign size={15} /></button>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-border">
                  {filteredMembers.length === 0 && <div className="text-center py-10 text-muted-foreground text-xs">لا يوجد أعضاء</div>}
                  {viewMode === 'families' ? groupedMembers.map((group, gi) => (
                    <div key={gi} style={{ borderRight: group.members.length > 1 ? `3px solid ${group.color.text}` : undefined }}>
                      {group.members.length > 1 && group.head && (
                        <div className="px-3.5 py-2 border-b border-border" style={{ backgroundColor: group.color.headerBg }}><span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: group.color.text }}><Users size={12} /> بيت {group.head.name} ({group.members.length})</span></div>
                      )}
                      {group.members.map(member => {
                        const statusInfo = getMemberStatus(member.paidUntil);
                        const isDependent = !!member.headMemberId;
                        return (
                          <div key={member.id} onClick={() => setViewMemberHistory(member)} style={{ backgroundColor: group.members.length > 1 ? group.color.bg : undefined }} className={`p-3.5 hover:bg-accent/30 transition cursor-pointer active:bg-accent/50 ${statusInfo.status === 'late' ? 'animate-pulse-red-glow' : ''} ${isDependent ? 'pr-8' : ''}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {isDependent && <span className="text-muted-foreground/40 text-xs shrink-0">└</span>}
                                {member.profileImage ? <img src={member.profileImage} className="w-9 h-9 rounded-md object-cover shrink-0" /> : <div className="w-9 h-9 rounded-md flex items-center justify-center font-semibold text-xs shrink-0" style={{ backgroundColor: `${group.color.text}20`, color: group.color.text }}>{member.name.charAt(0)}</div>}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-foreground text-sm truncate">{member.name}</span>
                                    <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                    <span>{formatDisplayDate(member.paidUntil)}</span>
                                    <span className="opacity-30">|</span>
                                    <span className="font-semibold text-foreground">{formatCurrency(member.totalPaid)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {canEdit && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setIsEditMemberModalOpen(true); }} className="h-7 w-7 text-muted-foreground/40 hover:text-primary rounded-md flex items-center justify-center transition"><Edit size={13} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setIsPaymentModalOpen(true); }} className="h-7 w-7 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition flex items-center justify-center"><DollarSign size={14} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )) : filteredMembers.map(member => {
                    const statusInfo = getMemberStatus(member.paidUntil);
                    return (
                      <div key={member.id} onClick={() => setViewMemberHistory(member)} className={`p-3.5 hover:bg-accent/30 transition cursor-pointer active:bg-accent/50 ${statusInfo.status === 'late' ? 'animate-pulse-red-glow' : ''}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {member.profileImage ? <img src={member.profileImage} className="w-9 h-9 rounded-md object-cover shrink-0" /> : <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">{member.name.charAt(0)}</div>}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground text-sm truncate">{member.name}</span>
                                <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                <span>{formatDisplayDate(member.paidUntil)}</span>
                                <span className="opacity-30">|</span>
                                <span className="font-semibold text-foreground">{formatCurrency(member.totalPaid)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {canEdit && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setIsEditMemberModalOpen(true); }} className="h-7 w-7 text-muted-foreground/40 hover:text-primary rounded-md flex items-center justify-center transition"><Edit size={13} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setIsPaymentModalOpen(true); }} className="h-7 w-7 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition flex items-center justify-center"><DollarSign size={14} /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add member sidebar */}
              <div className="fluent-card p-4 sm:p-5 h-fit">
                <div className="text-center mb-3"><div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-2"><Users size={18} /></div><h3 className="font-semibold text-foreground text-sm">إضافة عضو</h3></div>
                {canEdit ? (!isAddMemberMode ? <button onClick={() => setIsAddMemberMode(true)} className="w-full h-9 bg-primary text-primary-foreground rounded-lg font-medium transition flex items-center justify-center gap-2 text-xs hover:bg-primary/90"><Plus size={15} /> عضو جديد</button> : (
                  <form onSubmit={handleAddMember} className="space-y-2.5 animate-fade-in">
                    <div className="flex justify-center mb-2"><div className="w-14 h-14 rounded-lg bg-secondary border border-border flex items-center justify-center cursor-pointer hover:bg-accent transition overflow-hidden" onClick={() => fileInputRef.current?.click()}>{newMemberImage ? <img src={newMemberImage} className="w-full h-full object-cover" /> : <Camera size={16} className="text-muted-foreground" />}</div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setNewMemberImage(await compressImage(f)); }} /></div>
                    <input type="text" placeholder="الاسم" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="w-full h-8 px-3 text-xs border border-border rounded-md bg-secondary focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
                    <input type="text" placeholder="رقم الهاتف" value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} className="w-full h-8 px-3 text-xs border border-border rounded-md bg-secondary focus:outline-none focus:ring-1 focus:ring-ring dir-ltr text-right" />
                    <input type="date" value={newMemberJoinDate} onChange={e => setNewMemberJoinDate(e.target.value)} className="w-full h-8 px-3 text-xs border border-border rounded-md bg-secondary text-right focus:outline-none focus:ring-1 focus:ring-ring" />
                    <select value={newMemberHeadId} onChange={e => setNewMemberHeadId(e.target.value)} className="w-full h-8 px-3 text-xs border border-border rounded-md bg-secondary focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">رب الأسرة (مستقل)</option>
                      {members.filter(m => !m.headMemberId).map(m => <option key={m.id} value={m.id}>تابع لـ {m.name}</option>)}
                    </select>
                    <div className="flex gap-1.5"><button type="submit" className="flex-1 h-8 bg-[hsl(var(--success))] text-white rounded-md text-xs font-medium hover:opacity-90 transition">حفظ</button><button type="button" onClick={() => { setIsAddMemberMode(false); setNewMemberHeadId(''); }} className="flex-1 h-8 bg-secondary text-muted-foreground rounded-md text-xs hover:bg-accent transition">إلغاء</button></div>
                  </form>
                )) : <div className="text-center text-[11px] text-muted-foreground bg-secondary p-3 rounded-md">يجب تسجيل الدخول لإضافة أعضاء</div>}
              </div>
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {!isLoading && activeTab === 'expenses' && (
          <div className="space-y-3 sm:space-y-4 animate-fluent-reveal">
            <div className="fluent-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">سجل المصروفات</h2>
                {canEdit && <button onClick={() => setIsExpenseModalOpen(true)} className="h-8 px-3 bg-destructive text-destructive-foreground rounded-md font-medium hover:bg-destructive/90 transition flex items-center gap-1.5 text-xs"><Plus size={14} /> مصروف</button>}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-secondary/50 text-muted-foreground text-xs font-medium"><tr><th className="px-5 py-3">البند</th><th className="px-5 py-3">التصنيف</th><th className="px-5 py-3">التاريخ</th><th className="px-5 py-3">القيمة</th><th className="px-5 py-3">ملاحظات</th>{isAdmin && <th className="px-5 py-3"></th>}</tr></thead>
                  <tbody className="divide-y divide-border">
                    {expenses.length > 0 ? expenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-accent/30 transition"><td className="px-5 py-3 font-medium text-foreground text-sm">{expense.title}</td><td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getCategoryStyle(expense.category)}`}>{expense.category}</span></td><td className="px-5 py-3 text-xs text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</td><td className="px-5 py-3 text-destructive font-semibold text-sm">{formatCurrency(expense.amount)}</td><td className="px-5 py-3 text-xs text-muted-foreground truncate max-w-[200px]">{expense.notes || '-'}</td>{isAdmin && <td className="px-5 py-3"><button onClick={() => handleDeleteExpense(expense.id)} className="text-muted-foreground/40 hover:text-destructive transition"><XIcon size={14} /></button></td>}</tr>
                    )) : <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-xs">لا توجد مصروفات مسجلة</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y divide-border">
                {expenses.length === 0 && <div className="text-center py-10 text-muted-foreground text-xs">لا توجد مصروفات</div>}
                {expenses.map(expense => (
                  <div key={expense.id} className="p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">{expense.title}</h3>
                        <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryStyle(expense.category)}`}>{expense.category}</span>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-destructive font-semibold text-sm">{formatCurrency(expense.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    {expense.notes && <p className="text-[11px] text-muted-foreground bg-secondary p-2 rounded">{expense.notes}</p>}
                    {isAdmin && <button onClick={() => handleDeleteExpense(expense.id)} className="text-[10px] text-muted-foreground/50 hover:text-destructive font-medium transition">حذف</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-4 text-center"><p className="text-[10px] text-muted-foreground/60">تم إنشاء هذا البرنامج بواسطة مالك إدريس</p></footer>

      {/* FAB */}
      <button onClick={() => setIsAIChatOpen(true)} className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 text-white p-3.5 rounded-2xl shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95" style={{ background: 'var(--gradient-primary)' }}>
        <Sparkles size={20} />
      </button>

      {/* MODALS */}
      <PublicInquiryModal isOpen={isPublicInquiryOpen} onClose={() => setIsPublicInquiryOpen(false)} members={members} onCheck={handlePublicCheck} />
      <AuditLogsModal isOpen={isAuditLogsOpen} onClose={() => setIsAuditLogsOpen(false)} logs={auditLogs} />
      <ManageNewsModal isOpen={isNewsModalOpen} onClose={() => setIsNewsModalOpen(false)} announcements={announcements} onAdd={handleAddAnnouncement} onDelete={handleDeleteAnnouncement} currentDirection={tickerDirection} currentDuration={tickerDuration} onSaveSettings={handleSaveTickerSettings} />
      <AIChatModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} members={members} expenses={expenses}
        onApplyUpdates={(updates) => { handleBatchPayment(updates); }}
        onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense}
        onEditExpense={async (e) => { await db.updateExpense(e); setExpenses(prev => prev.map(ex => ex.id === e.id ? e : ex)); }}
        onDeleteAllData={handleDeleteAllData}
        onAddMember={async (n, p, j) => { const m: Member = { id: Date.now().toString(), name: n, phone: p, joinDate: j || START_DATE, paidUntil: formatMonthStr(addMonths(parseMonthStr(j || START_DATE), -1)), totalPaid: 0, status: 'active' }; await db.upsertMember(m); setMembers(prev => [...prev, m]); }}
        onBatchAddMembers={async (l) => { for (const item of l) { const m: Member = { id: Date.now().toString() + Math.random().toString().slice(2, 5), name: item.name, phone: item.phone, joinDate: item.joinDate || START_DATE, paidUntil: formatMonthStr(addMonths(parseMonthStr(item.joinDate || START_DATE), -1)), totalPaid: 0, status: 'active' }; await db.upsertMember(m); setMembers(prev => [...prev, m]); } }}
        onDeleteMember={handleDeleteMember} onUpdateMember={handleUpdateMember} onBulkUpdateJoinDate={() => {}} isAdmin={isAdmin} userRole={userRole} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onRecalculate={handleRecalculateStatus} members={members} payments={payments} expenses={expenses} onDataRestored={loadAllData} />
      <MonthlyReportModal isOpen={isMonthlyReportOpen} onClose={() => setIsMonthlyReportOpen(false)} members={members} isAdmin={canEdit} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} member={selectedMember} onConfirm={handleConfirmPayment} />
      <MemberHistoryModal isOpen={!!viewMemberHistory} onClose={() => setViewMemberHistory(null)} member={viewMemberHistory} transactions={payments} onDeleteTransaction={isAdmin ? handleDeleteTransaction : undefined} />
      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onAdd={handleAddExpense} />
      <WhatsAppImportModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} members={members} onConfirm={handleBatchPayment} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleUserLogin} />
      <EditMemberModal isOpen={isEditMemberModalOpen} onClose={() => setIsEditMemberModalOpen(false)} member={editingMember} onUpdate={handleUpdateMember} allMembers={members} />
      <RemindersModal isOpen={isRemindersModalOpen} onClose={() => setIsRemindersModalOpen(false)} members={members} onMarkAsSent={handleMarkReminderSent} />
      <TreasuryModal isOpen={isTreasuryOpen} onClose={() => setIsTreasuryOpen(false)} transactions={treasuryTx} onAddTransaction={handleAddTreasuryTx} onDeleteTransaction={handleDeleteTreasuryTx} canEdit={canEdit} />
      <FamilyAssignmentModal isOpen={isFamilyAssignOpen} onClose={() => setIsFamilyAssignOpen(false)} members={members} onAssign={handleFamilyAssign} />

      <footer className="text-center py-4 text-[11px] text-muted-foreground border-t border-border mt-6">
        جميع الحقوق محفوظة لدى المبرمج مالك ادريس
      </footer>
    </div>
  );
}
