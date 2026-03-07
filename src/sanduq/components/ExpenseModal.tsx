import React, { useState } from 'react';
import { Expense } from '../types';
import { X, Receipt } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
}

const EXPENSE_CATEGORIES = ["فرح", "عزاء", "منحة تعليمية"];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && amount) {
      onAdd({ title, amount: Number(amount), category, date: new Date().toISOString().slice(0, 10), notes });
      setTitle(''); setAmount(''); setNotes('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-destructive p-4 flex justify-between items-center text-destructive-foreground">
          <h2 className="text-lg font-bold flex items-center gap-2"><Receipt size={20} /> تسجيل مصروف جديد</h2>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">وصف المصروف</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: منحة دراسية..."
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">المبلغ</label>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">التصنيف</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-card">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"></textarea>
          </div>
          <button type="submit" className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl font-bold hover:opacity-90 transition shadow-lg mt-2">حفظ المصروف</button>
        </form>
      </div>
    </div>
  );
};
