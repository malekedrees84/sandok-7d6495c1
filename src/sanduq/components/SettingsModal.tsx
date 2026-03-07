import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Save, Database, ExternalLink, RefreshCw, Lock, Download, UploadCloud, Calculator, PenTool } from 'lucide-react';
import { getScriptUrl, setScriptUrl } from '../services/api';
import { downloadJSON, readJSONFile } from '../utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecalculate?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onRecalculate }) => {
  const [url, setUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
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
    const members = JSON.parse(localStorage.getItem('sanduq_members_clean_v1') || '[]');
    const payments = JSON.parse(localStorage.getItem('sanduq_payments_clean_v1') || '[]');
    const expenses = JSON.parse(localStorage.getItem('sanduq_expenses_clean_v1') || '[]');
    downloadJSON({ version: "1.0", exportDate: new Date().toISOString(), members, payments, expenses }, "sanduq_backup");
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("تحذير: سيتم استبدال البيانات الحالية. هل أنت متأكد؟")) { if (backupInputRef.current) backupInputRef.current.value = ''; return; }
    try {
      const data = await readJSONFile(file);
      if (data.members) localStorage.setItem('sanduq_members_clean_v1', JSON.stringify(data.members));
      if (data.payments) localStorage.setItem('sanduq_payments_clean_v1', JSON.stringify(data.payments));
      if (data.expenses) localStorage.setItem('sanduq_expenses_clean_v1', JSON.stringify(data.expenses));
      localStorage.setItem('sanduq_pending_sync', JSON.stringify({ members: true, payments: true, expenses: true }));
      alert("تم استعادة النسخة الاحتياطية بنجاح!");
      window.location.reload();
    } catch { alert("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية."); }
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
              <button onClick={() => backupInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-card border border-border rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition">
                <UploadCloud size={20} /><span className="text-xs font-bold">استعادة بيانات</span>
                <input type="file" ref={backupInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />
              </button>
            </div>
          </section>
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
