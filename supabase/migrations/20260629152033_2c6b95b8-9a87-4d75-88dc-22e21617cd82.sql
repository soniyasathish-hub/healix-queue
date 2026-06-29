
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'receptionist', 'patient');
CREATE TYPE public.appt_status AS ENUM ('scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.token_status AS ENUM ('waiting', 'called', 'in_progress', 'done', 'skipped');
CREATE TYPE public.priority_level AS ENUM ('normal', 'emergency');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- ============ DEPARTMENTS ============
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Stethoscope',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ============ DOCTORS ============
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  qualification TEXT,
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  avg_consultation_minutes INT DEFAULT 15,
  bio TEXT,
  avatar_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  rating NUMERIC(3,2) DEFAULT 4.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT,
  status appt_status NOT NULL DEFAULT 'scheduled',
  priority priority_level NOT NULL DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============ QUEUE TOKENS ============
CREATE TABLE public.queue_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_number INT NOT NULL,
  token_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status token_status NOT NULL DEFAULT 'waiting',
  priority priority_level NOT NULL DEFAULT 'normal',
  qr_code TEXT,
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_tokens TO authenticated;
GRANT ALL ON public.queue_tokens TO service_role;
ALTER TABLE public.queue_tokens ENABLE ROW LEVEL SECURITY;

-- ============ PRESCRIPTIONS ============
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  diagnosis TEXT,
  medications JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- ============ MEDICAL REPORTS ============
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_reports TO authenticated;
GRANT ALL ON public.medical_reports TO service_role;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

-- ============ FEEDBACK ============
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- profiles
CREATE POLICY "Profiles viewable by all auth users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- departments
CREATE POLICY "Departments public read" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- doctors
CREATE POLICY "Doctors public read" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Admins manage doctors" ON public.doctors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors update self" ON public.doctors FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- appointments
CREATE POLICY "Patient sees own appts" ON public.appointments FOR SELECT TO authenticated
  USING (patient_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'receptionist')
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Patient creates own appts" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() OR public.has_role(auth.uid(), 'receptionist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authorized updates appts" ON public.appointments FOR UPDATE TO authenticated
  USING (patient_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'receptionist')
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Authorized delete appts" ON public.appointments FOR DELETE TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- queue_tokens
CREATE POLICY "Queue visible to auth" ON public.queue_tokens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized insert tokens" ON public.queue_tokens FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() OR public.has_role(auth.uid(), 'receptionist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authorized update tokens" ON public.queue_tokens FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'receptionist')
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));

-- prescriptions
CREATE POLICY "Pres visible to patient/doctor/admin" ON public.prescriptions FOR SELECT TO authenticated
  USING (patient_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- medical_reports
CREATE POLICY "Reports own/admin/doctor" ON public.medical_reports FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Patient manages reports" ON public.medical_reports FOR ALL TO authenticated
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

-- feedback
CREATE POLICY "Feedback readable" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Patient creates feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());

-- notifications
CREATE POLICY "User sees own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "User updates own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Default role: patient
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_appts_touch BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED DATA ============
INSERT INTO public.departments (name, description, icon) VALUES
  ('Cardiology', 'Heart and cardiovascular care', 'Heart'),
  ('Neurology', 'Brain and nervous system', 'Brain'),
  ('Orthopedics', 'Bones, joints and muscles', 'Bone'),
  ('Pediatrics', 'Child healthcare', 'Baby'),
  ('Dermatology', 'Skin, hair and nails', 'Sparkles'),
  ('General Medicine', 'Primary care and general health', 'Stethoscope');

INSERT INTO public.doctors (full_name, specialization, department_id, qualification, experience_years, consultation_fee, avg_consultation_minutes, bio, rating) VALUES
  ('Dr. Aisha Khan', 'Interventional Cardiologist', (SELECT id FROM public.departments WHERE name='Cardiology'), 'MD, DM Cardiology', 12, 800, 18, '12 years of experience treating complex cardiac conditions.', 4.9),
  ('Dr. Rohan Mehta', 'Neurologist', (SELECT id FROM public.departments WHERE name='Neurology'), 'MD, DM Neurology', 9, 700, 20, 'Specialist in stroke care and epilepsy management.', 4.8),
  ('Dr. Priya Nair', 'Orthopedic Surgeon', (SELECT id FROM public.departments WHERE name='Orthopedics'), 'MS Ortho', 14, 750, 15, 'Joint replacement and sports injury expert.', 4.9),
  ('Dr. Sameer Joshi', 'Pediatrician', (SELECT id FROM public.departments WHERE name='Pediatrics'), 'MD Pediatrics', 8, 500, 12, 'Caring for newborns to adolescents.', 4.7),
  ('Dr. Lina Park', 'Dermatologist', (SELECT id FROM public.departments WHERE name='Dermatology'), 'MD Dermatology', 7, 600, 12, 'Cosmetic and clinical dermatology.', 4.8),
  ('Dr. Arjun Rao', 'General Physician', (SELECT id FROM public.departments WHERE name='General Medicine'), 'MBBS, MD', 11, 400, 10, 'Primary care for the whole family.', 4.6);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
