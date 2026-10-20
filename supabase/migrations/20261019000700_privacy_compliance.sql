create table if not exists public.parent_privacy_preferences (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  opt_out_directory_info boolean not null default false,
  opt_out_media_photos boolean not null default false,
  opt_out_military_recruiting boolean not null default false,
  opt_out_higher_ed_recruiting boolean not null default false,
  coppa_parental_consent_given boolean not null default false,
  coppa_consent_timestamp timestamptz,
  coppa_consent_method text check (coppa_consent_method in ('signed_form', 'verified_email', 'school_authorized', 'third_party_verified')),
  coppa_consent_version text,
  coppa_evidence_object_path text,
  coppa_consent_revoked_at timestamptz,
  updated_by_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  unique (student_id, district_id, school_id),
  check (not coppa_parental_consent_given or (
    coppa_consent_timestamp is not null and coppa_consent_method is not null
    and coppa_consent_version is not null and coppa_consent_revoked_at is null
  ))
);

create table if not exists public.student_lei_access_grants (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  granted_to_user_id uuid not null references auth.users(id) on delete cascade,
  reason_code text not null check (reason_code in (
    'student_safety', 'educational_support', 'legal_compliance', 'parent_request', 'emergency_response'
  )),
  justification text not null check (char_length(btrim(justification)) >= 15),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  check (expires_at > created_at)
);

create index if not exists student_lei_access_grants_active_idx
  on public.student_lei_access_grants (granted_to_user_id, student_id, expires_at)
  where revoked_at is null;

create table if not exists public.ferpa_audit_logs (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  accessed_by_user_id uuid not null references auth.users(id) on delete restrict,
  user_role text not null,
  target_student_id uuid references public.students(id) on delete set null,
  action_performed text not null check (action_performed in (
    'view_pii', 'view_custody', 'view_medical', 'view_iep', 'view_504', 'view_odr',
    'export_transcript', 'export_student_record', 'edit_custody_flag',
    'directory_preference_change', 'coppa_consent_change', 'lei_override'
  )),
  resource_accessed text not null,
  lei_justification_code text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists ferpa_audit_logs_student_time_idx
  on public.ferpa_audit_logs (district_id, school_id, target_student_id, created_at desc);
create index if not exists ferpa_audit_logs_actor_time_idx
  on public.ferpa_audit_logs (accessed_by_user_id, created_at desc);

create table if not exists public.ferpa_record_requests (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  requested_by_user_id uuid not null references auth.users(id) on delete restrict,
  request_status text not null default 'submitted'
    check (request_status in ('submitted', 'under_review', 'ready', 'fulfilled', 'denied')),
  requested_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '45 days',
  fulfilled_at timestamptz,
  secure_export_path text,
  staff_notes text,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete restrict
);

create index if not exists ferpa_record_requests_scope_status_idx
  on public.ferpa_record_requests (district_id, school_id, request_status, due_at);

create table if not exists public.data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  data_category text not null,
  retention_period_days integer not null check (retention_period_days > 0),
  action_on_expiry text not null default 'hard_delete' check (action_on_expiry in ('hard_delete', 'anonymize', 'review')),
  legal_basis text not null,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (district_id, data_category)
);

create table if not exists public.data_retention_runs (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  data_category text not null,
  records_reviewed integer not null default 0 check (records_reviewed >= 0),
  records_anonymized integer not null default 0 check (records_anonymized >= 0),
  records_deleted integer not null default 0 check (records_deleted >= 0),
  run_status text not null check (run_status in ('completed', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  details jsonb not null default '{}'::jsonb
);

alter table public.parent_privacy_preferences enable row level security;
alter table public.student_lei_access_grants enable row level security;
alter table public.ferpa_audit_logs enable row level security;
alter table public.ferpa_record_requests enable row level security;
alter table public.data_retention_policies enable row level security;
alter table public.data_retention_runs enable row level security;

create policy "Linked guardians and authorized staff read privacy preferences"
  on public.parent_privacy_preferences for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar', 'secretary', 'state_compliance'])
    or exists (
      select 1 from public.student_guardians guardian
      where guardian.student_id = parent_privacy_preferences.student_id
        and guardian.district_id = parent_privacy_preferences.district_id
        and guardian.school_id = parent_privacy_preferences.school_id
        and guardian.guardian_user_id = (select auth.uid())
    )
  );

create policy "Linked guardians update privacy preferences"
  on public.parent_privacy_preferences for insert to authenticated
  with check (
    updated_by_user_id = (select auth.uid())
    and exists (
      select 1 from public.student_guardians guardian
      where guardian.student_id = parent_privacy_preferences.student_id
        and guardian.district_id = parent_privacy_preferences.district_id
        and guardian.school_id = parent_privacy_preferences.school_id
        and guardian.guardian_user_id = (select auth.uid())
    )
  );

create policy "Linked guardians update their privacy preferences"
  on public.parent_privacy_preferences for update to authenticated
  using (exists (
    select 1 from public.student_guardians guardian
    where guardian.student_id = parent_privacy_preferences.student_id
      and guardian.district_id = parent_privacy_preferences.district_id
      and guardian.school_id = parent_privacy_preferences.school_id
      and guardian.guardian_user_id = (select auth.uid())
  ))
  with check (updated_by_user_id = (select auth.uid()) and exists (
    select 1 from public.student_guardians guardian
    where guardian.student_id = parent_privacy_preferences.student_id
      and guardian.district_id = parent_privacy_preferences.district_id
      and guardian.school_id = parent_privacy_preferences.school_id
      and guardian.guardian_user_id = (select auth.uid())
  ));

create policy "Users can read their own LEI grants"
  on public.student_lei_access_grants for select to authenticated
  using (granted_to_user_id = (select auth.uid()));

create policy "Authorized compliance staff read scoped FERPA audit logs"
  on public.ferpa_audit_logs for select to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'state_compliance']));

create policy "Requesters and registrars read student record requests"
  on public.ferpa_record_requests for select to authenticated
  using (
    requested_by_user_id = (select auth.uid())
    or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin', 'registrar'])
  );

create policy "Linked guardians and students create own record requests"
  on public.ferpa_record_requests for insert to authenticated
  with check (
    requested_by_user_id = (select auth.uid())
    and public.sis_has_permission(district_id, school_id, 'student.profile.read', student_id)
  );

create policy "District administrators read retention policy"
  on public.data_retention_policies for select to authenticated
  using (public.sis_has_role(district_id, null, array['district_admin']));

create policy "District administrators read retention run history"
  on public.data_retention_runs for select to authenticated
  using (public.sis_has_role(district_id, null, array['district_admin']));

create or replace function public.prevent_ferpa_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'FERPA audit rows are append-only';
end;
$$;

revoke all on function public.prevent_ferpa_audit_mutation() from public, anon, authenticated;

drop trigger if exists ferpa_audit_logs_append_only on public.ferpa_audit_logs;
create trigger ferpa_audit_logs_append_only
  before update or delete on public.ferpa_audit_logs
  for each row execute function public.prevent_ferpa_audit_mutation();

create or replace function public.prevent_unverified_coppa_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
    new.coppa_parental_consent_given is distinct from old.coppa_parental_consent_given
    or new.coppa_consent_timestamp is distinct from old.coppa_consent_timestamp
    or new.coppa_consent_method is distinct from old.coppa_consent_method
    or new.coppa_consent_version is distinct from old.coppa_consent_version
    or new.coppa_evidence_object_path is distinct from old.coppa_evidence_object_path
    or new.coppa_consent_revoked_at is distinct from old.coppa_consent_revoked_at
  ) then
    raise exception 'COPPA consent verification must be recorded by a trusted server workflow';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_unverified_coppa_consent() from public, anon, authenticated;
drop trigger if exists student_privacy_preferences_coppa_verified on public.parent_privacy_preferences;
create trigger student_privacy_preferences_coppa_verified
  before insert or update on public.parent_privacy_preferences
  for each row execute function public.prevent_unverified_coppa_consent();

create or replace function public.begin_lei_override(
  target_student_id uuid,
  reason_code text,
  justification text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  student_scope record;
  override_id uuid;
  actor_role text;
  forwarded_for text;
  request_user_agent text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if reason_code not in ('student_safety', 'educational_support', 'legal_compliance', 'parent_request', 'emergency_response') then
    raise exception 'Invalid LEI reason code';
  end if;
  if char_length(btrim(coalesce(justification, ''))) < 15 then
    raise exception 'A specific LEI justification of at least 15 characters is required';
  end if;

  select district_id, school_id into student_scope
    from public.students where id = target_student_id;
  if not found then raise exception 'Student record not found'; end if;
  if not public.sis_has_role(student_scope.district_id, student_scope.school_id,
    array['district_admin', 'school_admin', 'secretary', 'registrar', 'state_compliance']) then
    raise exception 'Role cannot request an LEI override';
  end if;

  select role into actor_role from public.sis_memberships
    where user_id = auth.uid() and district_id = student_scope.district_id
      and (school_id is null or school_id = student_scope.school_id)
      and active and (access_expires_at is null or access_expires_at > now())
      and role in ('district_admin', 'school_admin', 'secretary', 'registrar', 'state_compliance')
    order by (school_id is not null) desc limit 1;

  insert into public.student_lei_access_grants (
    district_id, school_id, student_id, granted_to_user_id, reason_code, justification, expires_at
  ) values (
    student_scope.district_id, student_scope.school_id, target_student_id,
    auth.uid(), reason_code, btrim(justification), now() + interval '5 minutes'
  ) returning id into override_id;

  begin
    forwarded_for := current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for';
    request_user_agent := current_setting('request.headers', true)::jsonb ->> 'user-agent';
  exception when others then
    forwarded_for := null;
    request_user_agent := null;
  end;

  insert into public.ferpa_audit_logs (
    district_id, school_id, accessed_by_user_id, user_role, target_student_id,
    action_performed, resource_accessed, lei_justification_code, ip_address, user_agent
  ) values (
    student_scope.district_id, student_scope.school_id, auth.uid(), coalesce(actor_role, 'unknown'),
    target_student_id, 'lei_override', 'restricted_student_record', reason_code,
    nullif(split_part(coalesce(forwarded_for, ''), ',', 1), '')::inet, request_user_agent
  );

  return override_id;
end;
$$;

revoke all on function public.begin_lei_override(uuid, text, text) from public, anon;
grant execute on function public.begin_lei_override(uuid, text, text) to authenticated;

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
      and (
        target_student_id is null
        or target_permission not in ('student.custody.read', 'student.medical.read', 'student.designations.read', 'student.state_identifier.read', 'instruction.iep.read')
        or membership.role not in ('district_admin', 'school_admin', 'secretary', 'registrar', 'state_compliance')
        or exists (
          select 1 from public.student_lei_access_grants lei
          where lei.granted_to_user_id = membership.user_id
            and lei.student_id = target_student_id
            and lei.district_id = target_district_id
            and lei.school_id = target_school_id
            and lei.revoked_at is null and lei.expires_at > now()
        )
      )
  );
$$;

revoke all on function public.sis_has_permission(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.sis_has_permission(uuid, uuid, text, uuid) to authenticated, service_role;

revoke all on public.parent_privacy_preferences, public.student_lei_access_grants,
  public.ferpa_audit_logs, public.ferpa_record_requests,
  public.data_retention_policies, public.data_retention_runs
from anon, authenticated;

grant select, insert, update on public.parent_privacy_preferences to authenticated;
grant select on public.student_lei_access_grants, public.ferpa_audit_logs,
  public.ferpa_record_requests, public.data_retention_policies, public.data_retention_runs to authenticated;
grant insert on public.ferpa_record_requests to authenticated;
grant all on public.parent_privacy_preferences, public.student_lei_access_grants,
  public.ferpa_audit_logs, public.ferpa_record_requests,
  public.data_retention_policies, public.data_retention_runs to service_role;