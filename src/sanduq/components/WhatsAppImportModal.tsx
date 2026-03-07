import React, { useState, useEffect } from 'react';
import { Member, MONTHLY_FEE } from '../types';
import { X, MessageCircle, ArrowRight, CheckCircle, AlertCircle, ExternalLink, ClipboardPaste, SplitSquareHorizontal, User, Calendar, MousePointerClick } from 'lucide-react';
import { addMonths } from 'date-fns';
import { parseMonthStr, formatMonthStr, formatDisplayDate } from '../utils';

interface WhatsAppImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onConfirm: (payments: { memberId: string, amount: number, newPaidUntil: string }[]) => void;
}

interface DetectedPayment {
  member: Member;
  amount: number;
  isValid: boolean;
  monthsCount: number;
  newPaidUntil: string;
  isExplicitDate: boolean;
}

export const WhatsAppImportModal: React.FC<WhatsAppImportModalProps> = ({ isOpen, onClose, members, onConfirm }) => {
  const [text, setText] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [detected, setDetected] = useState<DetectedPayment[]>([]);
  const [pasteError, setPasteError] = useState('');

  useEffect(() => {
    if (isOpen) { setText(''); setDetected([]); setPasteError(''); setTargetGroup('صندوق العائلة'); }
  }, [isOpen]);

  useEffect(() => {
    if (!text.trim()) { setDetected([]); return; }
    const lines = text.split(/\n/);
    const results: DetectedPayment[] = [];
    const sortedMembers = [...members].sort((a, b) => b.name.length - a.name.length);

    lines.forEach(line => {
      if (!line.trim()) return;
      let foundMember: Member | null = null;
      for (const m of sortedMembers) { if (line.includes(m.name)) { foundMember = m; break; } }

      const dateMatch = line.match(/\b(\d{1,2})[\/\-](\d{4})\b/);
      let explicitDateStr: string | null = null;
      let matchedYear = 0;
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const year = parseInt(dateMatch[2]);
        if (month >= 1 && month <= 12 && year >= 2023 && year < 2035) {
          explicitDateStr = `${year}-${month.toString().padStart(2, '0')}`;
          matchedYear = year;
        }
      }

      const numbers = line.match(/\d+/g);
      let amount = 0;
      if (numbers) {
        const validNumbers = numbers.map(n => parseInt(n)).filter(n => { if (n === matchedYear) return false; return n >= 20 && n < 10000; });
        if (validNumbers.length > 0) amount = validNumbers.reduce((prev, current) => (current > prev ? current : prev), 0);
      }

      if (foundMember && amount > 0) {
        let newPaidUntil = foundMember.paidUntil;
        let monthsCount = 0;
        let isExplicitDate = false;

        if (explicitDateStr) {
          newPaidUntil = explicitDateStr;
          monthsCount = Math.floor(amount / MONTHLY_FEE);
          isExplicitDate = true;
        } else {
          monthsCount = Math.floor(amount / MONTHLY_FEE);
          const currentPaidDate = parseMonthStr(foundMember.paidUntil);
          if (monthsCount > 0 && !isNaN(currentPaidDate.getTime())) {
            try { newPaidUntil = formatMonthStr(addMonths(currentPaidDate, monthsCount)); } catch (e) { console.error(e); }
          }
        }
        results.push({ member: foundMember, amount, isValid: true, monthsCount, newPaidUntil, isExplicitDate });
      }
    });
    setDetected(results);
  }, [text, members]);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) { setText(prev => (prev ? prev + '\n' + clipboardText : clipboardText)); setPasteError(''); }
      else setPasteError('الحافظة فارغة');
    } catch { setPasteError('يرجى السماح بالوصول للحافظة أو اللصق يدوياً'); }
  };

  const handleConfirm = () => {
    const validPayments = detected.filter(d => d.isValid).map(d => ({ memberId: d.member.id, amount: d.amount, newPaidUntil: d.newPaidUntil }));
    if (validPayments.length > 0) { onConfirm(validPayments); onClose(); }
  };

  if (!isOpen) return null;
  const validCount = detected.filter(d => d.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-md">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-border">
        <div className="bg-[#00a884] p-4 flex justify-between items-center text-white shadow-md">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} />
            <div><h2 className="text-lg font-bold">وحدة دمج واتساب</h2><p className="text-[11px] opacity-90">تحليل المحادثات واستخراج المدفوعات والتواريخ</p></div>
          </div>
          <button onClick={onClose} className="hover:bg-[#008f6f] p-1.5 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/3 bg-card p-6 border-l border-border flex flex-col gap-6 overflow-y-auto z-10 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#00a884] font-bold border-b border-border pb-2">
                <span className="bg-[#00a884] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span><h3>تحديد المصدر</h3>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم المجموعة</label>
                <input type="text" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full p-3 bg-gray-50 border border-border rounded-xl focus:ring-2 focus:ring-[#00a884] outline-none text-sm font-bold text-foreground" placeholder="مثال: صندوق العائلة" />
              </div>
              <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2"><ExternalLink size={18} /> فتح واتساب ويب</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#00a884] font-bold border-b border-border pb-2">
                <span className="bg-[#00a884] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span><h3>جلب البيانات</h3>
              </div>
              <button onClick={handlePaste} className="w-full py-4 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-lg"><ClipboardPaste size={20} className="text-green-400" /> لصق وتحليل المحادثة</button>
              {pasteError && <p className="text-xs text-red-500 text-center font-bold bg-red-50 p-1 rounded">{pasteError}</p>}
            </div>
            <div className="mt-auto pt-4 border-t border-border">
              <label className="text-xs font-bold text-muted-foreground mb-2 block">أو الصق النص يدوياً هنا:</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: علاء كامل 100 واصل 12/2025" className="w-full h-24 p-2 bg-gray-50 border border-border rounded-lg text-xs resize-none focus:ring-1 focus:ring-[#00a884] outline-none"></textarea>
            </div>
          </div>

          <div className="flex-1 bg-gray-100 p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-end mb-4">
              <div><h3 className="text-xl font-bold text-foreground">نتائج التحليل</h3><p className="text-sm text-muted-foreground">تم العثور على <span className="font-bold text-[#00a884]">{detected.length}</span> عملية دفع محتملة.</p></div>
              <div className="bg-card px-4 py-2 rounded-xl shadow-sm border border-border"><span className="text-xs text-muted-foreground font-bold block">المجموعة المستهدفة</span><span className="text-sm font-bold text-foreground">{targetGroup}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {detected.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-gray-50/50"><SplitSquareHorizontal size={48} className="mb-4 opacity-50" /><p className="font-medium">بانتظار لصق المحادثة...</p></div>
              ) : detected.map((item, idx) => (
                <div key={idx} className={`bg-card p-4 rounded-xl border shadow-sm transition-all hover:shadow-md flex items-center justify-between ${item.isValid ? 'border-l-4 border-l-[#00a884] border-border' : 'border-l-4 border-l-red-500 border-red-50 bg-red-50/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.isValid ? <CheckCircle size={20} /> : <AlertCircle size={20} />}</div>
                    <div><h4 className="font-bold text-foreground flex items-center gap-2">{item.member.name} <span className="text-[10px] font-normal px-2 py-0.5 bg-gray-100 rounded-full text-muted-foreground flex items-center gap-1"><User size={10} /> عضو</span></h4><p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar size={10} /> واصل حالياً لغاية: {formatDisplayDate(item.member.paidUntil)}</p></div>
                  </div>
                  {item.isValid ? (
                    <div className="flex items-center gap-6">
                      <div className="text-center"><div className="text-xs text-muted-foreground font-medium mb-1">المبلغ</div><div className="font-black text-lg text-[#00a884]">{item.amount} ₪</div></div>
                      <ArrowRight size={20} className="text-gray-300" />
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1 justify-center">{item.isExplicitDate ? <span className="text-blue-600 flex items-center gap-1"><MousePointerClick size={10} /> تاريخ صريح</span> : <span>تحديث تلقائي</span>}</div>
                        <div className={`font-bold px-3 py-1 rounded-lg border text-sm ${item.isExplicitDate ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-gray-50 text-foreground border-border'}`}>{formatDisplayDate(item.newPaidUntil)}</div>
                      </div>
                    </div>
                  ) : <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg">لم يتم التعرف على المبلغ</span>}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <button onClick={handleConfirm} disabled={validCount === 0} className={`w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3 shadow-lg ${validCount > 0 ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' : 'bg-gray-200 text-muted-foreground cursor-not-allowed'}`}><CheckCircle size={24} /> اعتماد وتحديث ({validCount}) عضو</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
