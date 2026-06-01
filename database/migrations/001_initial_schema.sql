-- ═══════════════════════════════════════════════════════════════════════════════
-- Memar Platform — Initial Database Migration
-- Run against Supabase PostgreSQL
-- Version: 001
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fast text search

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'client'
    CHECK (role IN ('super_admin','admin','employee','client','guest')),
  full_name_ar    TEXT,
  full_name_en    TEXT,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  preferred_lang  TEXT DEFAULT 'ar' CHECK (preferred_lang IN ('ar','en')),
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_by      UUID REFERENCES auth.users(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLES & PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT UNIQUE NOT NULL,
  permissions     JSONB NOT NULL DEFAULT '[]',
  description_ar  TEXT,
  description_en  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES public.users(id),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SESSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address  INET,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTACTS (CRM)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT DEFAULT 'lead' CHECK (type IN ('lead','client','partner')),
  full_name_ar    TEXT NOT NULL,
  full_name_en    TEXT,
  company_ar      TEXT,
  company_en      TEXT,
  email           TEXT,
  phone           TEXT,
  civil_id        TEXT,
  nationality     TEXT,
  address_ar      TEXT,
  address_en      TEXT,
  source          TEXT,
  pipeline_stage  TEXT DEFAULT 'new',
  assigned_to     UUID REFERENCES public.users(id),
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  user_id         UUID REFERENCES public.users(id),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_by      UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON public.contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned ON public.contacts(assigned_to);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_number      TEXT UNIQUE NOT NULL,
  name_ar             TEXT NOT NULL,
  name_en             TEXT,
  type                TEXT,
  status              TEXT DEFAULT 'active'
    CHECK (status IN ('inquiry','quoted','active','on_hold','completed','cancelled')),
  client_id           UUID REFERENCES public.contacts(id),
  contact_user_id     UUID REFERENCES public.users(id),
  manager_id          UUID REFERENCES public.users(id),
  location_ar         TEXT,
  location_en         TEXT,
  area_sqm            NUMERIC(10,2),
  floors              INTEGER,
  start_date          DATE,
  end_date            DATE,
  budget_kwd          NUMERIC(12,3),
  contract_value_kwd  NUMERIC(12,3),
  contract_url        TEXT,
  scope_ar            TEXT,
  scope_en            TEXT,
  priority            TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','urgent')),
  progress_pct        NUMERIC(5,2) DEFAULT 0,
  tags                TEXT[] DEFAULT '{}',
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  is_deleted          BOOLEAN DEFAULT FALSE,
  deleted_by          UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(manager_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECT STAGES (Dynamic Timeline)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_stages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  status          TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','review','approved','completed')),
  planned_start   DATE,
  planned_end     DATE,
  actual_start    DATE,
  actual_end      DATE,
  progress_pct    NUMERIC(5,2) DEFAULT 0,
  deliverables    JSONB DEFAULT '[]',
  approved_by     UUID REFERENCES public.users(id),
  approved_at     TIMESTAMPTZ,
  notes_ar        TEXT,
  notes_en        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_by      UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_stages_project ON public.project_stages(project_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECT MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  PRIMARY KEY (project_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE HISTORY
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_stage_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id        UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id),
  status_from     TEXT,
  status_to       TEXT,
  action_type     TEXT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stage_history_stage ON public.project_stage_history(stage_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS & MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id    UUID REFERENCES public.project_stages(id) ON DELETE CASCADE,
  title       TEXT,
  is_internal BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  is_deleted  BOOLEAN DEFAULT FALSE,
  deleted_by  UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_conv_project ON public.project_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conv_stage ON public.project_conversations(stage_id);

CREATE TABLE IF NOT EXISTS public.project_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.project_conversations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id),
  sender_role     TEXT, -- e.g. 'client', 'employee'
  body            TEXT NOT NULL,
  attachments     JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_by      UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON public.project_messages(conversation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  stage_id          UUID REFERENCES public.project_stages(id),
  parent_task_id    UUID REFERENCES public.tasks(id),
  title_ar          TEXT NOT NULL,
  title_en          TEXT,
  description       TEXT,
  status            TEXT DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','review','done','cancelled')),
  priority          TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to       UUID REFERENCES public.users(id),
  created_by        UUID REFERENCES public.users(id),
  due_date          DATE,
  estimated_hours   NUMERIC(6,2),
  actual_hours      NUMERIC(6,2),
  tags              TEXT[] DEFAULT '{}',
  order_index       INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_by        UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- TASK TIME LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_time_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id),
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  duration_min  INTEGER,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- APPOINTMENTS + ATTENDEES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar            TEXT NOT NULL,
  title_en            TEXT,
  project_id          UUID REFERENCES public.projects(id),
  type                TEXT DEFAULT 'internal'
    CHECK (type IN ('internal','client','site_visit','review','kick_off')),
  status              TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','ongoing','completed','cancelled','no_show')),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_min        INTEGER DEFAULT 60,
  location_ar         TEXT,
  location_en         TEXT,
  is_virtual          BOOLEAN DEFAULT TRUE,
  room_id             TEXT,
  recording_url       TEXT,
  recording_enabled   BOOLEAN DEFAULT TRUE,
  agenda_ar           TEXT,
  agenda_en           TEXT,
  minutes_ar          TEXT,
  minutes_en          TEXT,
  organizer_id        UUID REFERENCES public.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  is_deleted          BOOLEAN DEFAULT FALSE,
  deleted_by          UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);

CREATE TABLE IF NOT EXISTS public.appointment_attendees (
  appointment_id  UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'invited'
    CHECK (status IN ('invited','accepted','declined','attended','no_show')),
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  PRIMARY KEY (appointment_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FILES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  original_name   TEXT,
  mime_type       TEXT,
  size_bytes      BIGINT,
  storage_path    TEXT NOT NULL,
  public_url      TEXT,
  bucket          TEXT DEFAULT 'memar-files',
  entity_type     TEXT,
  entity_id       UUID,
  version         INTEGER DEFAULT 1,
  parent_file_id  UUID REFERENCES public.files(id),
  is_latest       BOOLEAN DEFAULT TRUE,
  tags            TEXT[] DEFAULT '{}',
  uploaded_by     UUID REFERENCES public.users(id),
  is_public       BOOLEAN DEFAULT FALSE,
  expires_at      TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_by      UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_files_entity ON public.files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_latest ON public.files(is_latest);

CREATE TABLE IF NOT EXISTS public.file_permissions (
  file_id     UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission  TEXT CHECK (permission IN ('view','download','edit','delete')),
  granted_by  UUID REFERENCES public.users(id),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (file_id, user_id, permission)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title_ar    TEXT DEFAULT '',
  title_en    TEXT DEFAULT '',
  body_ar     TEXT DEFAULT '',
  body_en     TEXT DEFAULT '',
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  channel     TEXT DEFAULT 'in_app',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  in_app      BOOLEAN DEFAULT TRUE,
  email       BOOLEAN DEFAULT TRUE,
  sms         BOOLEAN DEFAULT FALSE,
  push        BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, event_type)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INVOICES & PAYMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT UNIQUE NOT NULL,
  project_id      UUID REFERENCES public.projects(id),
  client_id       UUID REFERENCES public.contacts(id),
  type            TEXT DEFAULT 'invoice'
    CHECK (type IN ('invoice','deposit','milestone','final','credit_note')),
  status          TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','partially_paid','paid','overdue','cancelled','void')),
  issue_date      DATE NOT NULL,
  due_date        DATE NOT NULL,
  items           JSONB NOT NULL DEFAULT '[]',
  subtotal_kwd    NUMERIC(12,3) DEFAULT 0,
  vat_kwd         NUMERIC(12,3) DEFAULT 0,
  discount_kwd    NUMERIC(12,3) DEFAULT 0,
  total_kwd       NUMERIC(12,3) NOT NULL DEFAULT 0,
  paid_kwd        NUMERIC(12,3) DEFAULT 0,
  notes_ar        TEXT,
  notes_en        TEXT,
  pdf_url         TEXT,
  prepared_by     UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_by      UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON public.invoices(due_date);

CREATE TABLE IF NOT EXISTS public.payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID REFERENCES public.invoices(id),
  project_id    UUID REFERENCES public.projects(id),
  client_id     UUID REFERENCES public.contacts(id),
  amount_kwd    NUMERIC(12,3) NOT NULL,
  method        TEXT,
  reference_no  TEXT,
  paid_at       TIMESTAMPTZ NOT NULL,
  receipt_url   TEXT,
  notes         TEXT,
  recorded_by   UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.users(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SYSTEM SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES public.users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','contacts','projects','project_stages','project_conversations','project_messages','tasks','appointments','files','invoices']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
      CREATE TRIGGER trg_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files              ENABLE ROW LEVEL SECURITY;

-- Users: see own profile (admin can see all)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin'))
  );

-- Notifications: always personal
CREATE POLICY "notif_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Tasks: own assigned + admins
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    (assigned_to = auth.uid() OR created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin','project_manager')))
    AND is_deleted = FALSE
  );

-- Conversations & Messages: no internal for clients
CREATE POLICY "conversations_visibility" ON public.project_conversations
  FOR SELECT USING (
    (is_internal = FALSE OR
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin','project_manager','engineer')))
    AND is_deleted = FALSE
  );

CREATE POLICY "messages_visibility" ON public.project_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_conversations pc WHERE pc.id = conversation_id AND (
      pc.is_internal = FALSE OR
      EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id
              WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin','project_manager','engineer'))
    ))
    AND is_deleted = FALSE
  );

-- Files: uploaded by user or has permission grant
CREATE POLICY "files_access" ON public.files
  FOR SELECT USING (
    (uploaded_by = auth.uid() OR
    is_public = TRUE OR
    EXISTS (SELECT 1 FROM public.file_permissions fp WHERE fp.file_id = id AND fp.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')))
    AND is_deleted = FALSE
  );
