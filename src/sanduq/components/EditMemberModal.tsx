import React, { useState, useEffect, useRef } from 'react';
import { Member, START_DATE } from '../types';
import { X, User, Calendar, Save, Phone, Camera, Upload, Users } from 'lucide-react';
import { compressImage } from '../utils';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onUpdate: (updatedMember: Member) => void;
  allMembers?: Member[];
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, member, onUpdate, allMembers = [] }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [headMemberId, setHeadMemberId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && member) {
      setName(member.name);
      setPhone(member.phone || '');
      setJoinDate(member.joinDate || START_DATE);
      setProfileImage(member.profileImage);
      setHeadMemberId(member.headMemberId || '');
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate({ ...member, name: name.trim(), phone: phone.trim(), joinDate, profileImage, headMemberId: headMemberId || undefined });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try { setProfileImage(await compressImage(file)); }
      catch { alert("حدث خطأ أثناء معالجة الصورة"); }
    }
  };

  const availableHeads = allMembers.filter(m => m.id !== member.id && !m.headMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2"><User size={20} /> تعديل بيانات العضو</h2>
          <button onClick={onClose} type="button" className="hover:bg-gray-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-100 overflow-hidden cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><User size={40} /></div>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={24} className="text-white" /></div>
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary text-sm font-bold mt-2 flex items-center gap-1 hover:underline"><Upload size={14} /> تغيير الصورة</button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">اسم العضو</label>
            <div className="relative">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">رقم الهاتف</label>
            <div className="relative">
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none dir-ltr text-right" />
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><Users size={16} /> الانتماء العائلي</label>
            <select value={headMemberId} onChange={(e) => setHeadMemberId(e.target.value)} className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none">
              <option value="">رب الأسرة (مستقل)</option>
              {availableHeads.map(m => <option key={m.id} value={m.id}>تابع لـ {m.name}</option>)}
            </select>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <label className="block text-sm font-bold text-yellow-800 mb-1 flex items-center gap-2"><Calendar size={16} /> تاريخ الانضمام</label>
            <p className="text-xs text-yellow-700 mb-2">تغيير هذا التاريخ سيؤثر على حساب الاشتراكات المطلوبة.</p>
            <input type="date" required value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="w-full p-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-center font-bold text-foreground" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition shadow-lg mt-4 flex items-center justify-center gap-2"><Save size={18} /> حفظ التعديلات</button>
        </form>
      </div>
    </div>
  );
};
