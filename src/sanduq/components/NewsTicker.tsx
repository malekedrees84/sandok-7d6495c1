import React from 'react';
import { Megaphone, Edit } from 'lucide-react';
import { Announcement } from '../types';

interface NewsTickerProps {
  announcements: Announcement[];
  canEdit: boolean;
  onEdit: () => void;
  direction?: 'rtl' | 'ltr';
  duration?: number;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ announcements, canEdit, onEdit, direction = 'ltr', duration = 25 }) => {
  if (announcements.length === 0 && !canEdit) return null;

  const startTranslate = direction === 'rtl' ? '100%' : '-100%';
  const endTranslate = direction === 'rtl' ? '-100vw' : '100vw';
  const startPosition = direction === 'rtl' ? 'right: 0;' : 'left: 0;';

  return (
    <div className="relative w-full fluent-card overflow-hidden">
      <div className="absolute top-0 right-0 bottom-0 z-20 px-3 flex items-center rounded-r-xl" style={{ background: 'var(--gradient-primary)' }}>
        <Megaphone size={16} className="text-white" />
        <span className="mr-2 font-bold text-xs hidden sm:block text-white">تنويهات</span>
      </div>
      {canEdit && (
        <button onClick={onEdit} className="absolute top-0 left-0 bottom-0 z-20 px-3 flex items-center transition text-muted-foreground hover:text-foreground hover:bg-accent rounded-l-xl" title="إدارة الرسائل">
          <Edit size={14} />
        </button>
      )}
      <div className="py-2 overflow-hidden relative flex items-center h-11">
        {announcements.length > 0 ? (
          <div className="animate-marquee whitespace-nowrap absolute top-1/2 flex items-center">
            {announcements.map((msg, index) => (
              <div key={msg.id} className="inline-flex items-center mx-8">
                {msg.image && <img src={msg.image} alt="announcement" className="h-8 w-auto rounded-lg border border-border shadow-sm ml-3 object-cover" />}
                {msg.text && <span className="text-xs sm:text-sm font-semibold text-foreground">{msg.text}</span>}
                {index !== announcements.length - 1 && <span className="mx-6 text-accent text-lg">✦</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full text-center text-xs text-muted-foreground opacity-60">لا توجد تنويهات حالياً</div>
        )}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translate(${startTranslate}, -50%); }
          100% { transform: translate(${endTranslate}, -50%); }
        }
        .animate-marquee {
          animation: marquee ${duration}s linear infinite;
          ${startPosition}
          transform: translate(${startTranslate}, -50%);
        }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
};
