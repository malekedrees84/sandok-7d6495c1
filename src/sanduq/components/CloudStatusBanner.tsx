import React, { useEffect, useState, useCallback } from 'react';
import { CloudOff, Cloud, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type CloudState = 'checking' | 'online' | 'starting' | 'paused' | 'error';

const CONFIG: Record<Exclude<CloudState, 'online'>, { label: string; hint: string; cls: string; Icon: any }> = {
  checking: {
    label: 'جاري فحص الاتصال بالسحابة...',
    hint: 'يتم التحقق من جاهزية قاعدة البيانات',
    cls: 'bg-muted text-muted-foreground border-border',
    Icon: Loader2,
  },
  starting: {
    label: 'السحابة قيد التشغيل أو تطبيق التغييرات',
    hint: 'البيانات محفوظة، لكن القاعدة لسّاتها بتجهّز. جرّب بعد لحظات.',
    cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    Icon: Loader2,
  },
  paused: {
    label: 'السحابة متوقفة (نفدت الكريدت)',
    hint: 'البيانات آمنة لكن غير متاحة حتى إضافة كريدت أو تفعيل الخطة.',
    cls: 'bg-destructive/15 text-destructive border-destructive/30',
    Icon: CloudOff,
  },
  error: {
    label: 'تعذّر الوصول إلى قاعدة البيانات',
    hint: 'تحقق من الاتصال بالإنترنت ثم أعد المحاولة.',
    cls: 'bg-destructive/15 text-destructive border-destructive/30',
    Icon: AlertTriangle,
  },
};

export const CloudStatusBanner: React.FC = () => {
  const [state, setState] = useState<CloudState>('checking');
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const { error } = await supabase.from('members').select('id', { head: true, count: 'exact' }).limit(1);
      if (!error) {
        setState('online');
      } else {
        const msg = `${error.message || ''} ${(error as any).code || ''}`.toLowerCase();
        if (msg.includes('paused') || msg.includes('inactive') || msg.includes('503') || msg.includes('540')) setState('paused');
        else if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('502')) setState('starting');
        else setState('error');
      }
    } catch {
      setState('starting');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [check]);

  if (state === 'online') {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
          <Cloud size={12} />
          <span>متصل بالسحابة</span>
        </div>
      </div>
    );
  }

  const { label, hint, cls, Icon } = CONFIG[state];
  const spin = state === 'checking' || state === 'starting';

  return (
    <div className="max-w-7xl mx-auto px-4 pt-2">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${cls}`}>
        <Icon size={16} className={spin ? 'animate-spin shrink-0' : 'shrink-0'} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{label}</p>
          <p className="text-[10px] opacity-80">{hint}</p>
        </div>
        <button
          onClick={check}
          disabled={checking}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-current/30 px-2 py-1 text-[10px] font-medium hover:opacity-80 disabled:opacity-50"
        >
          <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>
    </div>
  );
};
