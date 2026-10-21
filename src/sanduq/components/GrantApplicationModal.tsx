import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { GrantApplicationForm } from './GrantApplicationForm';

export function GrantApplicationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent dir="rtl" aria-describedby={undefined} className="w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-lg bg-card p-5 sm:p-6">
      <DialogTitle className="flex items-center gap-2 pr-5 text-right tracking-normal"><FileText className="text-primary" /> طلب منحة من الصندوق</DialogTitle>
      <GrantApplicationForm />
    </DialogContent>
  </Dialog>;
}
