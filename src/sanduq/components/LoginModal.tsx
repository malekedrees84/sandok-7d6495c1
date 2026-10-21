import React, { useState } from 'react';
import { Lock, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInStaff } from '../services/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: 'admin' | 'moderator') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const role = await signInStaff(username.trim(), password);
      onLogin(role);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setUsername(''); setPassword(''); setError(''); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 flex justify-end">
          <Button variant="ghost" size="icon" onClick={resetAndClose} disabled={isSubmitting} aria-label="إغلاق"><X size={20} /></Button>
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
                className={`w-full p-3 pr-10 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-right ${error ? 'border-destructive bg-destructive/10' : 'border-border'}`}
                autoFocus autoComplete="username" disabled={isSubmitting} required />
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative">
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 pr-10 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-right ${error ? 'border-destructive bg-destructive/10' : 'border-border'}`} autoComplete="current-password" disabled={isSubmitting} required />
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {error && <p role="alert" className="text-xs text-destructive text-center">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold shadow-lg">{isSubmitting ? 'جارٍ تسجيل الدخول...' : 'دخول'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
};
