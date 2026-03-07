import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { X, Users, Check, UserCheck, ChevronDown, Save, Sparkles } from 'lucide-react';

interface FamilyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAssign: (headId: string, dependentIds: string[]) => void;
}

// Extract the "real" first name, stripping honorifics
const getFirstName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const honorifics = ['الحاج', 'الشيخ', 'الحاجة', 'ام', 'أم', 'ابو', 'أبو'];
  let idx = 0;
  while (idx < parts.length && honorifics.includes(parts[idx])) idx++;
  return parts[idx] || parts[0];
};

// Get the father's name (second meaningful word)
const getFatherName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const honorifics = ['الحاج', 'الشيخ', 'الحاجة', 'ام', 'أم', 'ابو', 'أبو'];
  let idx = 0;
  while (idx < parts.length && honorifics.includes(parts[idx])) idx++;
  return parts[idx + 1] || '';
};

// Suggest dependents: members whose father name matches head's first name
const suggestDependents = (head: Member, allMembers: Member[]): Member[] => {
  const headFirstName = getFirstName(head.name);
  if (!headFirstName) return [];
  
  return allMembers.filter(m => {
    if (m.id === head.id) return false;
    // Already assigned to another head
    if (m.headMemberId && m.headMemberId !== head.id) return false;
    const fatherName = getFatherName(m.name);
    return fatherName === headFirstName;
  });
};

export const FamilyAssignmentModal: React.FC<FamilyAssignmentModalProps> = ({ isOpen, onClose, members, onAssign }) => {
  const [selectedHeadId, setSelectedHeadId] = useState<string>('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [searchHead, setSearchHead] = useState('');

  // Potential heads: members who are not dependents
  const potentialHeads = useMemo(() => 
    members.filter(m => !m.headMemberId).filter(m => 
      !searchHead || m.name.includes(searchHead)
    ), [members, searchHead]);

  const selectedHead = members.find(m => m.id === selectedHeadId);

  const suggestedDependents = useMemo(() => {
    if (!selectedHead) return [];
    return suggestDependents(selectedHead, members);
  }, [selectedHead, members]);

  // Current dependents already assigned to this head
  const currentDependents = useMemo(() => {
    if (!selectedHeadId) return [];
    return members.filter(m => m.headMemberId === selectedHeadId);
  }, [selectedHeadId, members]);

  const handleSelectHead = (id: string) => {
    setSelectedHeadId(id);
    // Auto-check all suggested + already assigned
    const head = members.find(m => m.id === id);
    if (head) {
      const suggested = suggestDependents(head, members);
      const already = members.filter(m => m.headMemberId === id);
      setCheckedIds(new Set([...suggested.map(m => m.id), ...already.map(m => m.id)]));
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedHeadId) return;
    onAssign(selectedHeadId, Array.from(checkedIds));
    setSelectedHeadId('');
    setCheckedIds(new Set());
    setSearchHead('');
  };

  // All other unassigned members (for manual add)
  const otherMembers = useMemo(() => {
    if (!selectedHead) return [];
    const suggestedIds = new Set(suggestedDependents.map(m => m.id));
    const currentIds = new Set(currentDependents.map(m => m.id));
    return members.filter(m => 
      m.id !== selectedHeadId && 
      !suggestedIds.has(m.id) && 
      !currentIds.has(m.id) &&
      (!m.headMemberId || m.headMemberId === selectedHeadId)
    );
  }, [selectedHead, suggestedDependents, currentDependents, members, selectedHeadId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 flex justify-between items-center border-b border-border" style={{ background: 'var(--gradient-primary)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white"><Users size={20} /> تعيين العائلات ذكياً</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Select Head */}
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              اختر رب الأسرة
            </label>
            <input 
              type="text" 
              placeholder="ابحث عن عضو..." 
              value={searchHead}
              onChange={e => setSearchHead(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            />
            {!selectedHeadId ? (
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {potentialHeads.map(m => (
                  <button key={m.id} onClick={() => handleSelectHead(m.id)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition text-right">
                    {m.profileImage ? <img src={m.profileImage} className="w-8 h-8 rounded-md object-cover shrink-0" /> : <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{m.name.charAt(0)}</div>}
                    <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                {selectedHead?.profileImage ? <img src={selectedHead.profileImage} className="w-10 h-10 rounded-md object-cover shrink-0" /> : <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">{selectedHead?.name.charAt(0)}</div>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{selectedHead?.name}</p>
                  <p className="text-[11px] text-primary font-medium">رب الأسرة</p>
                </div>
                <button onClick={() => { setSelectedHeadId(''); setCheckedIds(new Set()); }} className="text-xs text-muted-foreground hover:text-destructive transition">تغيير</button>
              </div>
            )}
          </div>

          {/* Step 2: Suggested dependents */}
          {selectedHeadId && (
            <div className="animate-fade-in">
              <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <Sparkles size={14} className="text-primary" /> الأعضاء المقترحون تلقائياً
              </label>
              
              {suggestedDependents.length > 0 || currentDependents.length > 0 ? (
                <div className="border border-border rounded-lg divide-y divide-border">
                  {[...new Map([...currentDependents, ...suggestedDependents].map(m => [m.id, m])).values()].map(m => (
                    <label key={m.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition cursor-pointer">
                      <input type="checkbox" checked={checkedIds.has(m.id)} onChange={() => toggleCheck(m.id)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                      {m.profileImage ? <img src={m.profileImage} className="w-7 h-7 rounded-md object-cover shrink-0" /> : <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{m.name.charAt(0)}</div>}
                      <span className="text-sm text-foreground truncate flex-1">{m.name}</span>
                      <span className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-1.5 py-0.5 rounded font-medium">مقترح</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4 bg-secondary rounded-lg">لم يتم العثور على أعضاء مقترحين تلقائياً</p>
              )}

              {/* Other members to manually add */}
              {otherMembers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">إضافة يدوياً:</p>
                  <div className="max-h-36 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {otherMembers.map(m => (
                      <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 transition cursor-pointer">
                        <input type="checkbox" checked={checkedIds.has(m.id)} onChange={() => toggleCheck(m.id)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        <span className="text-xs text-foreground truncate">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedHeadId && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                <UserCheck size={13} className="inline ml-1" />
                {checkedIds.size} عضو تابع سيتم ربطهم
              </span>
            </div>
            <button onClick={handleSave} className="w-full py-3 rounded-xl font-bold text-white hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 text-sm" style={{ background: 'var(--gradient-primary)' }}>
              <Save size={16} /> حفظ تعيين العائلة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
