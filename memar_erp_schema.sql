-- =====================================================================================
-- MEMAR ERP - COMPREHENSIVE DATABASE SCHEMA
-- Features: Real-Time Sync Ready, Foreign Keys, Indexes, Audit Trails, Soft Deletes
-- =====================================================================================

-- 1. System Settings & Enums
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);

-- 2. Roles & Permissions (Granular RBAC)
CREATE TABLE IF NOT EXISTS public.roles (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false, -- To prevent deletion of core roles (Admin, Viewer)
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id text REFERENCES public.roles(id) ON DELETE CASCADE,
    module text NOT NULL,
    can_read boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    UNIQUE(role_id, module)
);

-- 3. Core Users Table (Single Source of Truth)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id text REFERENCES public.roles(id),
    full_name text NOT NULL,
    email text UNIQUE,
    phone text,
    account_type text NOT NULL, -- 'employee', 'client', 'company', 'admin'
    status text DEFAULT 'active', -- 'active', 'suspended', 'deleted'
    password_hash text,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);

-- 4. Employees Profile (Extends Users)
CREATE TABLE IF NOT EXISTS public.employees (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    department text,
    position text,
    hierarchy_level int DEFAULT 99,
    base_salary numeric(10, 2),
    joining_date date,
    manager_id uuid REFERENCES public.employees(user_id)
);

-- 5. Clients Profile (Extends Users)
CREATE TABLE IF NOT EXISTS public.clients (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    client_type text DEFAULT 'individual', -- 'individual', 'company'
    company_name text,
    commercial_record text,
    tax_id text,
    address text,
    lead_source text
);

-- 6. CRM Leads & Meetings
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(user_id),
    title text NOT NULL,
    status text DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
    expected_value numeric(12, 2),
    assigned_to uuid REFERENCES public.employees(user_id),
    expected_close_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.crm_leads(id),
    client_id uuid REFERENCES public.clients(user_id),
    host_id uuid REFERENCES public.employees(user_id),
    title text NOT NULL,
    meeting_time timestamp with time zone NOT NULL,
    meeting_link text,
    status text DEFAULT 'scheduled', -- 'scheduled', 'completed', 'canceled'
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 7. Pricing Engine Services & Packages
CREATE TABLE IF NOT EXISTS public.price_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category text NOT NULL,
    name text NOT NULL,
    base_price numeric(10, 2) NOT NULL,
    unit text DEFAULT 'متر',
    description text,
    is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.price_packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    discount_percentage numeric(5, 2) DEFAULT 0,
    services_included jsonb, -- Array of service IDs
    is_active boolean DEFAULT true
);

-- 8. Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number text UNIQUE NOT NULL,
    client_id uuid REFERENCES public.clients(user_id),
    lead_id uuid REFERENCES public.crm_leads(id),
    created_by uuid REFERENCES public.employees(user_id),
    total_amount numeric(12, 2),
    discount numeric(12, 2) DEFAULT 0,
    net_amount numeric(12, 2),
    status text DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
    valid_until date,
    created_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE,
    service_id uuid REFERENCES public.price_services(id),
    description text,
    quantity numeric(10, 2) DEFAULT 1,
    unit_price numeric(10, 2),
    total_price numeric(10, 2)
);

-- 9. Projects & Tasks
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id uuid REFERENCES public.quotations(id),
    client_id uuid REFERENCES public.clients(user_id),
    manager_id uuid REFERENCES public.employees(user_id),
    name text NOT NULL,
    status text DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'completed'
    start_date date,
    expected_end_date date,
    actual_end_date date,
    progress_percentage int DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES public.employees(user_id),
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
    priority text DEFAULT 'medium',
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 10. Financials (Contracts, Invoices, Payments, Expenses)
CREATE TABLE IF NOT EXISTS public.contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id),
    client_id uuid REFERENCES public.clients(user_id),
    contract_number text UNIQUE,
    total_value numeric(15, 2) NOT NULL,
    signed_date date,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id uuid REFERENCES public.contracts(id),
    client_id uuid REFERENCES public.clients(user_id),
    invoice_number text UNIQUE NOT NULL,
    amount numeric(12, 2) NOT NULL,
    tax_amount numeric(12, 2) DEFAULT 0,
    total_amount numeric(12, 2) NOT NULL,
    due_date date,
    status text DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'canceled'
    created_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id),
    client_id uuid REFERENCES public.clients(user_id),
    amount numeric(12, 2) NOT NULL,
    payment_method text,
    payment_date timestamp with time zone DEFAULT now(),
    receipt_number text UNIQUE,
    status text DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id), -- Optional (General vs Project expense)
    recorded_by uuid REFERENCES public.employees(user_id),
    category text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    expense_date date NOT NULL,
    description text,
    receipt_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 11. HR (Attendance & Salaries)
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid REFERENCES public.employees(user_id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    status text DEFAULT 'present', -- 'present', 'absent', 'late', 'leave'
    notes text,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS public.salaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid REFERENCES public.employees(user_id),
    month varchar(7) NOT NULL, -- Format 'YYYY-MM'
    base_salary numeric(10, 2) NOT NULL,
    bonuses numeric(10, 2) DEFAULT 0,
    deductions numeric(10, 2) DEFAULT 0,
    net_salary numeric(10, 2) NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'paid'
    payment_date date,
    UNIQUE(employee_id, month)
);

-- 12. Communication & Audit
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id),
    receiver_id uuid REFERENCES public.users(id),
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    action text NOT NULL,
    entity text, -- 'Invoice', 'Project', etc.
    entity_id uuid,
    details jsonb,
    ip_address text,
    device_info text,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================================================
-- ENABLE REALTIME FOR ALL CRITICAL TABLES
-- =====================================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================================================
-- PERFORMANCE INDEXES
-- =====================================================================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_tasks_assignee ON public.project_tasks(assigned_to);
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_logs_user ON public.activity_logs(user_id);
