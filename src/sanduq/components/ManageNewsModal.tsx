import React, { useState, useRef, useEffect } from 'react';
import { Announcement } from '../types';
import { X, Plus, Trash2, Megaphone, ArrowRight, ArrowLeft, Image as ImageIcon, Save, CheckCircle } from 'lucide-react';
import { compressImage } from '../utils';

interface ManageNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onAdd: (text: string, image?: string) => void;
  onDelete: (id: string) => void;
  currentDirection: 'rtl' | 'ltr';
  currentDuration: number;
  onSaveSettings: (direction: 'rtl' | 'ltr', duration: number) => void;
}

export const ManageNewsModal: React.FC<ManageNewsModalProps> = ({ isOpen, onClose, announcements, onAdd, onDelete, currentDirection, currentDuration, onSaveSettings }) => {
  const [newText, setNewText] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localDirection, setLocalDirection] = useState<'rtl' | 'ltr'>('ltr');
  const [localDuration, setLocalDuration] = useState<number>(25);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) { setLocalDirection(currentDirection); setLocalDuration(currentDuration); setIsSaved(false); }
  }, [isOpen, currentDirection, currentDuration]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newText.trim() || newImage) { onAdd(newText.trim(), newImage || undefined); setNewText(''); setNewImage(null); }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { try { setNewImage(await compressImage(file)); } catch { alert('فشل معالجة الصورة'); } }
  };

  const handleSaveSettings = () => {
    onSaveSettings(localDirection, localDuration);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-orange-600 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2"><Megaphone size={20} /><h2 className="text-lg font-bold">إدارة شريط الأخبار</h2></div>
          <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="اكتب التنويه هنا..." className="flex-1 p-3 border border-border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm" autoFocus />
              <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-xl border transition ${newImage ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-border text-muted-foreground hover:bg-gray-100'}`} title="إرفاق صورة"><ImageIcon size={20} /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
              <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl transition shadow-md"><Plus size={20} /></button>
            </div>
            {newImage && <div className="relative inline-block border rounded-lg overflow-hidden"><img src={newImage} alt="Preview" className="h-16 w-auto object-cover" /><button type="button" onClick={() => setNewImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 hover:bg-red-600"><X size={12} /></button></div>}
          </form>
          <hr className="border-border" />
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {announcements.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا توجد رسائل نشطة</p> : announcements.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-orange-50 p-2 rounded-lg border border-orange-100 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  {item.image && <img src={item.image} alt="thumb" className="w-10 h-10 rounded object-cover border border-orange-200" />}
                  <p className="text-sm text-foreground font-medium truncate">{item.text || '(صورة فقط)'}</p>
                </div>
                <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition" title="حذف"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <hr className="border-border" />
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2">إعدادات العرض</h3>
            <div>
              <h3 className="text-xs font-bold text-muted-foreground mb-2">اتجاه الحركة:</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setLocalDirection('rtl')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${localDirection === 'rtl' ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-card border-border text-muted-foreground hover:bg-gray-100'}`}><ArrowLeft size={14} /> من اليمين لليسار</button>
                <button type="button" onClick={() => setLocalDirection('ltr')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${localDirection === 'ltr' ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-card border-border text-muted-foreground hover:bg-gray-100'}`}>من اليسار لليمين <ArrowRight size={14} /></button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-muted-foreground">سرعة الشريط:</h3>
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-muted-foreground">{localDuration < 15 ? 'سريع جداً' : localDuration > 40 ? 'بطيء' : 'عادي'} ({localDuration}ث)</span>
              </div>
              <input type="range" min="5" max="60" step="5" dir="ltr" value={localDuration} onChange={(e) => setLocalDuration(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            </div>
            <button type="button" onClick={handleSaveSettings} className={`w-full py-3 rounded-xl font-bold text-white transition shadow-md flex items-center justify-center gap-2 ${isSaved ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-900'}`}>
              {isSaved ? <><CheckCircle size={18} /> تم حفظ التغييرات</> : <><Save size={18} /> حفظ الإعدادات</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
