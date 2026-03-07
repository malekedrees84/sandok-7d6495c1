import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { X, Users, UserCheck, Save, Sparkles, Search, CheckSquare, Square } from 'lucide-react';

interface FamilyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAssign: (headId: string, dependentIds: string[], familyName?: string) => void;
}

const getFirstName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const honorifics = ['الحاج', 'الشيخ', 'الحاجة', 'ام', 'أم', 'ابو', 'أبو'];
  let idx = 0;
  while (idx < parts.length && honorifics.includes(parts[idx])) idx++;
  return parts[idx] || parts[0];
};

const getFatherName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const honorifics = ['الحاج', 'الشيخ', 'الحاجة', 'ام', 'أم', 'ابو', 'أبو'];
  let idx = 0;
  while (idx < parts.length && honorifics.includes(parts[idx])) idx++;
  return parts[idx + 1] || '';
};

const suggestDependents = (head: Member, allMembers: Member[]): Member[] => {
  const headFirstName = getFirstName(head.name);
  if (!headFirstName) return [];
  return allMembers.filter(m => {
    if (m.id === head.id) return false;
    if (m.headMemberId && m.headMemberId !== head.id) return false;
    const fatherName = getFatherName(m.name);
    return fatherName === headFirstName;
  });
};

export const FamilyAssignmentModal: React.FC<FamilyAssignmentModalProps> = ({ isOpen, onClose, members, onAssign }) => {
  const [selectedHeadId, setSelectedHeadId] = useState<string>('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [searchHead, setSearchHead] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [customFamilyName, setCustomFamilyName] = useState('');

  const potentialHeads = useMemo(() =>
    members.filter(m => !m.headMemberId).filter(m =>
      !searchHead || m.name.includes(searchHead)
    ), [members, searchHead]);

  const selectedHead = members.find(m => m.id === selectedHeadId);

  const suggestedDependents = useMemo(() => {
    if (!selectedHead) return [];
    return suggestDependents(selectedHead, members);
  }, [selectedHead, members]);

  const currentDependents = useMemo(() => {
    if (!selectedHeadId) return [];
    return members.filter(m => m.headMemberId === selectedHeadId);
  }, [selectedHeadId, members]);

  // All available members (not the head, not assigned to another head)
  const availableMembers = useMemo(() => {
    if (!selectedHead) return [];
    return members.filter(m =>
      m.id !== selectedHeadId &&
      (!m.headMemberId || m.headMemberId === selectedHeadId)
    );
  }, [selectedHead, members, selectedHeadId]);

  // Filtered by search
  const filteredAvailable = useMemo(() => {
    if (!searchMember) return availableMembers;
    return availableMembers.filter(m => m.name.includes(searchMember));
  }, [availableMembers, searchMember]);

  // Suggested IDs set
  const suggestedIds = useMemo(() => new Set([
    ...suggestedDependents.map(m => m.id),
    ...currentDependents.map(m => m.id),
  ]), [suggestedDependents, currentDependents]);

  const handleSelectHead = (id: string) => {
    setSelectedHeadId(id);
    setSearchMember('');
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setCheckedIds(new Set(availableMembers.map(m => m.id)));
  };

  const deselectAll = () => {
    setCheckedIds(new Set());
  };

  const handleSave = () => {
    if (!selectedHeadId) return;
    onAssign(selectedHeadId, Array.from(checkedIds), customFamilyName.trim() || undefined);
    setSelectedHeadId('');
    setCheckedIds(new Set());
    setSearchHead('');
    setSearchMember('');
    setCustomFamilyName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 flex justify-between items-center border-b border-border" style={{ background: 'var(--gradient-primary)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white"><Users size={20} /> تعيين العائلات</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Select Head */}
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              اختر رب الأسرة
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="ابحث عن عضو..."
                value={searchHead}
                onChange={e => setSearchHead(e.target.value)}
                className="w-full h-9 pl-3 pr-9 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            </div>
            {!selectedHeadId ? (
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {potentialHeads.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد نتائج</p>}
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
                <button onClick={() => { setSelectedHeadId(''); setCheckedIds(new Set()); setSearchMember(''); }} className="text-xs text-muted-foreground hover:text-destructive transition">تغيير</button>
              </div>
            )}
          </div>

          {/* Step 2: Select members */}
          {selectedHeadId && (
            <div className="animate-fade-in">
              <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                اختر أعضاء العائلة
              </label>

              {/* Search + select all/none */}
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ابحث عن عضو..."
                    value={searchMember}
                    onChange={e => setSearchMember(e.target.value)}
                    className="w-full h-9 pl-3 pr-9 text-sm border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                </div>
                <button onClick={selectAll} className="h-9 px-2.5 text-[11px] font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition flex items-center gap-1" title="تحديد الكل">
                  <CheckSquare size={13} /> الكل
                </button>
                <button onClick={deselectAll} className="h-9 px-2.5 text-[11px] font-medium bg-secondary text-muted-foreground rounded-lg hover:bg-accent transition flex items-center gap-1" title="إلغاء الكل">
                  <Square size={13} />
                </button>
              </div>

              {/* Members list */}
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {filteredAvailable.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد نتائج</p>}
                {filteredAvailable.map(m => {
                  const isSuggested = suggestedIds.has(m.id);
                  return (
                    <label key={m.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition cursor-pointer ${checkedIds.has(m.id) ? 'bg-primary/5' : ''}`}>
                      <input type="checkbox" checked={checkedIds.has(m.id)} onChange={() => toggleCheck(m.id)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary shrink-0" />
                      {m.profileImage ? <img src={m.profileImage} className="w-7 h-7 rounded-md object-cover shrink-0" /> : <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{m.name.charAt(0)}</div>}
                      <span className="text-sm text-foreground truncate flex-1">{m.name}</span>
                      {isSuggested && <span className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-1.5 py-0.5 rounded font-medium shrink-0 flex items-center gap-0.5"><Sparkles size={9} /> مقترح</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedHeadId && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                <UserCheck size={13} className="inline ml-1" />
                {checkedIds.size} عضو سيتم ربطهم بالعائلة
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
