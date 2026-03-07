import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, colorClass }) => {
  return (
    <div className="fluent-card p-4 sm:p-5 hover:shadow-lg transition-shadow duration-200 group">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate leading-tight">{value}</h3>
          {trend && <p className="text-[10px] sm:text-xs text-[hsl(var(--success))] mt-1.5 font-medium">{trend}</p>}
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
};
