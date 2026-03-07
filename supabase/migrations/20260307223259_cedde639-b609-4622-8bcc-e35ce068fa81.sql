
CREATE TABLE public.treasury_transactions (
  id text NOT NULL PRIMARY KEY,
  holder text NOT NULL,
  type text NOT NULL DEFAULT 'deposit',
  amount numeric NOT NULL,
  description text DEFAULT '',
  date text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to treasury_transactions" ON public.treasury_transactions FOR ALL USING (true) WITH CHECK (true);
