create table if not exists public.lesson_plan_settings (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  template_structure jsonb not null default '[
    {"id":"obj","title":"Objectives / Can-Do Statements"},
    {"id":"warmup","title":"Warm-Up / Bell Ringer"},
    {"id":"direct","title":"Direct Instruction"},
    {"id":"practice","title":"Guided & Independent Practice"},
    {"id":"accommodations","title":"Accommodations & Extensions"},
    {"id":"homework","title":"Homework / Follow-Up"}
  ]'::jsonb,
  schedule_rule text not null default 'fixed' check (schedule_rule in ('fixed', 'ab_block', 'rotating')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (district_id, school_id, teacher_id)
);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete restrict,
  section_id uuid not null,
  lesson_title text not null,
  planned_date date not null,
  period_number integer not null check (period_number > 0),
  schedule_override text check (schedule_override in ('holiday', 'late_start', 'assembly')),
  content_sections jsonb not null default '{}'::jsonb,
  visible_to_substitute boolean not null default true,
  substitute_notes text,
  coverage_stage text not null default 'taught' check (coverage_stage in ('taught', 'practiced', 'assessed')),
  span_periods integer not null default 1 check (span_periods between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade,
  unique (id, district_id, school_id)
);

create index if not exists lesson_plans_teacher_date_idx
  on public.lesson_plans (teacher_id, school_id, planned_date, period_number);
create index if not exists lesson_plans_substitute_date_idx
  on public.lesson_plans (section_id, planned_date)
  where visible_to_substitute;

create table if not exists public.academic_standards (
  id uuid primary key default gen_random_uuid(),
  jurisdiction text not null,
  standard_code varchar(80) not null,
  subject_area text not null,
  grade_band varchar(20),
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (jurisdiction, standard_code)
);

create index if not exists academic_standards_search_idx
  on public.academic_standards (jurisdiction, subject_area, grade_band)
  where active;

create table if not exists public.lesson_plan_standards (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  lesson_plan_id uuid not null,
  standard_id uuid not null references public.academic_standards(id) on delete restrict,
  linked_by_user_id uuid not null references auth.users(id) on delete restrict,
  coverage_stage text not null default 'taught' check (coverage_stage in ('taught', 'practiced', 'assessed')),
  created_at timestamptz not null default now(),
  foreign key (lesson_plan_id, district_id, school_id)
    references public.lesson_plans(id, district_id, school_id) on delete cascade,
  unique (lesson_plan_id, standard_id)
);

create index if not exists lesson_plan_standards_scope_idx
  on public.lesson_plan_standards (district_id, school_id, standard_id, coverage_stage);

alter table public.lesson_plan_settings enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.academic_standards enable row level security;
alter table public.lesson_plan_standards enable row level security;

create policy "Teachers manage their own lesson settings"
  on public.lesson_plan_settings for all to authenticated
  using (
    teacher_id = (select auth.uid())
    and public.sis_has_role(district_id, school_id, array['teacher'])
  )
  with check (
    teacher_id = (select auth.uid())
    and public.sis_has_role(district_id, school_id, array['teacher'])
  );

create policy "School leaders manage scoped lesson settings"
  on public.lesson_plan_settings for all to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']))
  with check (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']));

create policy "Teachers manage lessons for assigned sections"
  on public.lesson_plans for all to authenticated
  using (
    teacher_id = (select auth.uid())
    and exists (
      select 1 from public.course_sections section
      where section.id = lesson_plans.section_id
        and section.district_id = lesson_plans.district_id
        and section.school_id = lesson_plans.school_id
        and section.teacher_id = (select auth.uid())
    )
  )
  with check (
    teacher_id = (select auth.uid())
    and exists (
      select 1 from public.course_sections section
      where section.id = lesson_plans.section_id
        and section.district_id = lesson_plans.district_id
        and section.school_id = lesson_plans.school_id
        and section.teacher_id = (select auth.uid())
    )
  );

create policy "School leaders manage scoped lesson plans"
  on public.lesson_plans for all to authenticated
  using (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']))
  with check (public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin']));

create policy "Linked families and students read lesson plans"
  on public.lesson_plans for select to authenticated
  using (
    exists (
      select 1 from public.course_enrollments enrollment
      where enrollment.section_id = lesson_plans.section_id
        and enrollment.district_id = lesson_plans.district_id
        and enrollment.school_id = lesson_plans.school_id
        and enrollment.status = 'active'
        and (
          exists (
            select 1 from public.student_guardians guardian
            where guardian.student_id = enrollment.student_id
              and guardian.guardian_user_id = (select auth.uid())
          )
          or exists (
            select 1 from public.sis_student_user_links identity
            where identity.student_id = enrollment.student_id
              and identity.user_id = (select auth.uid())
              and identity.active
          )
        )
    )
  );

create policy "Active substitute assignments read visible lesson plans"
  on public.lesson_plans for select to authenticated
  using (
    visible_to_substitute
    and exists (
      select 1 from public.sis_substitute_assignments assignment
      where assignment.substitute_user_id = (select auth.uid())
        and assignment.section_id = lesson_plans.section_id
        and assignment.district_id = lesson_plans.district_id
        and assignment.school_id = lesson_plans.school_id
        and assignment.active
        and assignment.valid_from <= now()
        and assignment.expires_at > now()
        and lesson_plans.planned_date between assignment.valid_from::date and assignment.expires_at::date
    )
  );

create policy "Authenticated users search active standards"
  on public.academic_standards for select to authenticated
  using (active);

create policy "Lesson owners and leaders manage standard links"
  on public.lesson_plan_standards for all to authenticated
  using (
    exists (
      select 1 from public.lesson_plans lesson
      where lesson.id = lesson_plan_standards.lesson_plan_id
        and lesson.district_id = lesson_plan_standards.district_id
        and lesson.school_id = lesson_plan_standards.school_id
        and (lesson.teacher_id = (select auth.uid())
          or public.sis_has_role(lesson.district_id, lesson.school_id, array['district_admin', 'school_admin']))
    )
  )
  with check (
    exists (
      select 1 from public.lesson_plans lesson
      where lesson.id = lesson_plan_standards.lesson_plan_id
        and lesson.district_id = lesson_plan_standards.district_id
        and lesson.school_id = lesson_plan_standards.school_id
        and (lesson.teacher_id = (select auth.uid())
          or public.sis_has_role(lesson.district_id, lesson.school_id, array['district_admin', 'school_admin']))
    )
  );

revoke all on public.lesson_plan_settings, public.lesson_plans, public.academic_standards, public.lesson_plan_standards from anon, authenticated;
grant select, insert, update, delete on public.lesson_plan_settings, public.lesson_plans, public.lesson_plan_standards to authenticated;
grant select on public.academic_standards to authenticated;
grant all on public.lesson_plan_settings, public.lesson_plans, public.academic_standards, public.lesson_plan_standards to service_role;