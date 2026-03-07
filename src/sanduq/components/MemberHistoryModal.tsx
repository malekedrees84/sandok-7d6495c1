import React, { useState } from 'react';
import { Member, PaymentTransaction, START_DATE, MONTHLY_FEE } from '../types';
import { formatDisplayDate, formatCurrency, generateMonthRange, isMonthCovered, parseMonthStr, formatMonthStr } from '../utils';
import { X, Calendar, History, Grid3X3, List, Check, AlertCircle, Ban, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MemberHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  transactions: PaymentTransaction[];
  onDeleteTransaction?: (id: string) => void;
}

export const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({ isOpen, onClose, member, transactions, onDeleteTransaction }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!isOpen || !member) return null;

  const history = transactions.filter(t => t.memberId === member.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const today = new Date();
  const futureBuffer = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  const allMonths = generateMonthRange(START_DATE, futureBuffer);

  const joinDate = member.joinDate ? new Date(member.joinDate) : parseMonthStr(START_DATE);
  const joinMonthStr = formatMonthStr(joinDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-gray-700 p-2 rounded-full"><History size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">سجل اشتراكات العضو</h2>
              <p className="text-xs text-gray-300">{member.name} | انضم: {format(new Date(member.joinDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-4 bg-gray-50 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-3 rounded-xl border border-blue-100 shadow-sm">
              <p className="text-xs text-blue-600 mb-1">إجمالي ما دفعه</p>
              <p className="text-xl font-bold text-blue-800">{formatCurrency(member.totalPaid)}</p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-green-100 shadow-sm">
              <p className="text-xs text-green-600 mb-1">واصل لغاية شهر</p>
              <p className="text-lg font-bold text-green-800">{formatDisplayDate(member.paidUntil)}</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-border px-4">
          <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${viewMode === 'grid' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Grid3X3 size={16} /> جدول الأشهر
          </button>
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${viewMode === 'list' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <List size={16} /> سجل الوصولات
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-card">
          {viewMode === 'grid' && (
            <div className="animate-fade-in">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4 text-xs text-yellow-800 flex items-center gap-2">
                <AlertCircle size={14} />
                بداية الصندوق: {format(new Date(START_DATE), 'dd/MM/yyyy')} | القسط الشهري: {MONTHLY_FEE} شاقل
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allMonths.map(monthStr => {
                  const isPaid = isMonthCovered(monthStr, member.paidUntil);
                  const isBeforeJoining = monthStr < joinMonthStr;
                  let cardClass = "bg-card border-border text-muted-foreground";
                  let content = null;

                  if (isBeforeJoining) {
                    cardClass = "bg-gray-100 border-gray-100 text-gray-300 opacity-60";
                    content = <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-1"><Ban size={12} /><span>غير مشترك</span></div>;
                  } else if (isPaid) {
                    cardClass = "bg-green-50 border-green-200 text-green-800 shadow-sm";
                    content = <div className="flex items-center gap-1 text-green-600 font-bold text-sm"><Check size={14} /><span>مدفوع</span></div>;
                  } else {
                    cardClass = "bg-card border-border text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition";
                    content = <div className="flex items-center gap-1 text-red-400 font-bold text-xs mt-1"><span>غير مدفوع</span></div>;
                  }
                  
                  return (
                    <div key={monthStr} className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${cardClass}`}>
                      <span className="text-xs font-medium">{formatDisplayDate(monthStr)}</span>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-3 animate-fade-in">
              {history.length > 0 ? history.map(tx => (
                <div key={tx.id} className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition flex justify-between items-center group">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg text-muted-foreground"><Calendar size={18} /></div>
                    <div>
                      <p className="font-bold text-foreground">دفع عن {tx.monthsCovered} أشهر</p>
                      <p className="text-xs text-muted-foreground mt-1">تاريخ الوصل: {format(new Date(tx.date), 'dd MMMM yyyy', { locale: ar })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-bold text-primary text-lg">{formatCurrency(tx.amount)}</p>
                      <p className="text-xs text-muted-foreground dir-ltr">{formatDisplayDate(tx.previousPaidUntil)} &rarr; {formatDisplayDate(tx.newPaidUntil)}</p>
                    </div>
                    {onDeleteTransaction && (
                      <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 transition p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100" title="حذف الحركة">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">لا توجد حركات دفع مسجلة.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
