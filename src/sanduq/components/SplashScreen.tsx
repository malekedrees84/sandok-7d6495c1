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
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-8 text-center space-y-8 animate-fade-in-up">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 shadow-2xl relative">
            <HeartHandshake size={64} className="text-emerald-300" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">صندوق العائلة</h1>
          <p className="text-indigo-200 text-sm font-medium">نظام الإدارة المالية والتكافل الاجتماعي</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl relative w-full group hover:bg-white/10 transition-colors duration-500 min-h-[200px] flex flex-col justify-center">
          <Quote size={24} className="absolute top-4 right-4 text-indigo-300 opacity-50" />
          <div className="space-y-4">
            <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">حديث شريف</p>
            <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-emerald-100 font-serif">"{currentHadith.text}"</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-indigo-500 rounded-full mx-auto opacity-70"></div>
            <p className="text-xs text-indigo-200 opacity-80">{currentHadith.source}</p>
          </div>
        </div>

        <button onClick={onEnter}
          className="group relative w-full py-4 bg-white text-indigo-900 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
          <span className="relative z-10">الدخول للبرنامج</span>
          <ArrowLeft size={20} className="relative z-10 group-hover:-translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
        </button>

        <p className="text-[10px] text-indigo-300/60 mt-8">إصدار 2.0 &bull; تم التطوير للمساعدة في إدارة الخير</p>
      </div>
    </div>
  );
};
