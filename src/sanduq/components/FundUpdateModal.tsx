import React, { useState } from 'react';
import { X, Copy, Check, Send, Vault, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { TreasuryTransaction, TREASURY_HOLDERS } from '../types';
import { formatCurrency } from '../utils';
import { format } from 'date-fns';

interface FundUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPayments: number;
  totalExpenses: number;
  treasuryTx: TreasuryTransaction[];
}

export const FundUpdateModal: React.FC<FundUpdateModalProps> = ({ isOpen, onClose, totalPayments, totalExpenses, treasuryTx }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const balances = TREASURY_HOLDERS.map(name => ({
    name,
    balance: treasuryTx
      .filter(t => t.holder === name)
      .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0),
  }));
  const totalTreasury = balances.reduce((sum, b) => sum + b.balance, 0);
  const net = totalPayments - totalExpenses;

  const message = [
    '📊 آخر تحديث من الصندوق',
    `🗓️ ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    '',
    `💵 إجمالي المدفوعات: ${formatCurrency(totalPayments)}`,
    `💸 إجمالي المصروفات: ${formatCurrency(totalExpenses)}`,
    `💰 صافي رصيد الصندوق: ${formatCurrency(net)}`,
    '',
    '🏦 أرصدة الخزائن:',
    ...balances.map(b => `• خزينة ${b.name}: ${formatCurrency(b.balance)}`),
    `📦 مجموع النقد في الخزائن: ${formatCurrency(totalTreasury)}`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 flex justify-between items-center text-white" style={{ background: 'var(--gradient-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full"><Send size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">رسالة آخر تحديث</h2>
              <p className="text-xs opacity-80">مشاركة ملخص الصندوق</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl p-2.5 bg-secondary/50 border border-border">
              <TrendingUp size={14} className="mx-auto text-[hsl(var(--success))]" />
              <p className="text-[10px] text-muted-foreground mt-1">المدفوعات</p>
              <p className="text-xs font-black text-foreground dir-ltr">{formatCurrency(totalPayments)}</p>
            </div>
            <div className="rounded-xl p-2.5 bg-secondary/50 border border-border">
              <TrendingDown size={14} className="mx-auto text-destructive" />
              <p className="text-[10px] text-muted-foreground mt-1">المصروفات</p>
              <p className="text-xs font-black text-foreground dir-ltr">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-xl p-2.5 bg-secondary/50 border border-border">
              <Wallet size={14} className="mx-auto text-primary" />
              <p className="text-[10px] text-muted-foreground mt-1">الصافي</p>
              <p className="text-xs font-black text-foreground dir-ltr">{formatCurrency(net)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {balances.map(b => (
              <div key={b.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border">
                <span className="flex items-center gap-2 text-xs font-bold text-foreground"><Vault size={13} className="text-primary" /> خزينة {b.name}</span>
                <span className="text-sm font-black dir-ltr" style={{ color: b.balance > 0 ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>{formatCurrency(b.balance)}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="text-[10px] text-muted-foreground mb-2">نص الرسالة الجاهزة للإرسال:</p>
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-medium text-foreground" dir="rtl">{message}</pre>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleCopy} className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition text-white ${copied ? 'bg-[hsl(var(--success))]' : 'bg-gray-800 hover:bg-gray-900'}`}>
              {copied ? <><Check size={16} /> تم النسخ ✅</> : <><Copy size={16} /> نسخ الرسالة</>}
            </button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')} className="h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition text-white" style={{ background: 'var(--gradient-primary)' }}>
              <Send size={16} /> إرسال واتساب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
