import React, { useState, useEffect, useRef } from 'react';
import { Users, DollarSign, Search, Plus, Wallet, TrendingUp, TrendingDown, Lock, Unlock, FileSpreadsheet, LayoutDashboard, Receipt, Sparkles, Settings, Share2, FileBarChart, Edit, X as XIcon, Eye, ShieldCheck, UserCheck, Bell, Printer, Camera, Menu, X, ChevronDown } from 'lucide-react';
import { Member, PaymentTransaction, Expense, MONTHLY_FEE, START_DATE, AuditLog, VisitorLog, Announcement } from './types';
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
import { formatCurrency, formatDisplayDate, getMemberStatus, parseMonthStr, formatMonthStr, downloadCSV, compressImage, generatePDF } from './utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, addMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from './services/api';

const STORAGE_KEYS = {
  MEMBERS: 'sanduq_members_clean_v1', PAYMENTS: 'sanduq_payments_clean_v1', EXPENSES: 'sanduq_expenses_clean_v1',
  AUDIT_LOGS: 'sanduq_audit_logs_v1', VISITOR_LOGS: 'sanduq_visitor_logs_v1', ANNOUNCEMENTS: 'sanduq_announcements_v1',
  SESSION_ROLE: 'sanduq_user_role', PENDING_SYNC: 'sanduq_pending_sync',
  TICKER_DIRECTION: 'sanduq_ticker_direction', TICKER_SPEED: 'sanduq_ticker_speed'
};

export default function SanduqApp() {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState({ members: false, payments: false, expenses: false, auditLogs: false, visitorLogs: false, announcements: false });
  const [showSplash, setShowSplash] = useState(true);
  const initialLoadComplete = useRef(false);
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
  const [isAddMemberMode, setIsAddMemberMode] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberJoinDate, setNewMemberJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMemberImage, setNewMemberImage] = useState<string | undefined>(undefined);

  // Network
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Load settings
  useEffect(() => {
    const savedDir = localStorage.getItem(STORAGE_KEYS.TICKER_DIRECTION);
    if (savedDir === 'rtl') setTickerDirection('rtl');
    const savedSpeed = localStorage.getItem(STORAGE_KEYS.TICKER_SPEED);
    if (savedSpeed) setTickerDuration(Number(savedSpeed));
  }, []);

  const handleSaveTickerSettings = (dir: 'rtl' | 'ltr', duration: number) => {
    setTickerDirection(dir); setTickerDuration(duration);
    localStorage.setItem(STORAGE_KEYS.TICKER_DIRECTION, dir);
    localStorage.setItem(STORAGE_KEYS.TICKER_SPEED, duration.toString());
  };

  // Session
  useEffect(() => {
    const savedRole = localStorage.getItem(STORAGE_KEYS.SESSION_ROLE);
    if (savedRole === 'admin' || savedRole === 'moderator') setUserRole(savedRole as any);
    else setUserRole(null);
  }, []);

  // Load Data
  useEffect(() => {
    try {
      const l = (k: string) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : []; };
      setMembers(l(STORAGE_KEYS.MEMBERS)); setPayments(l(STORAGE_KEYS.PAYMENTS)); setExpenses(l(STORAGE_KEYS.EXPENSES));
      setAuditLogs(l(STORAGE_KEYS.AUDIT_LOGS)); setVisitorLogs(l(STORAGE_KEYS.VISITOR_LOGS)); setAnnouncements(l(STORAGE_KEYS.ANNOUNCEMENTS));
      initialLoadComplete.current = true;
    } catch (e) { console.error("Load error", e); }
    setIsLoading(false);
  }, []);

  const handleDataChange = (key: string, data: any, stateSetter: any) => {
    stateSetter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const updateMembers = (val: any) => handleDataChange(STORAGE_KEYS.MEMBERS, typeof val === 'function' ? val(members) : val, setMembers);
  const updatePayments = (val: any) => handleDataChange(STORAGE_KEYS.PAYMENTS, typeof val === 'function' ? val(payments) : val, setPayments);
  const updateExpenses = (val: any) => handleDataChange(STORAGE_KEYS.EXPENSES, typeof val === 'function' ? val(expenses) : val, setExpenses);
  const updateAuditLogs = (val: any) => handleDataChange(STORAGE_KEYS.AUDIT_LOGS, typeof val === 'function' ? val(auditLogs) : val, setAuditLogs);
  const updateVisitorLogs = (val: any) => handleDataChange(STORAGE_KEYS.VISITOR_LOGS, typeof val === 'function' ? val(visitorLogs) : val, setVisitorLogs);
  const updateAnnouncements = (val: any) => handleDataChange(STORAGE_KEYS.ANNOUNCEMENTS, typeof val === 'function' ? val(announcements) : val, setAnnouncements);

  const logAction = (action: string, details: string) => {
    const user = userRole === 'admin' ? 'Admin' : (userRole === 'moderator' ? 'Edrees' : 'System');
    updateAuditLogs((prev: AuditLog[]) => [{ id: Date.now().toString(), user, action, details, timestamp: new Date().toISOString() }, ...prev]);
  };

  const handleUserLogin = (role: 'admin' | 'moderator') => { setUserRole(role); localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role); setIsLoginModalOpen(false); };
  const handleUserLogout = () => { if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) { setUserRole(null); localStorage.removeItem(STORAGE_KEYS.SESSION_ROLE); setIsAddMemberMode(false); } };

  const handleConfirmPayment = (amount: number, newPaidUntil: string) => {
    if (!selectedMember) return;
    const monthsCovered = Math.floor(amount / MONTHLY_FEE);
    updatePayments((prev: PaymentTransaction[]) => [{ id: Date.now().toString(), memberId: selectedMember.id, amount, date: new Date().toISOString().slice(0, 10), monthsCovered, previousPaidUntil: selectedMember.paidUntil, newPaidUntil }, ...prev]);
    updateMembers((prev: Member[]) => prev.map(m => m.id === selectedMember.id ? { ...m, paidUntil: newPaidUntil, totalPaid: m.totalPaid + amount } : m));
    logAction('إضافة دفعة', `استلام ${amount} من ${selectedMember.name}`);
    setIsPaymentModalOpen(false); setSelectedMember(null);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      const newMember: Member = { id: Date.now().toString(), name: newMemberName.trim(), phone: '', joinDate: newMemberJoinDate, paidUntil: formatMonthStr(addMonths(parseMonthStr(newMemberJoinDate), -1)), totalPaid: 0, status: 'active', profileImage: newMemberImage };
      updateMembers((prev: Member[]) => [...prev, newMember]);
      logAction('إضافة عضو', `إضافة العضو الجديد: ${newMemberName}`);
      setIsAddMemberMode(false); setNewMemberName(''); setNewMemberImage(undefined);
    }
  };

  const handleUpdateMember = (updatedInfo: Member) => {
    updateMembers((prev: Member[]) => prev.map(m => {
      if (m.id !== updatedInfo.id) return m;
      let startDate = parseMonthStr(START_DATE);
      const joinObj = new Date(updatedInfo.joinDate);
      if (!isNaN(joinObj.getTime())) { const jms = new Date(joinObj.getFullYear(), joinObj.getMonth(), 1); if (jms > startDate) startDate = jms; }
      const monthsPaid = Math.floor(m.totalPaid / MONTHLY_FEE);
      return { ...m, ...updatedInfo, paidUntil: formatMonthStr(addMonths(startDate, monthsPaid - 1)) };
    }));
    logAction('تعديل عضو', `تحديث بيانات: ${updatedInfo.name}`);
    setIsEditMemberModalOpen(false); setEditingMember(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (!isAdmin) { alert("عذراً، هذه الصلاحية خاصة بالمشرف العام فقط."); return; }
    const transaction = payments.find(p => p.id === transactionId);
    if (!transaction || !window.confirm('هل أنت متأكد من حذف حركة الدفع؟')) return;
    updatePayments((prev: PaymentTransaction[]) => prev.filter(p => p.id !== transactionId));
    updateMembers((prev: Member[]) => prev.map(m => {
      if (m.id !== transaction.memberId) return m;
      const newTotalPaid = m.totalPaid - transaction.amount;
      let startDate = parseMonthStr(START_DATE);
      if (m.joinDate) { const jo = new Date(m.joinDate); if (!isNaN(jo.getTime())) { const jms = new Date(jo.getFullYear(), jo.getMonth(), 1); if (jms > startDate) startDate = jms; } }
      return { ...m, totalPaid: newTotalPaid, paidUntil: formatMonthStr(addMonths(startDate, Math.floor(newTotalPaid / MONTHLY_FEE) - 1)) };
    }));
    logAction('حذف دفعة', `حذف دفعة بقيمة ${transaction.amount}`);
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => { updateExpenses((prev: Expense[]) => [{ ...expense, id: Date.now().toString() }, ...prev]); logAction('إضافة مصروف', `صرف ${expense.amount} - ${expense.title}`); };
  const handleDeleteExpense = (id: string) => { if (!isAdmin) return; const exp = expenses.find(e => e.id === id); if (window.confirm('حذف المصروف؟')) { updateExpenses((prev: Expense[]) => prev.filter(e => e.id !== id)); logAction('حذف مصروف', `حذف مصروف: ${exp?.title}`); } };
  const handlePublicCheck = (phone: string) => { updateVisitorLogs((prev: VisitorLog[]) => [{ phone, timestamp: new Date().toISOString() }, ...prev]); };

  const handleRecalculateStatus = () => {
    updateMembers((prev: Member[]) => prev.map(m => {
      let startDate = parseMonthStr(START_DATE);
      if (m.joinDate) { const jo = new Date(m.joinDate); if (!isNaN(jo.getTime())) { const jms = new Date(jo.getFullYear(), jo.getMonth(), 1); if (jms > startDate) startDate = jms; } }
      return { ...m, paidUntil: formatMonthStr(addMonths(startDate, Math.floor(m.totalPaid / MONTHLY_FEE) - 1)) };
    }));
    alert("تم تحديث البيانات.");
  };

  const handleMarkReminderSent = (memberId: string) => { updateMembers((prev: Member[]) => prev.map(m => m.id === memberId ? { ...m, lastReminderDate: new Date().toISOString() } : m)); };

  const handleAddAnnouncement = (text: string, image?: string) => { updateAnnouncements((prev: Announcement[]) => [{ id: Date.now().toString(), text, image, createdAt: new Date().toISOString(), active: true }, ...prev]); };
  const handleDeleteAnnouncement = (id: string) => { updateAnnouncements((prev: Announcement[]) => prev.filter(a => a.id !== id)); };

  const handleBatchPayment = (updates: { memberId: string, amount: number, newPaidUntil: string }[]) => {
    const newTx: PaymentTransaction[] = updates.map(u => { const m = members.find(mem => mem.id === u.memberId); return { id: Date.now().toString() + Math.random().toString().slice(2, 5), memberId: u.memberId, amount: u.amount, date: new Date().toISOString().slice(0, 10), monthsCovered: Math.floor(u.amount / MONTHLY_FEE), previousPaidUntil: m?.paidUntil || '', newPaidUntil: u.newPaidUntil }; });
    updatePayments((prev: PaymentTransaction[]) => [...newTx, ...prev]);
    updateMembers((prev: Member[]) => prev.map(m => { const u = updates.find(x => x.memberId === m.id); return u ? { ...m, paidUntil: u.newPaidUntil, totalPaid: m.totalPaid + u.amount } : m; }));
    logAction('دفعات مجمعة', `تم تسجيل ${updates.length} دفعة جديدة`);
  };

  const handleDeleteMember = (id: string) => { const m = members.find(x => x.id === id); updateMembers((prev: Member[]) => prev.filter(m => m.id !== id)); logAction('حذف عضو', `تم حذف العضو: ${m?.name}`); };
  const handleDeleteAllData = () => { updateMembers([]); updatePayments([]); updateExpenses([]); updateAuditLogs([]); updateVisitorLogs([]); updateAnnouncements([]); };

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
  const recentTransactions = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => ({ ...t, memberName: members.find(m => m.id === t.memberId)?.name || 'عضو محذوف' }));

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

  return (
    <div className="min-h-screen font-sans text-foreground pb-20 sm:pb-6 relative transition-colors duration-200 bg-background">
      {/* HEADER - Fluent Mica style */}
      <header className="fluent-acrylic border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground leading-none truncate">صندوق العائلة</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex rounded-full h-1.5 w-1.5 ${isSaving ? 'bg-[hsl(var(--warning))]' : isOnline ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}`} />
                <p className="text-[10px] text-muted-foreground">{isSaving ? 'مزامنة...' : isOnline ? 'متصل' : 'غير متصل'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button onClick={() => setIsPublicInquiryOpen(true)} className="h-8 px-2 sm:px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-1.5" title="افحص اشتراكك">
              <UserCheck size={14} /><span className="hidden sm:inline">افحص حالتك</span>
            </button>
            <button onClick={() => { if (navigator.share) navigator.share({ title: 'صندوق العائلة', url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط'); } }} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition hidden sm:flex items-center justify-center"><Share2 size={15} /></button>
            {isAdmin && (
              <>
                <button onClick={() => setIsAuditLogsOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition hidden sm:flex items-center justify-center"><ShieldCheck size={15} /></button>
                <button onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition hidden sm:flex items-center justify-center"><Settings size={15} /></button>
              </>
            )}
            <button onClick={() => isLoggedIn ? handleUserLogout() : setIsLoginModalOpen(true)} className={`h-8 px-2.5 sm:px-3 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${isLoggedIn ? 'text-destructive bg-destructive/10 hover:bg-destructive/15' : 'text-muted-foreground bg-secondary hover:bg-accent'}`}>
              {isLoggedIn ? <><Unlock size={13} /><span className="hidden xs:inline">خروج</span></> : <><Lock size={13} /><span className="hidden xs:inline">دخول</span></>}
            </button>
            {isAdmin && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition sm:hidden flex items-center justify-center">
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && isAdmin && (
          <div className="sm:hidden border-t border-border px-3 py-2 space-y-0.5 animate-fade-in bg-card">
            <button onClick={() => { setMobileMenuOpen(false); if (navigator.share) navigator.share({ title: 'صندوق العائلة', url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط'); } }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition"><Share2 size={15} /> مشاركة</button>
            <button onClick={() => { setMobileMenuOpen(false); setIsAuditLogsOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition"><ShieldCheck size={15} /> سجل العمليات</button>
            <button onClick={() => { setMobileMenuOpen(false); setIsSettingsOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition"><Settings size={15} /> الإعدادات</button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-5">
        {/* TABS - Windows 11 Pivot style */}
        <div className="flex gap-0.5 bg-secondary/60 p-0.5 rounded-lg w-full">
          {(['dashboard', 'members', 'expenses'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ${activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>
              {t === 'dashboard' ? <LayoutDashboard size={15} /> : t === 'members' ? <Users size={15} /> : <Receipt size={15} />}
              {t === 'dashboard' ? 'الرئيسية' : t === 'members' ? 'الأعضاء' : 'المصروفات'}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3 sm:space-y-5 animate-fluent-reveal">
            <NewsTicker announcements={announcements} canEdit={canEdit} onEdit={() => setIsNewsModalOpen(true)} direction={tickerDirection} duration={tickerDuration} />
            
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <StatCard title="الرصيد" value={formatCurrency(netBalance)} icon={<span className="text-lg sm:text-xl font-bold">₪</span>} trend="متوفر" />
              <StatCard title="التحصيلات" value={formatCurrency(totalIncome)} icon={<TrendingUp size={18} />} />
              <StatCard title="المصروفات" value={formatCurrency(totalExpenses_val)} icon={<TrendingDown size={18} />} />
              <StatCard title="الزوار" value={visitorLogs.length.toString()} icon={<Eye size={18} />} />
            </div>
            
            {/* Chart + Quick actions */}
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
                <button onClick={() => setIsAIChatOpen(true)} className="w-full py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm">
                  <Sparkles size={16} /> المساعد الذكي
                </button>
                <div className="flex-1 bg-secondary/50 rounded-lg p-3 border border-border overflow-hidden">
                  <h4 className="font-semibold text-foreground mb-2 text-xs">آخر 5 دفعات</h4>
                  <div className="space-y-2">
                    {recentTransactions.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">لا توجد دفعات بعد</p>}
                    {recentTransactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 shrink-0 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{tx.memberName.charAt(0)}</div>
                          <p className="text-[11px] font-medium text-foreground truncate">{tx.memberName}</p>
                        </div>
                        <span className={`text-[11px] font-bold shrink-0 dir-ltr ${tx.amount > 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
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
        {activeTab === 'members' && (
          <div className="space-y-3 sm:space-y-4 animate-fluent-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="lg:col-span-3 fluent-card overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">قائمة الأعضاء <span className="text-muted-foreground font-normal">({filteredMembers.length})</span></h2>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => setIsRemindersModalOpen(true)} className="h-8 px-2.5 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] rounded-md hover:bg-[hsl(var(--warning))]/20 transition flex items-center gap-1 text-xs font-medium"><Bell size={13} /><span className="hidden sm:inline"> تذكير</span></button>
                        <button onClick={handleExportMembersPDF} className="h-8 w-8 bg-destructive/5 text-destructive rounded-md hover:bg-destructive/10 transition flex items-center justify-center"><Printer size={14} /></button>
                        <button onClick={handleExportMembers} className="h-8 w-8 bg-[hsl(var(--success))]/5 text-[hsl(var(--success))] rounded-md hover:bg-[hsl(var(--success))]/10 transition hidden sm:flex items-center justify-center"><FileSpreadsheet size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col xs:flex-row gap-2">
                    <div className="relative flex-1"><input type="text" placeholder="بحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-8 pl-3 pr-8 bg-secondary border border-border rounded-md text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" /><Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} /></div>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="h-8 px-2.5 bg-secondary border border-border rounded-md text-xs min-w-0 focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="all">الجميع</option>
                      {Array.from(new Set(members.map(m => m.paidUntil))).sort().reverse().map((date: string) => <option key={date} value={date}>{formatDisplayDate(date)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-secondary/50 text-muted-foreground text-xs font-medium"><tr><th className="px-5 py-3">العضو</th><th className="px-5 py-3">مدفوع لغاية</th><th className="px-5 py-3">المجموع</th><th className="px-5 py-3">الحالة</th><th className="px-5 py-3 text-center">الإجراء</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {filteredMembers.map(member => {
                        const statusInfo = getMemberStatus(member.paidUntil);
                        return (
                          <tr key={member.id} onClick={() => setViewMemberHistory(member)} className="hover:bg-accent/50 transition cursor-pointer group">
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
                  {filteredMembers.map(member => {
                    const statusInfo = getMemberStatus(member.paidUntil);
                    return (
                      <div key={member.id} onClick={() => setViewMemberHistory(member)} className="p-3.5 hover:bg-accent/30 transition cursor-pointer active:bg-accent/50">
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
                    <input type="date" value={newMemberJoinDate} onChange={e => setNewMemberJoinDate(e.target.value)} className="w-full h-8 px-3 text-xs border border-border rounded-md bg-secondary text-right focus:outline-none focus:ring-1 focus:ring-ring" />
                    <div className="flex gap-1.5"><button type="submit" className="flex-1 h-8 bg-[hsl(var(--success))] text-white rounded-md text-xs font-medium hover:opacity-90 transition">حفظ</button><button type="button" onClick={() => setIsAddMemberMode(false)} className="flex-1 h-8 bg-secondary text-muted-foreground rounded-md text-xs hover:bg-accent transition">إلغاء</button></div>
                  </form>
                )) : <div className="text-center text-[11px] text-muted-foreground bg-secondary p-3 rounded-md">يجب تسجيل الدخول لإضافة أعضاء</div>}
              </div>
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-3 sm:space-y-4 animate-fluent-reveal">
            <div className="fluent-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">سجل المصروفات</h2>
                {canEdit && <button onClick={() => setIsExpenseModalOpen(true)} className="h-8 px-3 bg-destructive text-destructive-foreground rounded-md font-medium hover:bg-destructive/90 transition flex items-center gap-1.5 text-xs"><Plus size={14} /> مصروف</button>}
              </div>

              {/* Desktop table */}
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

              {/* Mobile card list */}
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

      {/* FAB - Fluent style */}
      <button onClick={() => setIsAIChatOpen(true)} className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-xl shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95">
        <Sparkles size={18} />
      </button>

      {/* MODALS */}
      <PublicInquiryModal isOpen={isPublicInquiryOpen} onClose={() => setIsPublicInquiryOpen(false)} members={members} onCheck={handlePublicCheck} />
      <AuditLogsModal isOpen={isAuditLogsOpen} onClose={() => setIsAuditLogsOpen(false)} logs={auditLogs} />
      <ManageNewsModal isOpen={isNewsModalOpen} onClose={() => setIsNewsModalOpen(false)} announcements={announcements} onAdd={handleAddAnnouncement} onDelete={handleDeleteAnnouncement} currentDirection={tickerDirection} currentDuration={tickerDuration} onSaveSettings={handleSaveTickerSettings} />
      <AIChatModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} members={members} expenses={expenses}
        onApplyUpdates={(updates) => { handleBatchPayment(updates); logAction('تحديث ذكي', 'تم تنفيذ تحديثات عبر المساعد الذكي'); }}
        onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense}
        onEditExpense={(e) => { updateExpenses((prev: Expense[]) => prev.map(ex => ex.id === e.id ? e : ex)); }}
        onDeleteAllData={handleDeleteAllData}
        onAddMember={(n, p, j) => { updateMembers((prev: Member[]) => [...prev, { id: Date.now().toString(), name: n, phone: p, joinDate: j || START_DATE, paidUntil: formatMonthStr(addMonths(parseMonthStr(j || START_DATE), -1)), totalPaid: 0, status: 'active' }]); }}
        onBatchAddMembers={(l) => { l.forEach(m => updateMembers((prev: Member[]) => [...prev, { id: Date.now().toString() + Math.random().toString().slice(2, 5), name: m.name, phone: m.phone, joinDate: m.joinDate || START_DATE, paidUntil: formatMonthStr(addMonths(parseMonthStr(m.joinDate || START_DATE), -1)), totalPaid: 0, status: 'active' }])); }}
        onDeleteMember={handleDeleteMember} onUpdateMember={handleUpdateMember} onBulkUpdateJoinDate={() => {}} isAdmin={isAdmin} userRole={userRole} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onRecalculate={handleRecalculateStatus} />
      <MonthlyReportModal isOpen={isMonthlyReportOpen} onClose={() => setIsMonthlyReportOpen(false)} members={members} isAdmin={canEdit} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} member={selectedMember} onConfirm={handleConfirmPayment} />
      <MemberHistoryModal isOpen={!!viewMemberHistory} onClose={() => setViewMemberHistory(null)} member={viewMemberHistory} transactions={payments} onDeleteTransaction={isAdmin ? handleDeleteTransaction : undefined} />
      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onAdd={handleAddExpense} />
      <WhatsAppImportModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} members={members} onConfirm={handleBatchPayment} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleUserLogin} />
      <EditMemberModal isOpen={isEditMemberModalOpen} onClose={() => setIsEditMemberModalOpen(false)} member={editingMember} onUpdate={handleUpdateMember} />
      <RemindersModal isOpen={isRemindersModalOpen} onClose={() => setIsRemindersModalOpen(false)} members={members} onMarkAsSent={handleMarkReminderSent} />
    </div>
  );
}
