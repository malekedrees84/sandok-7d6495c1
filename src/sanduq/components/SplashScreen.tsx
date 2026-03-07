import React, { useState, useEffect } from 'react';
import { HeartHandshake, ArrowLeft } from 'lucide-react';

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * HADITH_COLLECTION.length);
    setCurrentHadith(HADITH_COLLECTION[randomIndex]);
    setTimeout(() => setIsReady(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-gradient-shift" style={{ background: 'linear-gradient(135deg, hsl(262 83% 45%), hsl(330 85% 50%), hsl(14 90% 50%), hsl(262 83% 55%))', backgroundSize: '300% 300%' }} />

      {/* Floating orbs */}
      <div className="absolute top-[15%] right-[15%] w-[250px] h-[250px] rounded-full opacity-30 animate-float" style={{ background: 'radial-gradient(circle, hsl(45 100% 70%), transparent)', animationDelay: '0s' }} />
      <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, hsl(175 70% 60%), transparent)', animationDelay: '1s' }} />
      <div className="absolute top-[50%] left-[60%] w-[200px] h-[200px] rounded-full opacity-25 animate-float" style={{ background: 'radial-gradient(circle, hsl(330 85% 70%), transparent)', animationDelay: '2s' }} />

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center max-w-md w-full px-6 sm:px-8 text-center space-y-8 transition-all duration-700 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl blur-xl opacity-50" style={{ background: 'hsl(45 100% 60%)' }} />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/30" style={{ background: 'hsl(0 0% 100% / 0.2)', backdropFilter: 'blur(20px)' }}>
            <HeartHandshake size={48} className="text-white sm:w-14 sm:h-14 drop-shadow-lg" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-lg">صندوق العائلة</h1>
          <p className="text-white/70 text-sm sm:text-base font-medium">نظام الإدارة المالية والتكافل الاجتماعي</p>
        </div>

        {/* Hadith card */}
        <div className="w-full rounded-2xl p-7 sm:p-9 border border-white/20 min-h-[180px] flex flex-col justify-center" style={{ background: 'hsl(0 0% 100% / 0.12)', backdropFilter: 'blur(30px)' }}>
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(45 100% 70%))' }} />
              <p className="text-[11px] sm:text-xs text-white/60 font-bold tracking-[0.2em] uppercase">حديث شريف</p>
              <div className="w-8 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, hsl(45 100% 70%), transparent)' }} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-relaxed text-white">"{currentHadith.text}"</h2>
            <p className="text-xs text-white/45 font-medium">{currentHadith.source}</p>
          </div>
        </div>

        {/* Enter button */}
        <button
          onClick={onEnter}
          className="group w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 border border-white/20 hover:border-white/40 hover:shadow-xl text-white"
          style={{ background: 'hsl(0 0% 100% / 0.15)', backdropFilter: 'blur(20px)' }}
        >
          <span>الدخول للبرنامج</span>
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <p className="text-[11px] text-white/30 font-medium">إصدار 4.0 &bull; Vibrant Design</p>
      </div>
    </div>
  );
};
