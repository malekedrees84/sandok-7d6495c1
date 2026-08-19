import React, { useMemo, useState } from 'react';
import { Member, PaymentTransaction } from '../types';
import { formatCurrency, formatDisplayDate } from '../utils';
import { X, Search, Receipt, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PaymentsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  payments: PaymentTransaction[];
}

export const PaymentsLogModal: React.FC<PaymentsLogModalProps> = ({ isOpen, onClose, members, payments }) => {
  const [search, setSearch] = useState('');

  const memberMap = useMemo(() => {
    const m: Record<string, Member> = {};
    members.forEach(mem => { m[mem.id] = mem; });
    return m;
  }, [members]);

  const rows = useMemo(() => {
    const q = search.trim();
    return payments
      .map(p => ({ ...p, memberName: memberMap[p.memberId]?.name || 'عضو محذوف' }))
      .filter(p => !q || p.memberName.includes(q))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, memberMap, search]);

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-4 flex justify-between items-center text-white" style={{ background: 'var(--gradient-primary)' }}>
          <div className="flex items-center gap-2">
            <Receipt size={20} />
            <h2 className="text-base sm:text-lg font-bold">سجل الدفعات حسب الاسم</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-4 border-b border-border bg-secondary/40 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم العضو..."
              className="w-full h-10 pr-9 pl-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>عدد الدفعات: <b className="text-foreground">{rows.length}</b></span>
            <span>الإجمالي: <b className="text-primary">{formatCurrency(total)}</b></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">لا توجد دفعات مطابقة</div>
          ) : rows.map(tx => (
            <div key={tx.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0"><User size={16} /></div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{tx.memberName}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    {format(new Date(tx.date), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    عن {tx.monthsCovered} شهر • {formatDisplayDate(tx.previousPaidUntil)} ← {formatDisplayDate(tx.newPaidUntil)}
                  </p>
                </div>
              </div>
              <p className="font-bold text-primary text-base shrink-0">{formatCurrency(tx.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
