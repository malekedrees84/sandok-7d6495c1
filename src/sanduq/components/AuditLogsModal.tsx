import React from 'react';
import { AuditLog } from '../types';
import { X, ShieldCheck, Clock, User, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-green-400" />
            <h2 className="text-lg font-bold">سجل العمليات والرقابة</h2>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="overflow-auto flex-1 bg-gray-50 p-6">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Activity size={48} className="mx-auto mb-2 opacity-20" />
              <p>لا يوجد سجلات حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${log.user === 'Admin' ? 'bg-purple-100 text-purple-600' : log.user.includes('Edrees') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{log.user}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-muted-foreground">{log.action}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground md:self-start">
                    <Clock size={12} />
                    <span dir="ltr">{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
