create table if not exists public.voice_call_memberships (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_call_guardians boolean not null default false,
  can_view_voice_audit boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (district_id, school_id, user_id)
);

create index if not exists voice_call_memberships_user_scope_idx
  on public.voice_call_memberships (user_id, district_id, school_id)
  where active;

create table if not exists public.voice_call_staff_endpoints (
  user_id uuid primary key references auth.users(id) on delete cascade,
  district_id uuid not null,
  school_id uuid not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  verified_at timestamptz,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_call_guardian_contacts (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  guardian_user_id uuid references auth.users(id) on delete set null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  voice_consent_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists voice_call_guardian_contacts_student_idx
  on public.voice_call_guardian_contacts (student_id, district_id, school_id)
  where active and voice_consent_at is not null;

create table if not exists public.voice_call_routes (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  office_caller_id_e164 text not null check (office_caller_id_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  twilio_verified_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (district_id, school_id)
);

create table if not exists public.voice_call_audit (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  staff_user_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null,
  guardian_contact_id uuid not null references public.voice_call_guardian_contacts(id) on delete restrict,
  school_caller_id_e164 text not null check (school_caller_id_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  twilio_call_sid text unique,
  twilio_guardian_call_sid text unique,
  status text not null default 'queued' check (status in ('queued', 'initiated', 'ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'failed', 'canceled')),
  provider_error_code text,
  initiated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create index if not exists voice_call_audit_scope_time_idx
  on public.voice_call_audit (district_id, school_id, initiated_at desc);

alter table public.voice_call_memberships enable row level security;
alter table public.voice_call_staff_endpoints enable row level security;
alter table public.voice_call_guardian_contacts enable row level security;
alter table public.voice_call_routes enable row level security;
alter table public.voice_call_audit enable row level security;

create policy "Users can read their own voice membership"
  on public.voice_call_memberships for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Authorized staff can read scoped call audit metadata"
  on public.voice_call_audit for select to authenticated
  using (
    exists (
      select 1
      from public.voice_call_memberships membership
      where membership.user_id = (select auth.uid())
        and membership.active
        and membership.can_view_voice_audit
        and membership.district_id = voice_call_audit.district_id
        and (membership.school_id is null or membership.school_id = voice_call_audit.school_id)
    )
  );

revoke all on public.voice_call_memberships,
  public.voice_call_staff_endpoints,
  public.voice_call_guardian_contacts,
  public.voice_call_routes,
  public.voice_call_audit
from anon, authenticated;

grant select on public.voice_call_memberships, public.voice_call_audit to authenticated;
grant all on public.voice_call_memberships,
  public.voice_call_staff_endpoints,
  public.voice_call_guardian_contacts,
  public.voice_call_routes,
  public.voice_call_audit
to service_role;