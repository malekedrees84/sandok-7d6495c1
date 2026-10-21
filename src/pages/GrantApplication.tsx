import { HandCoins } from 'lucide-react';
import { GrantApplicationForm } from '@/sanduq/components/GrantApplicationForm';

const GrantApplication = () => {
  return (
    <div dir="rtl" className="relative min-h-dvh overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 animate-gradient-shift bg-[linear-gradient(120deg,hsl(var(--primary)/0.18),hsl(var(--secondary)/0.55),hsl(var(--accent)/0.25),hsl(var(--primary)/0.18))] bg-[length:300%_300%]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="animate-fade-in-up mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <HandCoins className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">طلب منحة من صندوق العائلة</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            املأ البيانات وأرفق المستندات المطلوبة. يصلك رقم طلب فور الإرسال، وتتم مراجعة الطلب من إدارة الصندوق.
          </p>
        </header>

        <main className="animate-fluent-reveal rounded-2xl border border-border/70 bg-card/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
          <GrantApplicationForm />
        </main>

        <footer className="mt-8 text-center text-xs text-muted-foreground sm:text-sm">
          جميع الحقوق محفوظة لدى المبرمج مالك ادريس
        </footer>
      </div>
    </div>
  );
};

export default GrantApplication;
