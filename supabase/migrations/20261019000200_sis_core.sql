create table if not exists public.sis_memberships (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'district_admin', 'school_admin', 'registrar', 'secretary', 'teacher',
    'sped_case_manager', 'counselor', 'school_nurse', 'state_compliance', 'parent'
  )),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique nulls not distinct (district_id, school_id, user_id, role)
);

create index if not exists sis_memberships_user_scope_idx
  on public.sis_memberships (user_id, district_id, school_id, role)
  where active;

create or replace function public.sis_has_role(
  target_district_id uuid,
  target_school_id uuid,
  allowed_roles text[]
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sis_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.active
      and membership.district_id = target_district_id
      and (membership.school_id is null or membership.school_id = target_school_id)
      and membership.role = any(allowed_roles)
  );
$$;

revoke all on function public.sis_has_role(uuid, uuid, text[]) from public, anon;
grant execute on function public.sis_has_role(uuid, uuid, text[]) to authenticated, service_role;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  grade_level varchar(10) not null,
  enrollment_status text not null default 'enrolled'
    check (enrollment_status in ('enrolled', 'pre_enrolled', 'withdrawn', 'graduated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, district_id, school_id),
  unique (id, district_id)
);

create index if not exists students_school_name_idx
  on public.students (district_id, school_id, last_name, first_name);

create table if not exists public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  guardian_user_id uuid references auth.users(id) on delete set null,
  guardian_name text not null,
  relationship text not null,
  phone_number text not null,
  email text,
  is_primary_contact boolean not null default false,
  is_authorized_pickup boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade
);

create index if not exists student_guardians_student_idx
  on public.student_guardians (student_id, district_id, school_id);

create table if not exists public.student_safety_restrictions (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  restriction_type text not null check (restriction_type in ('custody', 'medical', 'pickup', 'safety')),
  summary text not null,
  details text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade
);

create table if not exists public.student_program_designations (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  designation text not null check (designation in (
    'mckinney_vento', 'direct_cert_lunch', 'english_learner', 'iep', '504'
  )),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  effective_from date,
  effective_to date,
  restricted_notes text,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade
);

create table if not exists public.student_accommodation_badges (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  badge_code text not null,
  display_label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade
);

create table if not exists public.student_state_identifiers (
  student_id uuid primary key,
  district_id uuid not null,
  school_id uuid not null,
  state_code text not null,
  state_student_id text not null,
  verified_at timestamptz,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  unique (district_id, state_code, state_student_id)
);

create table if not exists public.registration_applications (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  student_id uuid references public.students(id) on delete set null,
  application_type text not null default 'new_enrollment'
    check (application_type in ('new_enrollment', 'annual_reenrollment')),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'needs_documents', 'under_review', 'approved', 'rejected')),
  address text,
  geocode_status text not null default 'not_checked'
    check (geocode_status in ('not_checked', 'matched', 'out_of_zone', 'manual_review')),
  document_manifest jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  course_code varchar(30) not null,
  title text not null,
  subject_area text,
  credits numeric(3,2) not null default 1.0,
  unique (district_id, school_id, course_code),
  unique (id, district_id, school_id)
);

create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  course_id uuid not null,
  teacher_id uuid references auth.users(id) on delete set null,
  room_number varchar(20),
  period_number integer not null,
  term_code text not null,
  max_capacity integer not null default 30 check (max_capacity > 0),
  support_staff jsonb not null default '[]'::jsonb,
  foreign key (course_id, district_id, school_id)
    references public.courses(id, district_id, school_id) on delete cascade,
  unique (id, district_id, school_id),
  unique (district_id, school_id, term_code, period_number, room_number)
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  section_id uuid not null,
  enrollment_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'dropped', 'completed')),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade
);

create unique index if not exists course_enrollments_one_active_section_idx
  on public.course_enrollments (student_id, section_id) where status = 'active';

create table if not exists public.sis_reporting_outbox (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  provider text not null check (provider in ('ed_fi', 'oneroster')),
  resource_type text not null,
  resource_id uuid not null,
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'delivered', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists sis_reporting_outbox_pending_idx
  on public.sis_reporting_outbox (next_attempt_at, created_at) where status in ('queued', 'failed');

alter table public.sis_memberships enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.student_safety_restrictions enable row level security;
alter table public.student_program_designations enable row level security;
alter table public.student_accommodation_badges enable row level security;
alter table public.student_state_identifiers enable row level security;
alter table public.registration_applications enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.sis_reporting_outbox enable row level security;

create policy "Users can read their own SIS memberships"
  on public.sis_memberships for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Authorized school staff and linked guardians can read student profiles"
  on public.students for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'secretary', 'school_nurse', 'state_compliance'])
    or exists (
      select 1 from public.sis_memberships membership
      join public.course_sections section on section.teacher_id = membership.user_id
        and section.school_id = students.school_id and section.district_id = students.district_id
      join public.course_enrollments enrollment on enrollment.section_id = section.id
        and enrollment.student_id = students.id and enrollment.status = 'active'
      where membership.user_id = (select auth.uid()) and membership.active and membership.role = 'teacher'
    )
    or exists (
      select 1 from public.student_guardians guardian
      where guardian.student_id = students.id and guardian.guardian_user_id = (select auth.uid())
    )
  );

create policy "Guardians and authorized office staff can read guardian relationships"
  on public.student_guardians for select to authenticated
  using (
    guardian_user_id = (select auth.uid())
    or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'secretary'])
  );

create policy "Authorized safety staff can read student restrictions"
  on public.student_safety_restrictions for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary', 'school_nurse', 'counselor']));

create policy "Authorized specialists can read restricted program designations"
  on public.student_program_designations for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'sped_case_manager', 'school_nurse', 'state_compliance']));

create policy "Assigned teachers and specialists can read active accommodation badges"
  on public.student_accommodation_badges for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'sped_case_manager'])
    or exists (
      select 1 from public.course_sections section
      join public.course_enrollments enrollment on enrollment.section_id = section.id
        and enrollment.student_id = student_accommodation_badges.student_id and enrollment.status = 'active'
      where section.teacher_id = (select auth.uid())
        and section.school_id = student_accommodation_badges.school_id
        and section.district_id = student_accommodation_badges.district_id
    )
  );

create policy "State identifiers restricted to reporting and district staff"
  on public.student_state_identifiers for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'registrar', 'state_compliance']));

create policy "Parents and registrars can read registration applications"
  on public.registration_applications for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar'])
  );

create policy "Parents can create registration applications"
  on public.registration_applications for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and public.sis_has_role(district_id, school_id, array['parent', 'registrar', 'district_admin'])
  );

create policy "Parents can update their own draft applications"
  on public.registration_applications for update to authenticated
  using (submitted_by = (select auth.uid()) and status in ('draft', 'needs_documents'))
  with check (submitted_by = (select auth.uid()) and status in ('draft', 'submitted', 'needs_documents'));

create policy "Authorized school members can read courses"
  on public.courses for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'teacher', 'sped_case_manager', 'state_compliance']));

create policy "Authorized school members can read course sections"
  on public.course_sections for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'teacher', 'sped_case_manager', 'state_compliance']));

create policy "Students and school members can read course enrollments"
  on public.course_enrollments for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'teacher', 'sped_case_manager', 'state_compliance'])
    or exists (select 1 from public.student_guardians guardian where guardian.student_id = course_enrollments.student_id and guardian.guardian_user_id = (select auth.uid()))
  );

revoke all on public.sis_memberships,
  public.students,
  public.student_guardians,
  public.student_safety_restrictions,
  public.student_program_designations,
  public.student_accommodation_badges,
  public.student_state_identifiers,
  public.registration_applications,
  public.courses,
  public.course_sections,
  public.course_enrollments,
  public.sis_reporting_outbox
from anon, authenticated;

grant select on public.sis_memberships,
  public.students,
  public.student_guardians,
  public.student_safety_restrictions,
  public.student_program_designations,
  public.student_accommodation_badges,
  public.student_state_identifiers,
  public.registration_applications,
  public.courses,
  public.course_sections,
  public.course_enrollments
to authenticated;

grant insert, update on public.registration_applications to authenticated;
grant all on public.sis_memberships,
  public.students,
  public.student_guardians,
  public.student_safety_restrictions,
  public.student_program_designations,
  public.student_accommodation_badges,
  public.student_state_identifiers,
  public.registration_applications,
  public.courses,
  public.course_sections,
  public.course_enrollments,
  public.sis_reporting_outbox
to service_role;