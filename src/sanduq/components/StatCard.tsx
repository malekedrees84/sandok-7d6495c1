import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass?: string;
  gradient?: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 68%))',
  'linear-gradient(135deg, hsl(175 70% 41%), hsl(175 70% 51%))',
  'linear-gradient(135deg, hsl(330 85% 55%), hsl(330 85% 65%))',
  'linear-gradient(135deg, hsl(38 92% 50%), hsl(45 100% 60%))',
];

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, colorClass, gradient }) => {
  return (
    <div className="fluent-card p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group hover:-translate-y-0.5 overflow-hidden relative">
      {/* Subtle gradient accent on top */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl opacity-80" style={{ background: gradient || 'var(--gradient-primary)' }} />
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{title}</p>
          <h3 className="text-base sm:text-lg lg:text-xl 2xl:text-2xl font-black text-foreground truncate leading-tight">{value}</h3>
          {trend && <p className="text-[10px] sm:text-xs text-[hsl(var(--success))] mt-2 font-bold">{trend}</p>}
        </div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md group-hover:scale-110 transition-transform" style={{ background: gradient || 'var(--gradient-primary)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
};
