import React, { useState, useEffect } from 'react';
import { Member, MONTHLY_FEE, TREASURY_HOLDERS } from '../types';
import { formatDisplayDate, parseMonthStr, formatMonthStr } from '../utils';
import { addMonths } from 'date-fns';
import { X, Calendar, CheckCircle, MessageCircle, AlertTriangle, Vault } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onConfirm: (amount: number, newPaidUntil: string, treasuryHolder: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, member, onConfirm }) => {
  const [amount, setAmount] = useState<number | string>('');
  const [months, setMonths] = useState<number>(0);
  const [previewDate, setPreviewDate] = useState<string>('');
  const [selectedHolder, setSelectedHolder] = useState<string>(TREASURY_HOLDERS[0]);

  useEffect(() => {
    if (isOpen) { setAmount(''); setMonths(0); setPreviewDate(''); setSelectedHolder(TREASURY_HOLDERS[0]); }
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const numAmount = parseInt(val);
    if (!isNaN(numAmount) && numAmount !== 0) {
      const calculatedMonths = Math.floor(numAmount / MONTHLY_FEE);
      setMonths(calculatedMonths);
      const currentPaidDate = parseMonthStr(member.paidUntil);
      if (!isNaN(currentPaidDate.getTime())) {
        try {
          const newDate = addMonths(currentPaidDate, calculatedMonths);
          setPreviewDate(formatMonthStr(newDate));
        } catch (e) { console.error(e); }
      }
    } else { setMonths(0); setPreviewDate(''); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (months !== 0 && previewDate) onConfirm(Number(amount), previewDate, selectedHolder);
  };

  const getWhatsAppLink = () => {
    if (months === 0 || !previewDate) return '#';
    const isDeduction = months < 0;
    const text = isDeduction
      ? `*تعديل رصيد - صندوق العائلة* ⚠️\n\nمرحباً *${member.name}* 👋\nتم إجراء تعديل على سجل اشتراكاتكم.\n\n📉 *المبلغ المخصوم:* ${Math.abs(Number(amount))} ₪\n📅 *تعديل الفترة:* ${Math.abs(months)} أشهر\nℹ️ *الوضع الحالي:* مدفوع لغاية *${formatDisplayDate(previewDate)}*\n`
      : `*إيصال دفع - صندوق العائلة* 🏠✨\n\nمرحباً *${member.name}* 👋\nبارك الله فيك، تم استلام اشتراكك بنجاح.\n\n💰 *المبلغ:* ${amount} ₪\n📅 *الفترة:* ${months} أشهر\n✅ *مدفوع لغاية:* ${formatDisplayDate(previewDate)}\n\nشكراً لالتزامك ودعمك للصندوق! 🌹`;
    const encodedText = encodeURIComponent(text);
    const phoneStr = member.phone || '';
    let phone = phoneStr.replace(/\D/g, ''); 
    if (phone.startsWith('0')) phone = '972' + phone.substring(1); 
    return phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
  };

  const isDeduction = months < 0;

  const holderColors: Record<string, string> = {
    'مالك': 'border-primary bg-primary/5 text-primary',
    'معين': 'border-[hsl(175,70%,41%)] bg-[hsl(175,70%,41%)]/5 text-[hsl(175,70%,41%)]',
    'مؤيد': 'border-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)]/5 text-[hsl(38,92%,50%)]',
  };

  const holderActiveColors: Record<string, string> = {
    'مالك': 'border-primary bg-primary text-white',
    'معين': 'border-[hsl(175,70%,41%)] bg-[hsl(175,70%,41%)] text-white',
    'مؤيد': 'border-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)] text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className={`${isDeduction ? 'bg-destructive' : 'bg-primary'} p-4 flex justify-between items-center text-primary-foreground sticky top-0 z-10`}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            {isDeduction ? <AlertTriangle size={20} /> : <Calendar size={20} />}
            {isDeduction ? 'تسجيل خصم / تصحيح' : 'تسجيل دفعة جديدة'}
          </h2>
          <button onClick={onClose} type="button" className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-600 mb-1">العضو</p>
            <p className="font-bold text-foreground text-lg">{member.name}</p>
            <p className="text-xs text-muted-foreground mt-1">واصل لغاية: {formatDisplayDate(member.paidUntil)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {isDeduction ? 'المبلغ المراد خصمه (بالسالب)' : 'المبلغ المدفوع (شاقل)'}
            </label>
            <div className="relative">
              <input type="number" value={amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="مثال: 200 أو -50"
                className={`w-full p-4 text-2xl font-bold text-center border-2 rounded-xl outline-none transition ${isDeduction ? 'border-red-200 focus:border-red-500 text-red-600' : 'border-border focus:border-primary text-foreground'}`}
                autoFocus required step={MONTHLY_FEE} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₪</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">* يمكنك إدخال قيمة سالبة (مثال: -50) لتصحيح خطأ أو إلغاء شهر.</p>
          </div>

          {/* Treasury Holder Selection */}
          {!isDeduction && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-2">
                <Vault size={14} /> الخزينة المستلمة
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TREASURY_HOLDERS.map(h => (
                  <button key={h} type="button" onClick={() => setSelectedHolder(h)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${selectedHolder === h ? holderActiveColors[h] : holderColors[h]} hover:scale-[1.03]`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {months !== 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${isDeduction ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <span className={isDeduction ? 'text-red-700 font-medium' : 'text-green-700 font-medium'}>{isDeduction ? 'أشهر مخصومة' : 'عدد الأشهر'}</span>
                <span className={`font-bold text-lg dir-ltr ${isDeduction ? 'text-red-800' : 'text-green-800'}`}>{Math.abs(months)}</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${isDeduction ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <span className={isDeduction ? 'text-red-700 font-medium' : 'text-green-700 font-medium'}>{isDeduction ? 'يتراجع التاريخ إلى' : 'يصبح مدفوع لغاية'}</span>
                <span className={`font-bold text-lg ${isDeduction ? 'text-red-800' : 'text-green-800'}`}>{formatDisplayDate(previewDate)}</span>
              </div>
              <a href={getWhatsAppLink()} target="_blank" rel="noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-bold transition shadow-sm ${isDeduction ? 'bg-gray-700 hover:bg-gray-800 text-white' : 'bg-[#25D366] hover:bg-[#128C7E] text-white'}`}>
                <MessageCircle size={16} />
                {isDeduction ? 'تجهيز رسالة تنبيه بالتصحيح' : 'تجهيز رسالة إيصال واتساب'}
              </a>
            </div>
          )}
          <button type="submit" disabled={months === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg
              ${months !== 0 ? (isDeduction ? 'bg-destructive text-destructive-foreground hover:opacity-90' : 'bg-primary text-primary-foreground hover:opacity-90') : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
            <CheckCircle size={24} />
            {isDeduction ? 'تأكيد الخصم' : 'تأكيد الدفع'}
          </button>
        </form>
      </div>
    </div>
  );
};
