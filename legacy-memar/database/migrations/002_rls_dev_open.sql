-- ═══════════════════════════════════════════════════════════════════════════════
-- Memar Platform — RLS Open Policies (Development)
-- Run in Supabase Dashboard → SQL Editor
-- !! IMPORTANT: Tighten before production !!
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop existing policies that might block anon access
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ── Allow full anon access for development ──
-- (Will be replaced with proper RLS before production)

CREATE POLICY "anon_full_users"         ON public.users         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_contacts"      ON public.contacts       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_projects"      ON public.projects       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_stages"        ON public.project_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_tasks"         ON public.tasks          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_appointments"  ON public.appointments   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_invoices"      ON public.invoices       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_audit"         ON public.audit_logs     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_files"         ON public.files          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_notifications" ON public.notifications  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_conv"          ON public.project_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_msg"           ON public.project_messages      FOR ALL USING (true) WITH CHECK (true);
