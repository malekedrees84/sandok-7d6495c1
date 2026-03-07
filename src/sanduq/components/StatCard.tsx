import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, colorClass = "bg-card" }) => {
  return (
    <div className={`${colorClass} rounded-xl shadow-sm p-6 border border-border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
        </div>
        <div className="p-3 bg-primary-50 rounded-full text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
};
