alter table public.emergency_incidents
  add column if not exists srp_protocol text
    check (srp_protocol in ('hold', 'secure', 'lockdown', 'evacuate', 'shelter'));

alter table public.emergency_incidents drop constraint if exists emergency_incidents_status_check;
alter table public.emergency_incidents add constraint emergency_incidents_status_check
  check (status in ('active', 'all_clear', 'resolved', 'drill'));

alter table public.emergency_student_status drop constraint if exists emergency_student_status_status_check;
alter table public.emergency_student_status add constraint emergency_student_status_status_check
  check (status in ('unreported', 'accounted_for', 'missing', 'extra_student', 'injured'));

create table if not exists public.visitor_screening_logs (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  screened_by_user_id uuid not null references auth.users(id) on delete restrict,
  visitor_full_name text not null check (char_length(btrim(visitor_full_name)) between 1 and 200),
  -- Must be a keyed HMAC computed server-side; a plain hash of a license number is brute-forceable.
  driver_license_number_hash text,
  reason_for_visit text not null,
  destination_room varchar(50),
  screening_status text not null default 'passed'
    check (screening_status in ('passed', 'flagged_offender', 'flagged_custody', 'override_cleared')),
  badge_printed boolean not null default false,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  check (not badge_printed or screening_status in ('passed', 'override_cleared'))
);

create index if not exists visitor_screening_school_time_idx
  on public.visitor_screening_logs (district_id, school_id, check_in_time desc);

create table if not exists public.student_reunification_logs (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  incident_id uuid not null,
  student_id uuid not null,
  guardian_id uuid not null references public.student_guardians(id) on delete restrict,
  released_to_guardian_name text not null,
  guardian_id_verified boolean not null default false,
  -- Private storage object path, never a public URL.
  digital_signature_path text,
  released_by_staff_id uuid not null references auth.users(id) on delete restrict,
  released_at timestamptz not null default now(),
  foreign key (incident_id, district_id, school_id)
    references public.emergency_incidents(id, district_id, school_id) on delete cascade,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete restrict
);

create index if not exists reunification_incident_idx
  on public.student_reunification_logs (incident_id, released_at desc);

alter table public.visitor_screening_logs enable row level security;
alter table public.student_reunification_logs enable row level security;

create policy "Front office staff read scoped visitor logs"
  on public.visitor_screening_logs for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary']));

create policy "Front office staff create scoped visitor logs"
  on public.visitor_screening_logs for insert to authenticated
  with check (
    screened_by_user_id = (select auth.uid())
    and public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary'])
    and (screening_status <> 'override_cleared'
      or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']))
  );

create policy "Front office staff update visitor checkout and badge state"
  on public.visitor_screening_logs for update to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary']))
  with check (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary']));

create policy "Safety staff read scoped reunification logs"
  on public.student_reunification_logs for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary']));

create policy "Staff record verified reunification releases"
  on public.student_reunification_logs for insert to authenticated
  with check (
    released_by_staff_id = (select auth.uid())
    and guardian_id_verified
    and public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'secretary'])
    and exists (
      select 1 from public.emergency_incidents incident
      where incident.id = student_reunification_logs.incident_id
        and incident.district_id = student_reunification_logs.district_id
        and incident.school_id = student_reunification_logs.school_id
        and incident.status in ('active', 'all_clear', 'drill')
    )
    and exists (
      select 1 from public.student_guardians guardian
      where guardian.id = student_reunification_logs.guardian_id
        and guardian.student_id = student_reunification_logs.student_id
        and guardian.district_id = student_reunification_logs.district_id
        and guardian.school_id = student_reunification_logs.school_id
        and guardian.is_authorized_pickup
    )
    and (
      not exists (
        select 1 from public.student_safety_restrictions restriction
        where restriction.student_id = student_reunification_logs.student_id
          and restriction.district_id = student_reunification_logs.district_id
          and restriction.school_id = student_reunification_logs.school_id
          and restriction.restriction_type = 'custody'
          and restriction.active
      )
      or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    )
  );

revoke all on public.visitor_screening_logs, public.student_reunification_logs from anon, authenticated;
grant select (id, district_id, school_id, screened_by_user_id, visitor_full_name, reason_for_visit,
  destination_room, screening_status, badge_printed, check_in_time, check_out_time)
  on public.visitor_screening_logs to authenticated;
grant insert on public.visitor_screening_logs to authenticated;
grant update (badge_printed, check_out_time) on public.visitor_screening_logs to authenticated;
grant select, insert on public.student_reunification_logs to authenticated;
grant all on public.visitor_screening_logs, public.student_reunification_logs to service_role;
