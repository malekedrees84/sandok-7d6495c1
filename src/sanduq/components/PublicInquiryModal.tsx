import React, { useState } from 'react';
import { Member, MONTHLY_FEE } from '../types';
import { parseMonthStr, formatDisplayDate } from '../utils';
import { differenceInMonths } from 'date-fns';
import { X, Search, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react';

interface PublicInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onCheck: (phone: string) => void;
}

export const PublicInquiryModal: React.FC<PublicInquiryModalProps> = ({ isOpen, onClose, members, onCheck }) => {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<Member | null>(null);
  const [status, setStatus] = useState<{ monthsDue: number, amountDue: number, isPaid: boolean } | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null); setStatus(null);
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 9) { setError('الرجاء إدخال رقم هاتف صحيح'); return; }

    const member = members.find(m => {
      const mPhone = (m.phone || '').replace(/\D/g, '');
      return mPhone.includes(cleanPhone) || cleanPhone.includes(mPhone);
    });

    if (member) {
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const paidUntilDate = parseMonthStr(member.paidUntil);
      let monthsDue = 0;
      if (!isNaN(paidUntilDate.getTime())) monthsDue = differenceInMonths(currentMonthStart, paidUntilDate);
      const isPaid = monthsDue <= 0;
      const amountDue = isPaid ? 0 : monthsDue * MONTHLY_FEE;
      setResult(member);
      setStatus({ monthsDue: Math.max(0, monthsDue), amountDue, isPaid });
      onCheck(phone);
    } else {
      setError('لم يتم العثور على عضو بهذا الرقم. تأكد من الرقم أو راجع المشرف.');
    }
  };

  const handleClose = () => { setPhone(''); setResult(null); setError(''); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white text-center relative">
          <button onClick={handleClose} className="absolute top-4 right-4 bg-white/20 p-1 rounded-full hover:bg-white/30 transition"><X size={20} /></button>
          <h2 className="text-2xl font-bold mb-2">فحص حالة الاشتراك</h2>
          <p className="text-blue-100 text-sm">أدخل رقم هاتفك لمعرفة المبلغ المستحق</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف (مثال: 050...)"
              className="w-full p-4 pl-12 border-2 border-border rounded-xl text-lg font-bold text-foreground focus:border-blue-500 focus:ring-0 outline-none transition text-center dir-ltr" autoFocus />
            <button type="submit" className="absolute left-2 top-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"><Search size={24} /></button>
          </form>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold text-sm mb-4 border border-red-100 flex items-center justify-center gap-2"><AlertTriangle size={18} />{error}</div>}
          {result && status && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-border animate-fade-in">
              <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg"><User size={24} /></div>
                <div><p className="text-xs text-muted-foreground">أهلاً بك</p><h3 className="text-lg font-bold text-foreground">{result.name}</h3></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-card p-3 rounded-xl border border-border shadow-sm">
                  <span className="text-muted-foreground text-sm flex items-center gap-2"><Calendar size={16} /> مدفوع لغاية</span>
                  <span className="font-bold text-foreground dir-ltr">{formatDisplayDate(result.paidUntil)}</span>
                </div>
                {status.isPaid ? (
                  <div className="bg-green-100 text-green-800 p-4 rounded-xl flex items-center justify-center gap-2 font-bold border border-green-200"><CheckCircle size={24} /> وضعك خالص وممتاز!</div>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-center text-red-800 font-bold mb-3 flex items-center justify-center gap-2"><AlertTriangle size={18} /> مستحق للدفع</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-card p-2 rounded-lg text-center border border-red-100"><span className="block text-xs text-muted-foreground">عدد الأشهر</span><span className="block text-xl font-black text-red-600">{status.monthsDue}</span></div>
                      <div className="flex-1 bg-card p-2 rounded-lg text-center border border-red-100"><span className="block text-xs text-muted-foreground">المبلغ المطلوب</span><span className="block text-xl font-black text-red-600">{status.amountDue} ₪</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
