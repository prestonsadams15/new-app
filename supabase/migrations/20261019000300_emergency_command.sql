create table if not exists public.emergency_incidents (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  initiated_by_user_id uuid not null references auth.users(id) on delete restrict,
  tier_level text not null check (tier_level in ('tier_1_yellow', 'tier_2_orange', 'tier_3_red')),
  incident_type text not null check (incident_type in ('lockdown', 'fire', 'medical', 'active_threat', 'other')),
  building_zone text,
  status text not null default 'active' check (status in ('active', 'all_clear', 'resolved')),
  dispatch_notified boolean not null default false,
  dispatch_reference text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (id, district_id, school_id)
);

create index if not exists emergency_incidents_school_active_idx
  on public.emergency_incidents (district_id, school_id, created_at desc)
  where status = 'active';

create table if not exists public.emergency_student_status (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null,
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  reported_by_user_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('unreported', 'accounted_for', 'missing', 'extra_student')),
  current_location_room text,
  notes text,
  updated_at timestamptz not null default now(),
  foreign key (incident_id, district_id, school_id)
    references public.emergency_incidents(id, district_id, school_id) on delete cascade,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete restrict,
  unique (incident_id, student_id)
);

create index if not exists emergency_student_status_incident_idx
  on public.emergency_student_status (incident_id, status, school_id);

create table if not exists public.emergency_staff_status (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null,
  district_id uuid not null,
  school_id uuid not null,
  staff_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'unconfirmed' check (status in ('unconfirmed', 'secured', 'needs_assistance', 'evacuated')),
  current_location_room text,
  student_headcount integer not null default 0 check (student_headcount >= 0),
  reported_at timestamptz,
  foreign key (incident_id, district_id, school_id)
    references public.emergency_incidents(id, district_id, school_id) on delete cascade,
  unique (incident_id, staff_user_id)
);

create table if not exists public.emergency_external_presence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null,
  district_id uuid not null,
  school_id uuid not null,
  person_type text not null check (person_type in ('visitor', 'substitute', 'contractor')),
  display_name text not null,
  current_location_room text,
  status text not null default 'unreported' check (status in ('unreported', 'accounted_for', 'missing', 'evacuated')),
  updated_at timestamptz not null default now(),
  foreign key (incident_id, district_id, school_id)
    references public.emergency_incidents(id, district_id, school_id) on delete cascade
);

create table if not exists public.emergency_event_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null,
  district_id uuid not null,
  school_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (incident_id, district_id, school_id)
    references public.emergency_incidents(id, district_id, school_id) on delete cascade
);

create index if not exists emergency_event_log_incident_time_idx
  on public.emergency_event_log (incident_id, created_at desc);

alter table public.emergency_incidents enable row level security;
alter table public.emergency_student_status enable row level security;
alter table public.emergency_staff_status enable row level security;
alter table public.emergency_external_presence enable row level security;
alter table public.emergency_event_log enable row level security;

create policy "Safety and school staff can read scoped incidents"
  on public.emergency_incidents for select to authenticated
  using (public.sis_has_role(district_id, school_id, array[
    'district_admin', 'school_admin', 'secretary', 'teacher', 'sped_case_manager', 'counselor', 'school_nurse'
  ]));

create policy "Safety and school staff can read student accountability"
  on public.emergency_student_status for select to authenticated
  using (public.sis_has_role(district_id, school_id, array[
    'district_admin', 'school_admin', 'secretary', 'teacher', 'sped_case_manager', 'counselor', 'school_nurse'
  ]));

create policy "Safety and school staff can read staff accountability"
  on public.emergency_staff_status for select to authenticated
  using (public.sis_has_role(district_id, school_id, array[
    'district_admin', 'school_admin', 'secretary', 'teacher', 'sped_case_manager', 'counselor', 'school_nurse'
  ]));

create policy "Safety and school staff can read visitor accountability"
  on public.emergency_external_presence for select to authenticated
  using (public.sis_has_role(district_id, school_id, array[
    'district_admin', 'school_admin', 'secretary', 'teacher', 'sped_case_manager', 'counselor', 'school_nurse'
  ]));

create policy "Safety and school staff can read incident event history"
  on public.emergency_event_log for select to authenticated
  using (public.sis_has_role(district_id, school_id, array[
    'district_admin', 'school_admin', 'secretary', 'teacher', 'sped_case_manager', 'counselor', 'school_nurse'
  ]));

revoke all on public.emergency_incidents,
  public.emergency_student_status,
  public.emergency_staff_status,
  public.emergency_external_presence,
  public.emergency_event_log
from anon, authenticated;

grant select on public.emergency_incidents,
  public.emergency_student_status,
  public.emergency_staff_status,
  public.emergency_external_presence,
  public.emergency_event_log
to authenticated;

grant all on public.emergency_incidents,
  public.emergency_student_status,
  public.emergency_staff_status,
  public.emergency_external_presence,
  public.emergency_event_log
to service_role;