create table if not exists public.behavior_categories (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  teacher_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 50),
  default_point_value integer not null check (default_point_value between 1 and 5),
  icon_identifier varchar(50) not null default 'star',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, district_id, school_id)
);

create index if not exists behavior_categories_scope_idx
  on public.behavior_categories (district_id, school_id, teacher_id, is_active);

insert into public.behavior_categories (district_id, school_id, teacher_id, title, default_point_value, icon_identifier)
select scope.district_id, scope.school_id, null, defaults.title, defaults.points, defaults.icon
from (
  select distinct district_id, school_id
  from public.sis_memberships
  where active and school_id is not null
) scope
cross join (values
  ('Helping Others', 2, 'handshake'),
  ('Kindness', 1, 'heart'),
  ('Safe', 1, 'shield-check'),
  ('Respectful', 2, 'star'),
  ('Responsible', 3, 'target'),
  ('Showing Growth', 5, 'rocket')
) as defaults(title, points, icon)
where not exists (
  select 1
  from public.behavior_categories existing
  where existing.district_id = scope.district_id
    and existing.school_id = scope.school_id
    and existing.teacher_id is null
    and lower(existing.title) = lower(defaults.title)
);

create table if not exists public.pbis_transactions (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  student_id uuid not null,
  awarded_by_user_id uuid not null references auth.users(id) on delete restrict,
  category_id uuid references public.behavior_categories(id) on delete set null,
  points_amount integer not null check (points_amount between 1 and 5),
  custom_note text,
  created_at timestamptz not null default now(),
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade
);

create index if not exists pbis_transactions_student_created_idx
  on public.pbis_transactions (district_id, school_id, student_id, created_at desc);

create index if not exists pbis_transactions_category_created_idx
  on public.pbis_transactions (district_id, school_id, category_id, created_at desc)
  where category_id is not null;

alter table public.behavior_categories enable row level security;
alter table public.pbis_transactions enable row level security;

create policy "Authorized members can read PBIS categories"
  on public.behavior_categories for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array[
      'district_admin', 'school_admin', 'teacher', 'paraprofessional', 'substitute'
    ])
    and (
      teacher_id is null
      or teacher_id = (select auth.uid())
      or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    )
  );

create policy "Teachers manage their PBIS categories and leaders manage school scope"
  on public.behavior_categories for all to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      teacher_id = (select auth.uid())
      and public.sis_has_role(district_id, school_id, array['teacher'])
    )
  )
  with check (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      teacher_id = (select auth.uid())
      and public.sis_has_role(district_id, school_id, array['teacher'])
    )
  );

create policy "Authorized staff can insert PBIS point awards"
  on public.pbis_transactions for insert to authenticated
  with check (
    awarded_by_user_id = (select auth.uid())
    and public.sis_has_role(district_id, school_id, array[
      'teacher', 'substitute', 'paraprofessional', 'school_admin', 'district_admin'
    ])
    and (
      category_id is null
      or exists (
        select 1
        from public.behavior_categories category
        where category.id = pbis_transactions.category_id
          and category.district_id = pbis_transactions.district_id
          and category.school_id = pbis_transactions.school_id
          and category.is_active
          and (
            category.teacher_id is null
            or category.teacher_id = (select auth.uid())
            or public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
          )
      )
    )
  );

revoke all on public.behavior_categories, public.pbis_transactions from anon, authenticated;
grant select, insert, update, delete on public.behavior_categories to authenticated;
grant insert on public.pbis_transactions to authenticated;
grant all on public.behavior_categories, public.pbis_transactions to service_role;
