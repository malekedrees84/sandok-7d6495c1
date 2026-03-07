import React from 'react';
import { Member, MONTHLY_FEE } from '../types';
import { formatDisplayDate, parseMonthStr } from '../utils';
import { differenceInMonths, format, isSameMonth } from 'date-fns';
import { X, MessageCircle, Bell, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onMarkAsSent: (memberId: string) => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose, members, onMarkAsSent }) => {
  if (!isOpen) return null;

  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const lateMembers = members.filter(m => {
    const paidUntilDate = parseMonthStr(m.paidUntil);
    if (isNaN(paidUntilDate.getTime())) return false;
    return differenceInMonths(currentMonthStart, paidUntilDate) > 2;
  }).map(m => {
    const paidUntilDate = parseMonthStr(m.paidUntil);
    const monthsLate = differenceInMonths(currentMonthStart, paidUntilDate);
    const amountDue = monthsLate * MONTHLY_FEE;
    return { ...m, monthsLate, amountDue };
  });

  const getReminderLink = (member: Member & { monthsLate: number, amountDue: number }) => {
    const text = `*تذكير دوري - صندوق العائلة* 🏠✨\n\nمرحباً *${member.name}* 🌹\n\nنود إعلامكم بوجود مستحقات متأخرة.\n📅 آخر شهر مدفوع: *${formatDisplayDate(member.paidUntil)}*\n⏳ فترة التأخير: *${member.monthsLate} أشهر*\n💰 المبلغ المستحق: *${member.amountDue} ₪*\n\nنشكر لكم حسن تعاونكم. 🙏`;
    const encodedText = encodeURIComponent(text);
    const phoneStr = member.phone || '';
    let phone = phoneStr.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '972' + phone.substring(1);
    return phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
  };

  const handleSendClick = (memberId: string, link: string) => {
    window.open(link, '_blank');
    onMarkAsSent(memberId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-orange-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2"><Bell size={20} /> تذكيرات المتأخرين (أكثر من شهرين)</h2>
          <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2 text-orange-800 text-sm">
          <AlertTriangle size={16} />
          <span>عدد الأعضاء المتأخرين: <b>{lateMembers.length}</b></span>
        </div>
        <div className="overflow-auto flex-1 p-4 space-y-3">
          {lateMembers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
              <p>ممتاز! لا يوجد أعضاء متأخرين لأكثر من شهرين.</p>
            </div>
          ) : (
            lateMembers.map(member => {
              const lastReminder = member.lastReminderDate ? new Date(member.lastReminderDate) : null;
              const isSentThisMonth = lastReminder && isSameMonth(lastReminder, today);
              return (
                <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm hover:shadow-md transition">
                  <div className="text-center sm:text-right flex-1">
                    <h3 className="font-bold text-foreground">{member.name}</h3>
                    <p className="text-xs text-muted-foreground">واصل لغاية: <span className="font-medium text-orange-600">{formatDisplayDate(member.paidUntil)}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">المستحق: {member.amountDue} ₪ ({member.monthsLate} أشهر)</p>
                    {lastReminder && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 sm:justify-start justify-center"><Clock size={10} /> آخر تذكير: {format(lastReminder, 'dd/MM/yyyy')}</p>}
                  </div>
                  <button onClick={() => handleSendClick(member.id, getReminderLink(member))}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition w-full sm:w-auto ${isSentThisMonth ? 'bg-gray-100 text-muted-foreground hover:bg-gray-200' : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200'}`}>
                    {isSentThisMonth ? <><CheckCircle size={18} /> تم الإرسال مؤخراً</> : <><MessageCircle size={18} /> إرسال تذكير</>}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-border text-center text-xs text-muted-foreground">
          اضغط على "إرسال تذكير" لفتح واتساب مباشرة، وسيتم تسجيل تاريخ الإرسال تلقائياً.
        </div>
      </div>
    </div>
  );
};
