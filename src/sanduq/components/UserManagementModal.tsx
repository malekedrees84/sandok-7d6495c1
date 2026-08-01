import React, { useState } from 'react';
import { Check, Pencil, Plus, Save, ShieldCheck, UserCog, X } from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { normalizeAppUsers, normalizeUsername } from '../auth';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onSaveUsers: (users: AppUser[]) => void;
}

type UserDraft = {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
};

const emptyDraft: UserDraft = {
  username: '',
  password: '',
  displayName: '',
  role: 'moderator',
};

const roleLabel = (role: UserRole) => role === 'admin' ? 'مدير' : 'مشرف';

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, users, onSaveUsers }) => {
  const [draft, setDraft] = useState<UserDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (user: AppUser) => {
    setDraft({
      username: user.username,
      password: user.password,
      displayName: user.displayName,
      role: user.role,
    });
    setEditingId(user.id);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const username = draft.username.trim();
    const password = draft.password.trim();
    const displayName = draft.displayName.trim() || username;

    if (!username || !password) {
      setError('اسم المستخدم وكلمة المرور مطلوبة');
      return;
    }

    const duplicate = users.some((user) => user.id !== editingId && normalizeUsername(user.username) === normalizeUsername(username));
    if (duplicate) {
      setError('اسم المستخدم موجود مسبقاً');
      return;
    }

    const userToSave: AppUser = {
      id: editingId || makeId(),
      username,
      password,
      displayName,
      role: draft.role,
    };

    const nextUsers = editingId
      ? users.map((user) => user.id === editingId ? userToSave : user)
      : [...users, userToSave];

    onSaveUsers(normalizeAppUsers(nextUsers));
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <UserCog size={20} className="text-green-400" />
            <h2 className="text-lg font-bold">لوحة المستخدمين</h2>
          </div>
          <button onClick={() => { resetForm(); onClose(); }} className="hover:bg-gray-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="overflow-auto flex-1 bg-gray-50 p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">{editingId ? 'تعديل مستخدم' : 'إضافة مستخدم'}</h3>
                {editingId && <button type="button" onClick={resetForm} className="text-[11px] text-muted-foreground hover:text-primary">إلغاء</button>}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  aria-label="اسم المستخدم"
                  value={draft.username}
                  onChange={(e) => setDraft((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">كلمة المرور</label>
                <input
                  type="text"
                  aria-label="كلمة المرور"
                  value={draft.password}
                  onChange={(e) => setDraft((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الاسم المعروض</label>
                <input
                  type="text"
                  aria-label="الاسم المعروض"
                  value={draft.displayName}
                  onChange={(e) => setDraft((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الصلاحية</label>
                <select
                  aria-label="الصلاحية"
                  value={draft.role}
                  onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="admin">مدير</option>
                  <option value="moderator">مشرف</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-bold transition hover:opacity-90 flex items-center justify-center gap-2">
                {editingId ? <Save size={15} /> : <Plus size={15} />}
                {editingId ? 'حفظ التعديل' : 'إضافة المستخدم'}
              </button>
            </form>

            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">المستخدمون الحاليون</h3>
              </div>

              <div className="divide-y divide-border">
                {users.map((user) => {
                  const isEditing = editingId === user.id;

                  return (
                    <div key={user.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isEditing ? 'bg-primary/5' : ''}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground truncate">{user.displayName}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{roleLabel(user.role)}</span>
                          {isEditing && <Check size={13} className="text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 dir-ltr text-right">@{user.username}</p>
                      </div>

                      <button onClick={() => handleEdit(user)} className="h-8 px-3 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition flex items-center justify-center gap-1.5 text-xs font-bold">
                        <Pencil size={13} />
                        تعديل
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
