import React, { useState, useRef } from 'react';
import { Member, Expense } from '../types';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  expenses: Expense[];
  onApplyUpdates: (updates: { memberId: string, amount: number, newPaidUntil: string }[]) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteAllData: () => void;
  onAddMember: (name: string, phone: string, joinDate?: string) => void;
  onBatchAddMembers: (members: { name: string, phone: string, joinDate?: string }[]) => void;
  onDeleteMember: (id: string) => void;
  onUpdateMember?: (member: Member) => void;
  onBulkUpdateJoinDate?: (date: string) => void;
  isAdmin: boolean;
  userRole: 'admin' | 'moderator' | null;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, userRole }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Placeholder response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'عذراً، المساعد الذكي غير متصل حالياً. يحتاج لربط مفتاح API لخدمة الذكاء الاصطناعي.\n\nيمكنك استخدام الأدوات المتاحة في القائمة الرئيسية لإدارة الصندوق.'
      };
      setMessages(prev => [...prev, botMsg]);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h2 className="text-lg font-bold">المساعد الذكي</h2>
            {userRole && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{userRole === 'admin' ? 'مدير' : 'مشرف'}</span>}
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Bot size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">أهلاً بك! كيف يمكنني مساعدتك؟</p>
              <p className="text-xs mt-2 opacity-70">المساعد الذكي يحتاج لربط API للعمل بالكامل</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none'}`}>
                <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                  {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                  {msg.role === 'user' ? 'أنت' : 'المساعد'}
                </div>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب رسالتك..." className="flex-1 p-3 border border-border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" autoFocus />
            <button onClick={handleSend} className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
