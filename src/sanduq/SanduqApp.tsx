import React, { useState, useEffect, useRef } from 'react';
import { Users, DollarSign, Search, Plus, Wallet, TrendingUp, TrendingDown, Lock, Unlock, FileSpreadsheet, LayoutDashboard, Receipt, Sparkles, Settings, Share2, FileBarChart, Edit, X as XIcon, Eye, ShieldCheck, UserCheck, Bell, Printer, Camera } from 'lucide-react';
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
    if (category.includes('فرح')) return 'bg-pink-100 text-pink-700';
    if (category.includes('عزاء')) return 'bg-gray-100 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  const handleExportFinancialsPDF = () => {
    const data = chartData;
    const headers = ["الشهر", "التحصيلات", "المصروفات", "الصافي"];
    const rows = data.map(d => [d.name, formatCurrency(d.income), formatCurrency(d.expense), formatCurrency(d.income - d.expense)]);
    generatePDF("التقرير المالي - آخر 6 أشهر", headers, rows);
  };

  if (showSplash) return <SplashScreen onEnter={() => setShowSplash(false)} />;

  return (
    <div className="min-h-screen font-sans text-foreground pb-10 relative transition-colors duration-300 bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-lg"><Wallet size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-none">صندوق العائلة</h1>
              <div className="flex items-center gap-1 mt-1">
                <span className="relative flex h-2 w-2">
                  {isSaving && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isSaving ? 'bg-yellow-500' : isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <p className="text-xs text-muted-foreground font-medium">{isSaving ? 'جاري المزامنة...' : isOnline ? 'متصل' : 'بدون نت'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsPublicInquiryOpen(true)} className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full transition flex items-center gap-2 px-3 hover:shadow-md animate-pulse" title="افحص اشتراكك"><UserCheck size={18} /><span className="hidden md:inline text-xs font-bold">افحص حالتك</span></button>
            <button onClick={() => { if (navigator.share) navigator.share({ title: 'صندوق العائلة', url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط'); } }} className="p-2 text-primary bg-primary-50 hover:bg-primary-100 rounded-full transition"><Share2 size={20} /></button>
            {isAdmin && (
              <>
                <button onClick={() => setIsAuditLogsOpen(true)} className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded-full transition"><ShieldCheck size={20} /></button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-full transition"><Settings size={20} /></button>
              </>
            )}
            <button onClick={() => isLoggedIn ? handleUserLogout() : setIsLoginModalOpen(true)} className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-full text-sm font-medium transition ${isLoggedIn ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'}`}>
              {isLoggedIn ? <><Unlock size={16} /><span className="hidden md:inline">خروج</span></> : <><Lock size={16} /><span className="hidden md:inline">دخول</span></>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto">
          {(['dashboard', 'members', 'expenses'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === t ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'dashboard' ? <LayoutDashboard size={18} /> : t === 'members' ? <Users size={18} /> : <Receipt size={18} />}
              {t === 'dashboard' ? 'الرئيسية' : t === 'members' ? 'الأعضاء' : 'المصروفات'}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <NewsTicker announcements={announcements} canEdit={canEdit} onEdit={() => setIsNewsModalOpen(true)} direction={tickerDirection} duration={tickerDuration} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="الرصيد" value={formatCurrency(netBalance)} icon={<span className="text-2xl font-bold">₪</span>} colorClass="bg-gradient-to-br from-emerald-50 to-white border-emerald-100" trend="متوفر" />
              <StatCard title="التحصيلات" value={formatCurrency(totalIncome)} icon={<TrendingUp size={24} />} />
              <StatCard title="المصروفات" value={formatCurrency(totalExpenses_val)} icon={<TrendingDown size={24} />} colorClass="bg-red-50 border-red-100" />
              <StatCard title="الزوار" value={visitorLogs.length.toString()} icon={<Eye size={24} />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card p-6 rounded-2xl shadow-sm border border-border">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-foreground">التقرير المالي</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setIsMonthlyReportOpen(true)} className="text-sm text-primary hover:bg-primary-50 px-3 py-1 rounded-lg flex items-center gap-1 transition"><FileBarChart size={16} /> جدول</button>
                    {canEdit && <button onClick={handleExportFinancialsPDF} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg flex items-center gap-1 transition"><Printer size={16} /> PDF</button>}
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
                      <Tooltip cursor={{ fill: '#f0f9ff' }} contentStyle={{ borderRadius: '8px' }} />
                      <Bar dataKey="income" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
                <h3 className="font-bold text-foreground">إجراءات سريعة</h3>
                <button onClick={() => setIsAIChatOpen(true)} className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 text-sm font-bold"><Sparkles size={22} className="text-yellow-300" /> المساعد الذكي</button>
                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-border overflow-hidden">
                  <h4 className="font-bold text-foreground mb-3 text-sm">آخر 5 دفعات</h4>
                  <div className="space-y-3">
                    {recentTransactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.memberName.charAt(0)}</div>
                          <p className="text-xs font-bold text-foreground truncate w-24">{tx.memberName}</p>
                        </div>
                        <span className={`text-xs font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'} dir-ltr`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {canEdit ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsWhatsAppModalOpen(true)} className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition flex flex-col items-center justify-center gap-1 text-[10px] font-bold">واتساب</button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition flex flex-col items-center justify-center gap-1 text-[10px] font-bold"><Receipt size={18} /> مصروف</button>
                  </div>
                ) : <div className="text-center text-[10px] text-muted-foreground py-2 bg-gray-50 rounded-lg border border-dashed"><Lock size={12} className="mx-auto mb-1 opacity-50" /> يجب تسجيل الدخول</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div><h2 className="text-xl font-bold text-foreground">قائمة الأعضاء</h2></div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {canEdit && (
                      <>
                        <button onClick={() => setIsRemindersModalOpen(true)} className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-1 text-sm font-medium"><Bell size={16} /> تذكير</button>
                        <button onClick={handleExportMembersPDF} className="bg-red-50 text-red-700 p-2 rounded-lg hover:bg-red-100 transition"><Printer size={20} /></button>
                        <button onClick={handleExportMembers} className="bg-green-50 text-green-700 p-2 rounded-lg hover:bg-green-100 transition"><FileSpreadsheet size={20} /></button>
                      </>
                    )}
                    <div className="flex gap-2">
                      <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="pl-8 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm appearance-none">
                        <option value="all">عرض الجميع</option>
                        {Array.from(new Set(members.map(m => m.paidUntil))).sort().reverse().map((date: string) => <option key={date} value={date}>مدفوع: {formatDisplayDate(date)}</option>)}
                      </select>
                      <div className="relative"><input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-10 py-2 bg-gray-50 border border-border rounded-lg text-sm" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /></div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 text-muted-foreground text-sm font-semibold"><tr><th className="px-6 py-4">العضو</th><th className="px-6 py-4">مدفوع لغاية</th><th className="px-6 py-4">المجموع</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4 text-center">الإجراء</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterMonth === 'all' || m.paidUntil === filterMonth)).map(member => {
                        const statusInfo = getMemberStatus(member.paidUntil);
                        return (
                          <tr key={member.id} onClick={() => setViewMemberHistory(member)} className="hover:bg-blue-50/50 transition cursor-pointer group">
                            <td className="px-6 py-4"><div className="font-bold text-foreground flex items-center gap-3">{member.profileImage ? <img src={member.profileImage} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">{member.name.charAt(0)}</div>}<div><div>{member.name}</div><div className="text-[10px] text-muted-foreground font-normal">{member.phone}</div></div>{canEdit && <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setIsEditMemberModalOpen(true); }} className="text-gray-300 hover:text-blue-500 p-1 mr-2"><Edit size={14} /></button>}</div></td>
                            <td className="px-6 py-4"><span className="font-mono font-medium text-foreground bg-gray-100 px-2 py-1 rounded text-sm">{formatDisplayDate(String(member.paidUntil))}</span></td>
                            <td className="px-6 py-4"><span className="font-bold text-foreground">{formatCurrency(member.totalPaid)}</span></td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</span></td>
                            <td className="px-6 py-4 flex justify-center">{canEdit && <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setIsPaymentModalOpen(true); }} className="bg-primary-50 text-primary-600 hover:bg-primary hover:text-primary-foreground p-2 rounded-lg transition"><DollarSign size={18} /></button>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border h-fit">
                <div className="text-center mb-4"><div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3"><Users size={24} /></div><h3 className="font-bold text-foreground">إضافة عضو</h3></div>
                {canEdit ? (!isAddMemberMode ? <button onClick={() => setIsAddMemberMode(true)} className="w-full py-2 bg-primary text-primary-foreground rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm hover:opacity-90"><Plus size={18} /> عضو جديد</button> : (
                  <form onSubmit={handleAddMember} className="space-y-3 animate-fade-in">
                    <div className="flex justify-center mb-2"><div className="w-16 h-16 rounded-full bg-gray-50 border border-border flex items-center justify-center cursor-pointer hover:bg-gray-100 transition overflow-hidden" onClick={() => fileInputRef.current?.click()}>{newMemberImage ? <img src={newMemberImage} className="w-full h-full object-cover" /> : <Camera size={20} className="text-muted-foreground" />}</div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setNewMemberImage(await compressImage(f)); }} /></div>
                    <input type="text" placeholder="الاسم" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="w-full p-2 text-sm border border-border rounded-lg" autoFocus />
                    <input type="date" value={newMemberJoinDate} onChange={e => setNewMemberJoinDate(e.target.value)} className="w-full p-2 text-sm border border-border rounded-lg text-right" />
                    <div className="flex gap-2"><button type="submit" className="flex-1 py-1 bg-green-600 text-white rounded-lg text-sm">حفظ</button><button type="button" onClick={() => setIsAddMemberMode(false)} className="flex-1 py-1 bg-gray-100 text-muted-foreground rounded-lg text-sm">إلغاء</button></div>
                  </form>
                )) : <div className="text-center text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">يجب تسجيل الدخول لإضافة أعضاء</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card rounded-2xl shadow-sm border border-border">
              <div className="p-6 border-b border-border flex items-center justify-between"><h2 className="text-xl font-bold text-foreground">سجل المصروفات</h2>{canEdit && <button onClick={() => setIsExpenseModalOpen(true)} className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl font-medium hover:opacity-90 transition flex items-center gap-2"><Plus size={18} /> إضافة مصروف</button>}</div>
              <div className="overflow-x-auto"><table className="w-full text-right"><thead className="bg-gray-50 text-muted-foreground text-sm font-semibold"><tr><th className="px-6 py-4">البند</th><th className="px-6 py-4">التصنيف</th><th className="px-6 py-4">التاريخ</th><th className="px-6 py-4">القيمة</th><th className="px-6 py-4">ملاحظات</th>{isAdmin && <th className="px-6 py-4"></th>}</tr></thead><tbody className="divide-y divide-border">{expenses.length > 0 ? expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-red-50/30 transition"><td className="px-6 py-4 font-bold text-foreground">{expense.title}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryStyle(expense.category)}`}>{expense.category}</span></td><td className="px-6 py-4 text-sm text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</td><td className="px-6 py-4 text-red-600 font-bold">{formatCurrency(expense.amount)}</td><td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-xs">{expense.notes || '-'}</td>{isAdmin && <td className="px-6 py-4"><button onClick={() => handleDeleteExpense(expense.id)} className="text-red-400 hover:text-red-600"><XIcon size={16} /></button></td>}</tr>
              )) : <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">لا توجد مصروفات مسجلة</td></tr>}</tbody></table></div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 text-center"><p className="text-xs text-muted-foreground font-medium">تم إنشاء هذا البرنامج بواسطة مالك إدريس</p></footer>

      <button onClick={() => setIsAIChatOpen(true)} className="fixed bottom-6 left-6 z-40 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-2xl transition hover:scale-110"><Sparkles size={24} className="text-yellow-300" /></button>

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
