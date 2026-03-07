-- Members table
CREATE TABLE public.members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  join_date TEXT NOT NULL,
  paid_until TEXT NOT NULL,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  last_reminder_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to members" ON public.members FOR ALL USING (true) WITH CHECK (true);

-- Payments table
CREATE TABLE public.payments (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  months_covered INTEGER NOT NULL DEFAULT 1,
  previous_paid_until TEXT DEFAULT '',
  new_paid_until TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Expenses table
CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Visitor logs table
CREATE TABLE public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to visitor_logs" ON public.visitor_logs FOR ALL USING (true) WITH CHECK (true);

-- Announcements table
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY,
  text TEXT DEFAULT '',
  image TEXT,
  created_at_text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);