import React, { useState, useEffect } from 'react';
import { HeartHandshake, ArrowLeft, Quote } from 'lucide-react';

interface SplashScreenProps {
  onEnter: () => void;
}

const HADITH_COLLECTION = [
  { text: "مَا نَقَصَ مَالٌ مِنْ صَدَقَةٍ", source: "رواه مسلم" },
  { text: "دَاوُوا مَرضاكُمْ بِالصَّدقةِ", source: "صحيح الجامع" },
  { text: "صَنَائُعُ الْمَعْرُوفِ تَقِي مَصَارِعَ السُّوءِ", source: "رواه الطبراني" },
  { text: "إِنَّ الصَّدَقَةَ لَتُطْفِئُ غَضَبَ الرَّبِّ وَتَدْفَعُ مِيتَةَ السُّوءِ", source: "رواه الترمذي" },
  { text: "اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ", source: "متفق عليه" },
  { text: "الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى", source: "رواه البخاري" },
  { text: "كُلُّ مَعْرُوفٍ صَدَقَةٌ", source: "رواه البخاري" },
  { text: "الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا", source: "متفق عليه" },
  { text: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", source: "صحيح الجامع" }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [currentHadith, setCurrentHadith] = useState(HADITH_COLLECTION[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * HADITH_COLLECTION.length);
    setCurrentHadith(HADITH_COLLECTION[randomIndex]);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(207 90% 20%), hsl(207 90% 35%), hsl(220 70% 25%))' }}>
      {/* Mica-like noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />
      
      {/* Subtle glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(207 90% 54%), transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(170 60% 50%), transparent)' }} />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 sm:px-8 text-center space-y-6 sm:space-y-8 animate-fade-in-up">
        {/* Logo */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl" style={{ background: 'hsl(0 0% 100% / 0.1)', backdropFilter: 'blur(20px)' }}>
            <HeartHandshake size={40} className="text-white sm:w-12 sm:h-12" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">صندوق العائلة</h1>
          <p className="text-white/60 text-xs sm:text-sm font-normal">نظام الإدارة المالية والتكافل الاجتماعي</p>
        </div>

        {/* Hadith card - Fluent acrylic style */}
        <div className="w-full rounded-xl p-6 sm:p-8 border border-white/10 min-h-[180px] flex flex-col justify-center" style={{ background: 'hsl(0 0% 100% / 0.08)', backdropFilter: 'blur(30px)' }}>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-[1px] bg-white/20" />
              <p className="text-[10px] sm:text-xs text-white/50 font-medium tracking-widest uppercase">حديث شريف</p>
              <div className="w-6 h-[1px] bg-white/20" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold leading-relaxed text-white/95">"{currentHadith.text}"</h2>
            <p className="text-[11px] text-white/40">{currentHadith.source}</p>
          </div>
        </div>

        {/* Enter button - Windows 11 style */}
        <button onClick={onEnter}
          className="group w-full py-3.5 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 border border-white/10 hover:border-white/20"
          style={{ background: 'hsl(0 0% 100% / 0.12)', backdropFilter: 'blur(20px)', color: 'white' }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'hsl(0 0% 100% / 0.2)'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'hsl(0 0% 100% / 0.12)'; }}>
          <span>الدخول للبرنامج</span>
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <p className="text-[10px] text-white/25 mt-4">إصدار 3.0 &bull; Fluent Design</p>
      </div>
    </div>
  );
};
