alter table public.sis_memberships
  add column if not exists access_expires_at timestamptz;

alter table public.sis_memberships
  drop constraint if exists sis_memberships_role_check;

alter table public.sis_memberships
  add constraint sis_memberships_role_check check (role in (
    'district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional',
    'substitute', 'parent', 'student', 'registrar', 'sped_case_manager',
    'counselor', 'school_nurse', 'state_compliance'
  ));

create table if not exists public.sis_role_permissions (
  role text not null check (role in (
    'district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional',
    'substitute', 'parent', 'student', 'registrar', 'sped_case_manager',
    'counselor', 'school_nurse', 'state_compliance'
  )),
  permission_key text not null,
  access_mode text not null check (access_mode in (
    'full', 'school', 'office', 'operator', 'class_roster', 'assigned',
    'room_checkin', 'view_only', 'sub_plans', 'own_children', 'self',
    'submit', 'analytics', 'none'
  )),
  updated_at timestamptz not null default now(),
  primary key (role, permission_key)
);

insert into public.sis_role_permissions (role, permission_key, access_mode) values
  ('district_admin', 'student.profile.read', 'full'),
  ('school_admin', 'student.profile.read', 'full'),
  ('secretary', 'student.profile.read', 'full'),
  ('teacher', 'student.profile.read', 'class_roster'),
  ('paraprofessional', 'student.profile.read', 'assigned'),
  ('substitute', 'student.profile.read', 'assigned'),
  ('parent', 'student.profile.read', 'own_children'),
  ('student', 'student.profile.read', 'self'),
  ('registrar', 'student.profile.read', 'school'),
  ('district_admin', 'student.custody.read', 'full'),
  ('school_admin', 'student.custody.read', 'school'),
  ('secretary', 'student.custody.read', 'office'),
  ('district_admin', 'student.medical.read', 'full'),
  ('school_admin', 'student.medical.read', 'school'),
  ('secretary', 'student.medical.read', 'office'),
  ('school_nurse', 'student.medical.read', 'assigned'),
  ('district_admin', 'student.guardian_contact.read', 'full'),
  ('school_admin', 'student.guardian_contact.read', 'school'),
  ('secretary', 'student.guardian_contact.read', 'office'),
  ('parent', 'student.guardian_contact.read', 'own_children'),
  ('district_admin', 'student.designations.read', 'full'),
  ('school_admin', 'student.designations.read', 'school'),
  ('sped_case_manager', 'student.designations.read', 'assigned'),
  ('school_nurse', 'student.designations.read', 'assigned'),
  ('parent', 'student.designations.read', 'own_children'),
  ('student', 'student.designations.read', 'self'),
  ('district_admin', 'student.state_identifier.read', 'full'),
  ('registrar', 'student.state_identifier.read', 'school'),
  ('state_compliance', 'student.state_identifier.read', 'school'),
  ('district_admin', 'course.roster.read', 'full'),
  ('school_admin', 'course.roster.read', 'school'),
  ('secretary', 'course.roster.read', 'view_only'),
  ('teacher', 'course.roster.read', 'class_roster'),
  ('paraprofessional', 'course.roster.read', 'assigned'),
  ('substitute', 'course.roster.read', 'sub_plans'),
  ('parent', 'course.roster.read', 'own_children'),
  ('student', 'course.roster.read', 'self'),
  ('district_admin', 'attendance.kiosk.manage', 'full'),
  ('school_admin', 'attendance.kiosk.manage', 'full'),
  ('secretary', 'attendance.kiosk.manage', 'operator'),
  ('teacher', 'attendance.kiosk.manage', 'class_roster'),
  ('substitute', 'attendance.kiosk.manage', 'room_checkin'),
  ('student', 'attendance.kiosk.manage', 'self'),
  ('district_admin', 'safety.incident.read', 'full'),
  ('school_admin', 'safety.incident.read', 'school'),
  ('secretary', 'safety.incident.read', 'office'),
  ('teacher', 'safety.incident.read', 'class_roster'),
  ('paraprofessional', 'safety.incident.read', 'room_checkin'),
  ('substitute', 'safety.incident.read', 'room_checkin'),
  ('district_admin', 'safety.incident.activate', 'full'),
  ('school_admin', 'safety.incident.activate', 'school'),
  ('secretary', 'safety.incident.activate', 'office'),
  ('teacher', 'safety.incident.activate', 'class_roster'),
  ('district_admin', 'safety.accountability.update', 'full'),
  ('school_admin', 'safety.accountability.update', 'school'),
  ('secretary', 'safety.accountability.update', 'office'),
  ('teacher', 'safety.accountability.update', 'class_roster'),
  ('paraprofessional', 'safety.accountability.update', 'room_checkin'),
  ('substitute', 'safety.accountability.update', 'room_checkin'),
  ('district_admin', 'safety.incident.export', 'full'),
  ('school_admin', 'safety.incident.export', 'school'),
  ('secretary', 'safety.incident.export', 'office'),
  ('district_admin', 'instruction.gradebook.read', 'full'),
  ('school_admin', 'instruction.gradebook.read', 'full'),
  ('secretary', 'instruction.gradebook.read', 'view_only'),
  ('teacher', 'instruction.gradebook.read', 'class_roster'),
  ('paraprofessional', 'instruction.gradebook.read', 'view_only'),
  ('substitute', 'instruction.gradebook.read', 'sub_plans'),
  ('parent', 'instruction.gradebook.read', 'own_children'),
  ('student', 'instruction.gradebook.read', 'self'),
  ('district_admin', 'instruction.iep.read', 'full'),
  ('school_admin', 'instruction.iep.read', 'school'),
  ('secretary', 'instruction.iep.read', 'view_only'),
  ('teacher', 'instruction.iep.read', 'assigned'),
  ('paraprofessional', 'instruction.iep.read', 'assigned'),
  ('substitute', 'instruction.iep.read', 'sub_plans'),
  ('parent', 'instruction.iep.read', 'own_children'),
  ('student', 'instruction.iep.read', 'self'),
  ('district_admin', 'pbis.ledger.read', 'full'),
  ('school_admin', 'pbis.ledger.read', 'full'),
  ('secretary', 'pbis.ledger.read', 'view_only'),
  ('teacher', 'pbis.ledger.read', 'class_roster'),
  ('parent', 'pbis.ledger.read', 'own_children'),
  ('student', 'pbis.ledger.read', 'self'),
  ('district_admin', 'pbis.points.award', 'full'),
  ('school_admin', 'pbis.points.award', 'full'),
  ('teacher', 'pbis.points.award', 'class_roster'),
  ('paraprofessional', 'pbis.points.award', 'assigned'),
  ('substitute', 'pbis.points.award', 'assigned'),
  ('student', 'pbis.auction.bid', 'self'),
  ('district_admin', 'communications.cms.publish', 'full'),
  ('school_admin', 'communications.cms.publish', 'school'),
  ('secretary', 'communications.cms.publish', 'office'),
  ('teacher', 'communications.cms.publish', 'class_roster'),
  ('parent', 'communications.feed.read', 'own_children'),
  ('student', 'communications.feed.read', 'self'),
  ('district_admin', 'communications.voice.audit', 'full'),
  ('school_admin', 'communications.voice.audit', 'school'),
  ('secretary', 'communications.voice.audit', 'office'),
  ('teacher', 'communications.voice.call', 'assigned')
on conflict (role, permission_key) do update
set access_mode = excluded.access_mode, updated_at = now();

alter table public.sis_role_permissions enable row level security;
revoke all on public.sis_role_permissions from anon, authenticated;
grant select on public.sis_role_permissions to authenticated;
grant all on public.sis_role_permissions to service_role;

create policy "Authenticated users can read the non-sensitive role matrix"
  on public.sis_role_permissions for select to authenticated
  using (true);

create table if not exists public.sis_student_user_links (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  unique (district_id, student_id, user_id)
);

create table if not exists public.sis_student_assignments (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  assignment_type text not null check (assignment_type in ('paraprofessional', 'specialist', 'substitute')),
  valid_from timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  check (expires_at is null or expires_at > valid_from)
);

create index if not exists sis_student_assignments_active_idx
  on public.sis_student_assignments (user_id, district_id, school_id, student_id)
  where active;

create table if not exists public.sis_substitute_assignments (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  substitute_user_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid,
  valid_from timestamptz not null,
  expires_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade,
  check (expires_at > valid_from)
);

alter table public.student_program_designations
  add constraint student_program_designations_id_scope_key unique (id, district_id, school_id);

create table if not exists public.student_restricted_program_notes (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  designation_id uuid not null,
  note text not null,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  foreign key (designation_id, district_id, school_id)
    references public.student_program_designations(id, district_id, school_id) on delete cascade
);

insert into public.student_restricted_program_notes (district_id, school_id, student_id, designation_id, note)
select district_id, school_id, student_id, id, restricted_notes
from public.student_program_designations
where restricted_notes is not null and btrim(restricted_notes) <> '';

alter table public.student_program_designations drop column restricted_notes;

create index if not exists sis_substitute_assignments_active_idx
  on public.sis_substitute_assignments (substitute_user_id, district_id, school_id, expires_at)
  where active;

alter table public.sis_student_user_links enable row level security;
alter table public.sis_student_assignments enable row level security;
alter table public.sis_substitute_assignments enable row level security;
alter table public.student_restricted_program_notes enable row level security;

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
      and (membership.access_expires_at is null or membership.access_expires_at > now())
      and membership.district_id = target_district_id
      and (membership.school_id is null or membership.school_id = target_school_id)
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.sis_has_permission(
  target_district_id uuid,
  target_school_id uuid,
  target_permission text,
  target_student_id uuid default null
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sis_memberships membership
    join public.sis_role_permissions permission on permission.role = membership.role
    where membership.user_id = (select auth.uid())
      and membership.active
      and (membership.access_expires_at is null or membership.access_expires_at > now())
      and membership.district_id = target_district_id
      and (membership.school_id is null or membership.school_id = target_school_id)
      and permission.permission_key = target_permission
      and case permission.access_mode
        when 'class_roster' then target_student_id is not null and exists (
          select 1 from public.course_sections section
          join public.course_enrollments enrollment on enrollment.section_id = section.id
            and enrollment.district_id = section.district_id and enrollment.school_id = section.school_id
          where section.teacher_id = membership.user_id
            and section.district_id = target_district_id and section.school_id = target_school_id
            and enrollment.student_id = target_student_id and enrollment.status = 'active'
        )
        when 'assigned' then target_student_id is not null and (
          exists (
            select 1 from public.sis_student_assignments assignment
            where assignment.user_id = membership.user_id and assignment.active
              and assignment.district_id = target_district_id and assignment.school_id = target_school_id
              and assignment.student_id = target_student_id and assignment.valid_from <= now()
              and (assignment.expires_at is null or assignment.expires_at > now())
          )
          or exists (
            select 1 from public.sis_substitute_assignments substitute
            join public.course_enrollments enrollment on enrollment.section_id = substitute.section_id
              and enrollment.district_id = substitute.district_id and enrollment.school_id = substitute.school_id
            where substitute.substitute_user_id = membership.user_id and substitute.active
              and substitute.district_id = target_district_id and substitute.school_id = target_school_id
              and substitute.valid_from <= now() and substitute.expires_at > now()
              and enrollment.student_id = target_student_id and enrollment.status = 'active'
          )
        )
        when 'own_children' then target_student_id is not null and exists (
          select 1 from public.student_guardians guardian
          where guardian.guardian_user_id = membership.user_id
            and guardian.district_id = target_district_id and guardian.school_id = target_school_id
            and guardian.student_id = target_student_id
        )
        when 'self' then target_student_id is not null and exists (
          select 1 from public.sis_student_user_links identity
          where identity.user_id = membership.user_id and identity.active
            and identity.district_id = target_district_id and identity.school_id = target_school_id
            and identity.student_id = target_student_id
        )
        when 'sub_plans' then target_student_id is not null and exists (
          select 1 from public.sis_substitute_assignments substitute
          join public.course_enrollments enrollment on enrollment.section_id = substitute.section_id
            and enrollment.district_id = substitute.district_id and enrollment.school_id = substitute.school_id
          where substitute.substitute_user_id = membership.user_id and substitute.active
            and substitute.district_id = target_district_id and substitute.school_id = target_school_id
            and substitute.valid_from <= now() and substitute.expires_at > now()
            and enrollment.student_id = target_student_id and enrollment.status = 'active'
        )
        when 'room_checkin' then membership.role in ('paraprofessional', 'substitute') and (
          target_student_id is null
          or exists (
            select 1 from public.sis_student_assignments assignment
            where assignment.user_id = membership.user_id and assignment.active
              and assignment.district_id = target_district_id and assignment.school_id = target_school_id
              and assignment.student_id = target_student_id and assignment.valid_from <= now()
              and (assignment.expires_at is null or assignment.expires_at > now())
          )
          or exists (
            select 1 from public.sis_substitute_assignments substitute
            join public.course_enrollments enrollment on enrollment.section_id = substitute.section_id
              and enrollment.district_id = substitute.district_id and enrollment.school_id = substitute.school_id
            where substitute.substitute_user_id = membership.user_id and substitute.active
              and substitute.district_id = target_district_id and substitute.school_id = target_school_id
              and substitute.valid_from <= now() and substitute.expires_at > now()
              and enrollment.student_id = target_student_id and enrollment.status = 'active'
          )
        )
        else true
      end
  );
$$;

revoke all on function public.sis_has_permission(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.sis_has_permission(uuid, uuid, text, uuid) to authenticated, service_role;

create or replace function public.sis_custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  memberships jsonb;
  token_user_id uuid;
begin
  token_user_id := (event ->> 'user_id')::uuid;
  select coalesce(jsonb_agg(jsonb_build_object(
    'district_id', membership.district_id,
    'school_id', membership.school_id,
    'role', membership.role,
    'access_expires_at', membership.access_expires_at
  )), '[]'::jsonb)
  into memberships
  from public.sis_memberships membership
  where membership.user_id = token_user_id
    and membership.active
    and (membership.access_expires_at is null or membership.access_expires_at > now());

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{sis_memberships}', memberships, true);
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

revoke all on function public.sis_custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.sis_custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.sis_memberships to supabase_auth_admin;

create or replace view public.students_directory
with (security_invoker = true)
as
select id, district_id, school_id, first_name, last_name, grade_level, enrollment_status, created_at, updated_at
from public.students;

revoke select on public.students from authenticated;
grant select (id, district_id, school_id, first_name, last_name, grade_level, enrollment_status, created_at, updated_at)
  on public.students to authenticated;
grant select on public.students_directory to authenticated;

grant select on public.sis_student_user_links, public.sis_student_assignments, public.sis_substitute_assignments to authenticated;
grant all on public.sis_student_user_links, public.sis_student_assignments, public.sis_substitute_assignments to service_role;

create policy "Users can read their own student identity link"
  on public.sis_student_user_links for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Restricted designation notes require specialist authorization"
  on public.student_restricted_program_notes for select to authenticated
  using (public.sis_has_role(district_id, school_id, array[
    'district_admin', 'school_admin', 'sped_case_manager', 'school_nurse', 'state_compliance'
  ]));

create policy "Users can read their own active student assignments"
  on public.sis_student_assignments for select to authenticated
  using (user_id = (select auth.uid()) and active and (expires_at is null or expires_at > now()));

create policy "Substitutes can read only their active assignments"
  on public.sis_substitute_assignments for select to authenticated
  using (substitute_user_id = (select auth.uid()) and active and valid_from <= now() and expires_at > now());

drop policy if exists "Authorized school staff and linked guardians can read student profiles" on public.students;
create policy "Students are readable only with profile permission"
  on public.students for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'student.profile.read', id));

drop policy if exists "Authorized safety staff can read student restrictions" on public.student_safety_restrictions;
create policy "Sensitive restrictions require custody permission"
  on public.student_safety_restrictions for select to authenticated
  using (
    (restriction_type = 'medical' and public.sis_has_permission(district_id, school_id, 'student.medical.read', student_id))
    or (restriction_type <> 'medical' and public.sis_has_permission(district_id, school_id, 'student.custody.read', student_id))
  );

drop policy if exists "Authorized specialists can read restricted program designations" on public.student_program_designations;
create policy "Program designations require designated access"
  on public.student_program_designations for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'student.designations.read', student_id));

drop policy if exists "State identifiers restricted to reporting and district staff" on public.student_state_identifiers;
create policy "State identifiers require reporting permission"
  on public.student_state_identifiers for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'student.state_identifier.read', student_id));

drop policy if exists "Assigned teachers and specialists can read active accommodation badges" on public.student_accommodation_badges;
create policy "Accommodation badges require assigned student permission"
  on public.student_accommodation_badges for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'instruction.iep.read', student_id));

drop policy if exists "Authorized school members can read courses" on public.courses;
create policy "Courses require roster permission"
  on public.courses for select to authenticated
  using (
    public.sis_has_permission(district_id, school_id, 'course.roster.read')
    or exists (
      select 1 from public.course_sections section
      where section.course_id = courses.id and section.district_id = courses.district_id
        and section.school_id = courses.school_id and section.teacher_id = (select auth.uid())
    )
    or exists (
      select 1 from public.course_sections section
      join public.course_enrollments enrollment on enrollment.section_id = section.id
        and enrollment.district_id = section.district_id and enrollment.school_id = section.school_id
      join public.sis_student_assignments assignment on assignment.student_id = enrollment.student_id
        and assignment.district_id = enrollment.district_id and assignment.school_id = enrollment.school_id
      where section.course_id = courses.id and section.district_id = courses.district_id
        and section.school_id = courses.school_id and enrollment.status = 'active'
        and assignment.user_id = (select auth.uid()) and assignment.active
        and assignment.valid_from <= now() and (assignment.expires_at is null or assignment.expires_at > now())
    )
    or exists (
      select 1 from public.course_sections section
      join public.sis_substitute_assignments substitute on substitute.section_id = section.id
        and substitute.district_id = section.district_id and substitute.school_id = section.school_id
      where section.course_id = courses.id and section.district_id = courses.district_id
        and section.school_id = courses.school_id and substitute.substitute_user_id = (select auth.uid())
        and substitute.active and substitute.valid_from <= now() and substitute.expires_at > now()
    )
    or exists (
      select 1 from public.course_sections section
      join public.course_enrollments enrollment on enrollment.section_id = section.id
        and enrollment.district_id = section.district_id and enrollment.school_id = section.school_id
      where section.course_id = courses.id and section.district_id = courses.district_id
        and section.school_id = courses.school_id and enrollment.status = 'active'
        and (
          exists (select 1 from public.student_guardians guardian where guardian.student_id = enrollment.student_id and guardian.guardian_user_id = (select auth.uid()))
          or exists (select 1 from public.sis_student_user_links identity where identity.student_id = enrollment.student_id and identity.user_id = (select auth.uid()) and identity.active)
        )
    )
  );

drop policy if exists "Authorized school members can read course sections" on public.course_sections;
create policy "Course sections require roster permission"
  on public.course_sections for select to authenticated
  using (
    public.sis_has_permission(district_id, school_id, 'course.roster.read')
    or teacher_id = (select auth.uid())
    or exists (
      select 1 from public.sis_substitute_assignments assignment
      where assignment.substitute_user_id = (select auth.uid())
        and assignment.active and assignment.valid_from <= now() and assignment.expires_at > now()
        and assignment.district_id = course_sections.district_id and assignment.school_id = course_sections.school_id
        and assignment.section_id = course_sections.id
    )
    or exists (
      select 1 from public.sis_student_assignments assignment
      join public.course_enrollments enrollment on enrollment.student_id = assignment.student_id
        and enrollment.district_id = assignment.district_id and enrollment.school_id = assignment.school_id
      where assignment.user_id = (select auth.uid()) and assignment.active
        and assignment.valid_from <= now() and (assignment.expires_at is null or assignment.expires_at > now())
        and assignment.district_id = course_sections.district_id and assignment.school_id = course_sections.school_id
        and enrollment.section_id = course_sections.id and enrollment.status = 'active'
    )
    or exists (
      select 1 from public.course_enrollments enrollment
      where enrollment.section_id = course_sections.id and enrollment.district_id = course_sections.district_id
        and enrollment.school_id = course_sections.school_id and enrollment.status = 'active'
        and (
          exists (select 1 from public.student_guardians guardian where guardian.student_id = enrollment.student_id and guardian.guardian_user_id = (select auth.uid()))
          or exists (select 1 from public.sis_student_user_links identity where identity.student_id = enrollment.student_id and identity.user_id = (select auth.uid()) and identity.active)
        )
    )
  );

drop policy if exists "Students and school members can read course enrollments" on public.course_enrollments;
create policy "Course enrollments require roster permission"
  on public.course_enrollments for select to authenticated
  using (
    public.sis_has_permission(district_id, school_id, 'course.roster.read', student_id)
    or public.sis_has_permission(district_id, school_id, 'student.profile.read', student_id)
  );

drop policy if exists "Safety and school staff can read scoped incidents" on public.emergency_incidents;
create policy "Emergency incidents require command read permission"
  on public.emergency_incidents for select to authenticated
  using (
    public.sis_has_permission(district_id, school_id, 'safety.incident.read')
    or exists (
      select 1 from public.emergency_student_status student_status
      where student_status.incident_id = emergency_incidents.id
        and student_status.district_id = emergency_incidents.district_id
        and student_status.school_id = emergency_incidents.school_id
        and public.sis_has_permission(
          student_status.district_id,
          student_status.school_id,
          'safety.incident.read',
          student_status.student_id
        )
    )
  );

drop policy if exists "Safety and school staff can read student accountability" on public.emergency_student_status;
create policy "Emergency student status requires scoped incident permission"
  on public.emergency_student_status for select to authenticated
  using (public.sis_has_permission(district_id, school_id, 'safety.incident.read', student_id));

drop policy if exists "Safety and school staff can read staff accountability" on public.emergency_staff_status;
create policy "Emergency staff status requires scoped incident permission"
  on public.emergency_staff_status for select to authenticated
  using (
    staff_user_id = (select auth.uid())
    or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary', 'school_nurse'])
  );

drop policy if exists "Safety and school staff can read visitor accountability" on public.emergency_external_presence;
create policy "Emergency visitor status requires scoped incident permission"
  on public.emergency_external_presence for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary']));

drop policy if exists "Safety and school staff can read incident event history" on public.emergency_event_log;
create policy "Emergency event history requires scoped incident permission"
  on public.emergency_event_log for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary', 'school_nurse']));

revoke all on public.sis_student_user_links, public.sis_student_assignments, public.sis_substitute_assignments
  from anon, authenticated;
grant select on public.sis_student_user_links, public.sis_student_assignments, public.sis_substitute_assignments to authenticated;
grant select on public.student_restricted_program_notes to authenticated;
grant all on public.sis_student_user_links, public.sis_student_assignments, public.sis_substitute_assignments to service_role;
grant all on public.student_restricted_program_notes to service_role;