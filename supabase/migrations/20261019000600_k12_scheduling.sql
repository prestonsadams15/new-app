insert into public.sis_role_permissions (role, permission_key, access_mode) values
  ('district_admin', 'scheduling.config.manage', 'full'),
  ('school_admin', 'scheduling.config.manage', 'school'),
  ('registrar', 'scheduling.config.manage', 'school'),
  ('teacher', 'scheduling.config.read', 'school'),
  ('paraprofessional', 'scheduling.config.read', 'assigned'),
  ('substitute', 'scheduling.config.read', 'sub_plans'),
  ('district_admin', 'scheduling.placement.read', 'full'),
  ('school_admin', 'scheduling.placement.read', 'school'),
  ('teacher', 'scheduling.placement.read', 'class_roster'),
  ('sped_case_manager', 'scheduling.placement.read', 'assigned'),
  ('district_admin', 'scheduling.run.manage', 'full'),
  ('school_admin', 'scheduling.run.manage', 'school'),
  ('registrar', 'scheduling.run.manage', 'school'),
  ('district_admin', 'scheduling.run.read', 'full'),
  ('school_admin', 'scheduling.run.read', 'school'),
  ('teacher', 'scheduling.run.read', 'school'),
  ('parent', 'scheduling.request.create', 'own_children'),
  ('student', 'scheduling.request.create', 'self')
on conflict (role, permission_key) do update
set access_mode = excluded.access_mode, updated_at = now();

create table if not exists public.grade_scheduling_configs (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  grade_level varchar(10) not null,
  scheduling_model varchar(30) not null check (scheduling_model in ('elementary_homeroom', 'middle_pod', 'secondary_master')),
  target_class_size integer not null default 24 check (target_class_size > 0),
  max_class_size integer not null default 28 check (max_class_size >= target_class_size),
  max_iep_percentage numeric(5,2) not null default 20.00 check (max_iep_percentage between 0 and 100),
  schedule_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (district_id, school_id, grade_level)
);

create table if not exists public.specialist_rotations (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  grade_level varchar(10) not null,
  rotation_name text not null,
  day_cycle_count integer not null default 5 check (day_cycle_count between 1 and 20),
  rotation_pattern jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, district_id, school_id)
);

create table if not exists public.specialist_rotation_assignments (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid not null,
  district_id uuid not null,
  school_id uuid not null,
  homeroom_label text not null,
  day_index integer not null check (day_index >= 0),
  block_label text not null,
  specialist_subject text not null check (specialist_subject in ('PE', 'Art', 'Music', 'Library', 'STEAM', 'Other')),
  specialist_user_id uuid references auth.users(id) on delete set null,
  room_number text,
  created_at timestamptz not null default now(),
  foreign key (rotation_id, district_id, school_id)
    references public.specialist_rotations(id, district_id, school_id) on delete cascade,
  unique (rotation_id, homeroom_label, day_index, block_label),
  unique (rotation_id, specialist_user_id, day_index, block_label)
);

create table if not exists public.elementary_placement_cards (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  academic_year varchar(10) not null,
  reading_tier integer check (reading_tier between 1 and 3),
  math_tier integer check (math_tier between 1 and 3),
  behavior_rating integer check (behavior_rating between 1 and 3),
  placement_notes text,
  peer_relationship_flags jsonb not null default '[]'::jsonb,
  recommended_teacher_id uuid references auth.users(id) on delete set null,
  created_by_teacher_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  unique (student_id, academic_year)
);

create table if not exists public.secondary_course_requests (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  course_id uuid not null,
  academic_year varchar(10) not null,
  priority_rank integer not null default 1 check (priority_rank > 0),
  request_status text not null default 'requested' check (request_status in ('requested', 'waitlisted', 'scheduled', 'denied', 'withdrawn')),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  foreign key (course_id, district_id, school_id)
    references public.courses(id, district_id, school_id) on delete cascade,
  unique (student_id, course_id, academic_year)
);

create table if not exists public.scheduling_runs (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  academic_year varchar(10) not null,
  grade_level varchar(10) not null,
  scheduling_model varchar(30) not null check (scheduling_model in ('elementary_homeroom', 'middle_pod', 'secondary_master')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'cancelled')),
  algorithm_version text not null,
  input_summary jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  unique (id, district_id, school_id)
);

create table if not exists public.scheduling_run_assignments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  section_id uuid,
  homeroom_label text,
  assignment_status text not null default 'proposed' check (assignment_status in ('proposed', 'accepted', 'conflict', 'rejected')),
  conflict_reason text,
  created_at timestamptz not null default now(),
  foreign key (run_id, district_id, school_id)
    references public.scheduling_runs(id, district_id, school_id) on delete cascade,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete restrict
);

create index if not exists scheduling_runs_scope_year_idx
  on public.scheduling_runs (district_id, school_id, academic_year, created_at desc);
create index if not exists course_requests_student_year_idx
  on public.secondary_course_requests (student_id, academic_year, priority_rank);
create index if not exists placement_cards_grade_year_idx
  on public.elementary_placement_cards (district_id, school_id, academic_year, student_id);

alter table public.grade_scheduling_configs enable row level security;
alter table public.specialist_rotations enable row level security;
alter table public.specialist_rotation_assignments enable row level security;
alter table public.elementary_placement_cards enable row level security;
alter table public.secondary_course_requests enable row level security;
alter table public.scheduling_runs enable row level security;
alter table public.scheduling_run_assignments enable row level security;

create policy "Scheduling configs read by authorized school members"
  on public.grade_scheduling_configs for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.config.read'));
create policy "Scheduling configs managed by district schedulers"
  on public.grade_scheduling_configs for all to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.config.manage'))
  with check (public.sis_has_permission(district_id, school_id, 'scheduling.config.manage'));

create policy "Specialist rotations read by authorized school members"
  on public.specialist_rotations for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.config.read'));
create policy "Specialist rotations managed by district schedulers"
  on public.specialist_rotations for all to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.config.manage'))
  with check (public.sis_has_permission(district_id, school_id, 'scheduling.config.manage'));
create policy "Specialist rotation assignments read by authorized school members"
  on public.specialist_rotation_assignments for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.config.read'));
create policy "Specialist rotation assignments managed by district schedulers"
  on public.specialist_rotation_assignments for all to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.config.manage'))
  with check (public.sis_has_permission(district_id, school_id, 'scheduling.config.manage'));

create policy "Placement cards read only by authorized assigned staff"
  on public.elementary_placement_cards for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.placement.read', student_id));
create policy "Teachers create their own placement cards for roster students"
  on public.elementary_placement_cards for insert to authenticated
  with check (
    created_by_teacher_id = (select auth.uid())
    and public.sis_has_permission(district_id, school_id, 'student.profile.read', student_id)
    and public.sis_has_role(district_id, school_id, array['teacher'])
  );
create policy "Teachers update their own placement cards"
  on public.elementary_placement_cards for update to authenticated
  using (created_by_teacher_id = (select auth.uid()) and public.sis_has_role(district_id, school_id, array['teacher']))
  with check (created_by_teacher_id = (select auth.uid()) and public.sis_has_role(district_id, school_id, array['teacher']));
create policy "School leaders manage placement cards"
  on public.elementary_placement_cards for all to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']))
  with check (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']));

create policy "Students and guardians read their course requests"
  on public.secondary_course_requests for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'student.profile.read', student_id));
create policy "Students and guardians create own course requests"
  on public.secondary_course_requests for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and public.sis_has_permission(district_id, school_id, 'scheduling.request.create', student_id)
  );
create policy "School schedulers manage course requests"
  on public.secondary_course_requests for all to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.run.manage'))
  with check (public.sis_has_permission(district_id, school_id, 'scheduling.run.manage'));

create policy "Scheduling runs read by authorized school members"
  on public.scheduling_runs for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.run.read'));
create policy "Authorized schedulers create draft runs"
  on public.scheduling_runs for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'draft'
    and public.sis_has_permission(district_id, school_id, 'scheduling.run.manage')
  );
create policy "Authorized schedulers update schedule runs"
  on public.scheduling_runs for update to authenticated
  using (public.sis_has_permission(district_id, school_id, 'scheduling.run.manage'))
  with check (public.sis_has_permission(district_id, school_id, 'scheduling.run.manage'));
create policy "Schedule assignments read by authorized staff or linked students"
  on public.scheduling_run_assignments for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'student.profile.read', student_id));

revoke all on public.grade_scheduling_configs, public.specialist_rotations,
  public.specialist_rotation_assignments, public.elementary_placement_cards,
  public.secondary_course_requests, public.scheduling_runs,
  public.scheduling_run_assignments
from anon, authenticated;

grant select, insert, update, delete on public.grade_scheduling_configs,
  public.specialist_rotations, public.specialist_rotation_assignments,
  public.elementary_placement_cards, public.secondary_course_requests,
  public.scheduling_runs to authenticated;
grant select on public.scheduling_run_assignments to authenticated;
grant all on public.grade_scheduling_configs, public.specialist_rotations,
  public.specialist_rotation_assignments, public.elementary_placement_cards,
  public.secondary_course_requests, public.scheduling_runs,
  public.scheduling_run_assignments to service_role;