import React, { useState } from 'react';
import { Lock, X, User } from 'lucide-react';
import { AppUser } from '../types';
import { authenticateUser } from '../auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const matchedUser = authenticateUser(users, cleanUser, cleanPass);

    if (matchedUser) {
      onLogin(matchedUser);
      resetAndClose();
    } else {
      setError(true);
    }
  };

  const resetAndClose = () => {
    setUsername(''); setPassword(''); setError(false); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 flex justify-end">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="px-8 pb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-100 p-4 rounded-full text-primary-600"><Lock size={32} /></div>
          </div>
          <h2 className="text-center text-xl font-bold text-foreground mb-2">تسجيل الدخول</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">الرجاء إدخال بيانات الدخول للمتابعة</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)}
                className={`w-full p-3 pr-10 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-right ${error ? 'border-red-500 bg-red-50' : 'border-border'}`}
                autoFocus />
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative">
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 pr-10 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-right ${error ? 'border-red-500 bg-red-50' : 'border-border'}`} />
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {error && <p className="text-xs text-red-500 text-center">بيانات الدخول غير صحيحة</p>}
            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold transition shadow-lg hover:opacity-90">دخول</button>
          </form>
        </div>
      </div>
    </div>
  );
};
