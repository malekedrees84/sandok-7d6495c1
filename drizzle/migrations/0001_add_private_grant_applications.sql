CREATE TABLE public.grant_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 applicant_name text NOT NULL,
 phone text NOT NULL,
 address text NOT NULL DEFAULT '',
 category text NOT NULL,
 requested_amount numeric NOT NULL,
 reason text NOT NULL,
 attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
 review_notes text NOT NULL DEFAULT '',
 reviewed_by uuid,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.grant_applications TO authenticated;
GRANT ALL ON public.grant_applications TO service_role;
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read grant applications" ON public.grant_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins review grant applications" ON public.grant_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.validate_grant_review() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF auth.role() = 'authenticated' THEN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF ROW(NEW.id,NEW.applicant_name,NEW.phone,NEW.address,NEW.category,NEW.requested_amount,NEW.reason,NEW.attachments,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.applicant_name,OLD.phone,OLD.address,OLD.category,OLD.requested_amount,OLD.reason,OLD.attachments,OLD.created_at) THEN RAISE EXCEPTION 'Only review fields may be changed'; END IF;
  NEW.reviewed_by = auth.uid();
  NEW.reviewed_at = now();
 END IF;
 IF length(NEW.review_notes) > 4000 THEN RAISE EXCEPTION 'Review notes too long'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER grant_review_validation BEFORE UPDATE ON public.grant_applications FOR EACH ROW EXECUTE FUNCTION public.validate_grant_review();
CREATE INDEX grant_applications_created_idx ON public.grant_applications (created_at DESC);
CREATE POLICY "Admins read private grant attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'grant-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.grant_submission_limits (key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, window_start timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.grant_submission_limits TO service_role;
ALTER TABLE public.grant_submission_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_grant_submission(attempt_key text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE count_attempts integer;
BEGIN
 INSERT INTO public.grant_submission_limits AS limits(key, attempts, window_start) VALUES(attempt_key,1,now())
 ON CONFLICT (key) DO UPDATE SET attempts = CASE WHEN limits.window_start < now() - interval '1 hour' THEN 1 ELSE limits.attempts + 1 END, window_start = CASE WHEN limits.window_start < now() - interval '1 hour' THEN now() ELSE limits.window_start END RETURNING attempts INTO count_attempts;
 RETURN count_attempts <= 5;
END; $$;
REVOKE ALL ON FUNCTION public.consume_grant_submission(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_grant_submission(text) TO service_role;