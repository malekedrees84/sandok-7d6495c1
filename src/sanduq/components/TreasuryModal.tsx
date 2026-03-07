import React, { useState } from 'react';
import { TreasuryTransaction, TREASURY_HOLDERS } from '../types';
import { formatCurrency } from '../utils';
import { X, Vault, Plus, ArrowRightLeft, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TreasuryTransaction[];
  onAddTransaction: (tx: Omit<TreasuryTransaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  canEdit: boolean;
}

export const TreasuryModal: React.FC<TreasuryModalProps> = ({ isOpen, onClose, transactions, onAddTransaction, onDeleteTransaction, canEdit }) => {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [holder, setHolder] = useState(TREASURY_HOLDERS[0]);
  const [toHolder, setToHolder] = useState(TREASURY_HOLDERS[1]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [filterHolder, setFilterHolder] = useState<string>('all');

  if (!isOpen) return null;

  const getBalance = (name: string) => {
    return transactions
      .filter(t => t.holder === name)
      .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : t.type === 'withdraw' ? -t.amount : -t.amount), 0)
      + transactions
      .filter(t => t.type === 'transfer' && t.description.includes(`← تحويل من`) && t.holder === name)
      .reduce(() => 0, 0);
  };

  // Recalculate balances properly
  const holderBalances = TREASURY_HOLDERS.map(name => {
    let balance = 0;
    transactions.forEach(t => {
      if (t.holder === name) {
        if (t.type === 'deposit') balance += t.amount;
        else if (t.type === 'withdraw') balance -= t.amount;
        else if (t.type === 'transfer') balance -= t.amount;
      }
      // If this person received a transfer
      if (t.type === 'transfer' && t.description.includes(`إلى ${name}`)) {
        // skip, handled by matching tx
      }
    });
    // Add received transfers
    transactions.forEach(t => {
      if (t.type === 'deposit' && t.description.includes(`تحويل من`) && t.holder === name) {
        // already counted as deposit
      }
    });
    return { name, balance };
  });

  // Simpler balance calculation
  const calcBalance = (name: string) => {
    let bal = 0;
    transactions.forEach(t => {
      if (t.holder === name) {
        if (t.type === 'deposit') bal += t.amount;
        else bal -= t.amount;
      }
    });
    return bal;
  };

  const totalBalance = TREASURY_HOLDERS.reduce((sum, h) => sum + calcBalance(h), 0);

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'transfer') {
      // Create two transactions: withdraw from source, deposit to target
      onAddTransaction({ holder, type: 'withdraw', amount: amt, description: `تحويل إلى ${toHolder} - ${description}`.trim(), date: today });
      onAddTransaction({ holder: toHolder, type: 'deposit', amount: amt, description: `تحويل من ${holder} - ${description}`.trim(), date: today });
    } else {
      onAddTransaction({ holder, type, amount: amt, description, date: today });
    }

    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  const filtered = filterHolder === 'all' ? transactions : transactions.filter(t => t.holder === filterHolder);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const holderColors: Record<string, string> = {
    'مالك': 'from-[hsl(262,83%,58%)] to-[hsl(262,83%,68%)]',
    'معين': 'from-[hsl(175,70%,41%)] to-[hsl(175,70%,51%)]',
    'مؤيد': 'from-[hsl(38,92%,50%)] to-[hsl(45,100%,60%)]',
  };

  const holderBg: Record<string, string> = {
    'مالك': 'bg-primary/10 text-primary',
    'معين': 'bg-[hsl(175,70%,41%)]/10 text-[hsl(175,70%,41%)]',
    'مؤيد': 'bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex justify-between items-center text-white" style={{ background: 'var(--gradient-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full"><Vault size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">نظام الخزينة</h2>
              <p className="text-xs opacity-80">إجمالي الرصيد: {formatCurrency(totalBalance)}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Holder Cards */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {TREASURY_HOLDERS.map(name => (
            <div key={name} className={`rounded-xl p-3 text-white bg-gradient-to-br ${holderColors[name]} shadow-md`}>
              <p className="text-xs opacity-80 mb-1">خزينة</p>
              <p className="font-bold text-sm">{name}</p>
              <p className="text-lg font-black mt-1">{formatCurrency(calcBalance(name))}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 flex gap-2">
          {canEdit && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition hover:opacity-90" style={{ background: 'var(--gradient-primary)' }}>
              <Plus size={14} /> إضافة حركة
            </button>
          )}
          <select value={filterHolder} onChange={e => setFilterHolder(e.target.value)} className="px-3 py-2 rounded-lg text-xs bg-secondary border border-border">
            <option value="all">جميع الخزائن</option>
            {TREASURY_HOLDERS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Add Form */}
        {showForm && canEdit && (
          <div className="mx-4 mt-3 p-4 bg-secondary/50 rounded-xl border border-border space-y-3 animate-fade-in">
            <div className="flex gap-1 bg-secondary p-1 rounded-lg">
              {(['deposit', 'withdraw', 'transfer'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-md text-xs font-bold transition ${type === t ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
                  {t === 'deposit' ? 'إيداع' : t === 'withdraw' ? 'سحب' : 'تحويل'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">{type === 'transfer' ? 'من خزينة' : 'الخزينة'}</label>
                <select value={holder} onChange={e => setHolder(e.target.value)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs">
                  {TREASURY_HOLDERS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              {type === 'transfer' && (
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">إلى خزينة</label>
                  <select value={toHolder} onChange={e => setToHolder(e.target.value)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs">
                    {TREASURY_HOLDERS.filter(h => h !== holder).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">المبلغ</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">ملاحظة</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="سبب الحركة..." className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs" />
            </div>
            <button onClick={handleSubmit} className="w-full py-2.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90" style={{ background: 'var(--gradient-primary)' }}>
              تأكيد
            </button>
          </div>
        )}

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sorted.length === 0 && <p className="text-center text-muted-foreground text-xs py-8">لا توجد حركات مسجلة</p>}
          {sorted.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg border border-border group hover:shadow-sm transition">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-destructive/10 text-destructive'}`}>
                  {tx.type === 'deposit' ? <TrendingUp size={16} /> : tx.type === 'withdraw' ? <TrendingDown size={16} /> : <ArrowRightLeft size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${holderBg[tx.holder] || 'bg-secondary text-muted-foreground'}`}>{tx.holder}</span>
                    <span className="text-xs font-medium text-foreground">{tx.type === 'deposit' ? 'إيداع' : tx.type === 'withdraw' ? 'سحب' : 'تحويل'}</span>
                  </div>
                  {tx.description && <p className="text-[11px] text-muted-foreground mt-0.5">{tx.description}</p>}
                  <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                {canEdit && (
                  <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
