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
    <div className="relative w-full bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white shadow-md rounded-xl overflow-hidden mb-6 border border-orange-500">
      <div className="absolute top-0 right-0 bottom-0 z-20 bg-orange-700 px-3 flex items-center shadow-lg">
        <Megaphone size={20} className="animate-pulse text-yellow-300" />
        <span className="mr-2 font-bold text-sm hidden sm:block">تنويهات:</span>
      </div>
      {canEdit && (
        <button onClick={onEdit} className="absolute top-0 left-0 bottom-0 z-20 bg-black/20 hover:bg-black/40 px-3 flex items-center transition backdrop-blur-sm" title="إدارة الرسائل">
          <Edit size={16} />
        </button>
      )}
      <div className="py-2 overflow-hidden relative flex items-center h-14">
        {announcements.length > 0 ? (
          <div className="animate-marquee whitespace-nowrap absolute top-1/2 flex items-center">
            {announcements.map((msg, index) => (
              <div key={msg.id} className="inline-flex items-center mx-8">
                {msg.image && <img src={msg.image} alt="announcement" className="h-10 w-auto rounded border-2 border-white/50 shadow-sm ml-3 object-cover" />}
                {msg.text && <span className="text-sm font-bold text-white drop-shadow-md">{msg.text}</span>}
                {index !== announcements.length - 1 && <span className="mx-6 text-orange-300 text-lg opacity-60">•</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full text-center text-xs opacity-80 pt-1">لا توجد تنويهات حالياً (اضغط القلم للإضافة)</div>
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
