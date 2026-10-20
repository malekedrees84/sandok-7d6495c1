import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Save, Database, ExternalLink, RefreshCw, Lock, Download, UploadCloud, Calculator, PenTool, Loader2 } from 'lucide-react';
import { getScriptUrl, setScriptUrl } from '../services/api';
import { downloadJSON, readJSONFile } from '../utils';
import { Member, PaymentTransaction, Expense } from '../types';
import { db } from '../services/db';
import { LocalSnapshotsSection } from './LocalSnapshotsSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecalculate?: () => void;
  members: Member[];
  payments: PaymentTransaction[];
  expenses: Expense[];
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onRecalculate, members, payments, expenses, onDataRestored }) => {
  const [url, setUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) { setUrl(getScriptUrl()); setIsSaved(false); }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setScriptUrl(url);
    setIsSaved(true);
    setTimeout(() => { setIsSaved(false); window.location.reload(); }, 1500);
  };

  const handleCreateBackup = () => {
    downloadJSON({ version: "1.0", exportDate: new Date().toISOString(), members, payments, expenses }, "sanduq_backup");
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("تحذير: سيتم استبدال البيانات الحالية بالكامل. هل أنت متأكد؟")) {
      if (backupInputRef.current) backupInputRef.current.value = '';
      return;
    }
    setIsRestoring(true);
    try {
      const data = await readJSONFile(file);
      
      // Delete all existing data first
      await Promise.all([
        db.deleteAllPayments(),
        db.deleteAllExpenses(),
        db.deleteAllAuditLogs(),
        db.deleteAllVisitorLogs(),
        db.deleteAllAnnouncements(),
        db.deleteAllMembers(),
      ]);

      // Insert members
      if (data.members && Array.isArray(data.members)) {
        for (const m of data.members) {
          await db.upsertMember({
            id: m.id,
            name: m.name,
            phone: m.phone || '',
            joinDate: m.joinDate,
            paidUntil: m.paidUntil,
            totalPaid: m.totalPaid || 0,
            status: m.status || 'active',
            lastReminderDate: m.lastReminderDate,
            profileImage: m.profileImage,
          });
        }
      }

      // Insert payments
      if (data.payments && Array.isArray(data.payments)) {
        for (const p of data.payments) {
          await db.insertPayment({
            id: p.id,
            memberId: p.memberId,
            amount: p.amount,
            date: p.date,
            monthsCovered: p.monthsCovered || 1,
            previousPaidUntil: p.previousPaidUntil || '',
            newPaidUntil: p.newPaidUntil || '',
          });
        }
      }

      // Insert expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const exp of data.expenses) {
          await db.insertExpense({
            id: exp.id,
            title: exp.title,
            category: exp.category || '',
            amount: exp.amount,
            date: exp.date,
            notes: exp.notes,
          });
        }
      }

      alert("تم استعادة النسخة الاحتياطية بنجاح! ✅");
      onDataRestored();
    } catch (err) {
      console.error('Restore error:', err);
      alert("حدث خطأ أثناء استعادة النسخة الاحتياطية.");
    }
    setIsRestoring(false);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2"><Settings size={20} /><h2 className="text-lg font-bold">إعدادات النظام والربط</h2></div>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <section className="bg-gray-50 border border-border p-4 rounded-xl space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-foreground"><Database size={18} /> النسخ الاحتياطي والاستعادة</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCreateBackup} className="flex flex-col items-center justify-center gap-2 p-3 bg-card border border-border rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition"><Download size={20} /><span className="text-xs font-bold">تنزيل نسخة</span></button>
              <button onClick={() => !isRestoring && backupInputRef.current?.click()} disabled={isRestoring} className="flex flex-col items-center justify-center gap-2 p-3 bg-card border border-border rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition disabled:opacity-50">
                {isRestoring ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                <span className="text-xs font-bold">{isRestoring ? 'جاري الاستعادة...' : 'استعادة بيانات'}</span>
                <input type="file" ref={backupInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />
              </button>
            </div>
          </section>
          <LocalSnapshotsSection onRestored={onDataRestored} />
          <hr className="border-border" />
          <section>
            <div className="mb-4 bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h3 className="flex items-center gap-2 font-bold text-blue-800 mb-2"><ExternalLink size={18} /> ربط قاعدة البيانات</h3>
              <p className="text-sm text-blue-700">ألصق رابط Google Apps Script (Web App URL) هنا.</p>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <textarea value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left text-sm font-mono h-24 break-all" dir="ltr" />
              <div className="bg-red-50 border-2 border-red-100 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-red-800 font-bold border-b border-red-200 pb-2"><Lock size={18} /><span>حل مشكلة طلب تسجيل الدخول</span></div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-foreground font-medium bg-card p-3 rounded-lg border border-red-100">
                  <li>تأكد من أن <b>Execute as</b> هو <span className="text-blue-600">Me</span>.</li>
                  <li>تأكد من أن <b>Who has access</b> هو <span className="bg-red-100 text-red-700 px-1 rounded font-bold">Anyone</span>.</li>
                </ol>
              </div>
              <button type="submit" className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-white ${isSaved ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-900'}`}>
                {isSaved ? <><RefreshCw size={18} className="animate-spin" /> تم الحفظ - جاري التحديث...</> : <><Save size={18} /> حفظ وتحديث الاتصال</>}
              </button>
            </form>
          </section>
          <hr className="border-border" />
          {onRecalculate && (
            <section className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
              <h3 className="flex items-center gap-2 font-bold text-orange-800 mb-2"><PenTool size={18} /> أدوات الصيانة</h3>
              <button onClick={onRecalculate} className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"><Calculator size={16} /> إصلاح وإعادة احتساب التواريخ</button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
