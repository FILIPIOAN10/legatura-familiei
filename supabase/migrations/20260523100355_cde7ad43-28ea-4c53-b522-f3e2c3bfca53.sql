
-- ==== ENUMS ====
CREATE TYPE public.app_role AS ENUM ('family','doctor','civil_officer','funeral_provider','notary','admin');
CREATE TYPE public.case_status AS ENUM ('DRAFT','AWAITING_DOCTOR','CMCD_ISSUED','AWAITING_CIVIL_OFFICER','DEATH_CERT_ISSUED','FUNERAL_SCHEDULED','FUNERAL_COMPLETED','SUCCESSION_OPEN','SUCCESSION_CLOSED','ARCHIVED');
CREATE TYPE public.death_cause_type AS ENUM ('natural','violent','suspect','unknown');
CREATE TYPE public.document_type AS ENUM ('cmcd','death_certificate','burial_permit','parquet_release','funeral_contract','inheritance_acceptance','inheritance_certificate','id_card','birth_certificate','marriage_certificate','other');
CREATE TYPE public.task_status AS ENUM ('todo','in_progress','done','skipped');

-- ==== PROFILES ====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  cnp text,
  phone text,
  county text,
  city text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==== USER ROLES ====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_user_county(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT county FROM public.profiles WHERE id = _user_id
$$;

-- ==== CASES ====
CREATE SEQUENCE public.case_number_seq START 1000;
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL DEFAULT ('RO-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.case_number_seq')::text, 6, '0')),
  status public.case_status NOT NULL DEFAULT 'DRAFT',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  deceased_full_name text NOT NULL,
  deceased_cnp text,
  deceased_dob date,
  deceased_dod timestamptz NOT NULL,
  death_location text,
  death_cause_type public.death_cause_type NOT NULL DEFAULT 'natural',
  city text,
  county text,
  address text,
  assigned_doctor uuid REFERENCES auth.users(id),
  assigned_civil_officer uuid REFERENCES auth.users(id),
  assigned_funeral_provider uuid REFERENCES auth.users(id),
  assigned_notary uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_county ON public.cases(county);

-- ==== DOCUMENTS ====
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  type public.document_type NOT NULL,
  title text NOT NULL,
  storage_path text,
  uploaded_by uuid REFERENCES auth.users(id),
  signed boolean NOT NULL DEFAULT false,
  signature_meta jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_documents_case ON public.documents(case_id);

-- ==== TASKS ====
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  role_responsible public.app_role,
  status public.task_status NOT NULL DEFAULT 'todo',
  legal_deadline timestamptz,
  legal_reference text,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tasks_case ON public.tasks(case_id);

-- ==== NOTIFICATIONS ====
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at);

-- ==== AUDIT LOG ====
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ==== RLS POLICIES ====

-- profiles
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- user_roles: users can read own roles; admin can read/write all
CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- cases
CREATE POLICY "cases_family_own" ON public.cases FOR SELECT TO authenticated USING (
  created_by = auth.uid()
  OR assigned_doctor = auth.uid()
  OR assigned_civil_officer = auth.uid()
  OR assigned_funeral_provider = auth.uid()
  OR assigned_notary = auth.uid()
  OR (public.has_role(auth.uid(),'doctor') AND status = 'AWAITING_DOCTOR' AND county = public.get_user_county(auth.uid()))
  OR (public.has_role(auth.uid(),'civil_officer') AND status IN ('CMCD_ISSUED','AWAITING_CIVIL_OFFICER') AND county = public.get_user_county(auth.uid()))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "cases_family_insert" ON public.cases FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(),'family'));
CREATE POLICY "cases_update" ON public.cases FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
  OR assigned_doctor = auth.uid()
  OR assigned_civil_officer = auth.uid()
  OR public.has_role(auth.uid(),'admin')
);

-- documents: visible to anyone who can see the case
CREATE POLICY "documents_read" ON public.documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id)
);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (
  uploaded_by = auth.uid()
);
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- tasks
CREATE POLICY "tasks_read" ON public.tasks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id)
);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id)
);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);

-- notifications: self only
CREATE POLICY "notif_self_read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_self_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- audit: append-only, readable by admin or case viewers
CREATE POLICY "audit_read" ON public.audit_log FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id)
);
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ==== TRIGGERS ====

-- updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_cases_updated BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- on signup: create profile + default family role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'family'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==== STORAGE BUCKET ====
INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents','case-documents', false) ON CONFLICT DO NOTHING;

CREATE POLICY "case_docs_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'case-documents');
CREATE POLICY "case_docs_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'case-documents' AND owner = auth.uid());
CREATE POLICY "case_docs_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'case-documents' AND owner = auth.uid());
