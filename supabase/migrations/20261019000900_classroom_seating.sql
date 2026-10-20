create table if not exists public.classroom_floor_plans (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  section_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  classroom_name text not null default 'Main Classroom' check (char_length(btrim(classroom_name)) between 1 and 100),
  grid_columns integer not null default 12 check (grid_columns between 6 and 16),
  grid_rows integer not null default 10 check (grid_rows between 6 and 15),
  blocks_layout jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks_layout) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade,
  unique (id, district_id, school_id)
);

create index if not exists classroom_floor_plans_teacher_section_idx
  on public.classroom_floor_plans (teacher_id, section_id, updated_at desc);

create table if not exists public.seating_assignments (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  floor_plan_id uuid not null,
  section_id uuid not null,
  student_id uuid not null,
  block_id varchar(50) not null,
  seat_index integer not null default 1 check (seat_index between 1 and 6),
  assigned_at timestamptz not null default now(),
  foreign key (floor_plan_id, district_id, school_id)
    references public.classroom_floor_plans(id, district_id, school_id) on delete cascade,
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  unique (section_id, student_id),
  unique (section_id, block_id, seat_index)
);

create index if not exists seating_assignments_floor_plan_idx
  on public.seating_assignments (floor_plan_id, section_id, block_id, seat_index);

alter table public.classroom_floor_plans enable row level security;
alter table public.seating_assignments enable row level security;

create policy "Teachers and administrators manage scoped classroom floor plans"
  on public.classroom_floor_plans for all to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      teacher_id = (select auth.uid())
      and public.sis_has_role(district_id, school_id, array['teacher'])
      and exists (
        select 1 from public.course_sections section
        where section.id = classroom_floor_plans.section_id
          and section.district_id = classroom_floor_plans.district_id
          and section.school_id = classroom_floor_plans.school_id
          and section.teacher_id = (select auth.uid())
      )
    )
  )
  with check (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      teacher_id = (select auth.uid())
      and public.sis_has_role(district_id, school_id, array['teacher'])
      and exists (
        select 1 from public.course_sections section
        where section.id = classroom_floor_plans.section_id
          and section.district_id = classroom_floor_plans.district_id
          and section.school_id = classroom_floor_plans.school_id
          and section.teacher_id = (select auth.uid())
      )
    )
  );

create policy "Teachers and administrators manage scoped seating assignments"
  on public.seating_assignments for all to authenticated
  using (
    exists (
      select 1
      from public.classroom_floor_plans floor_plan
      join public.course_sections section
        on section.id = seating_assignments.section_id
        and section.district_id = seating_assignments.district_id
        and section.school_id = seating_assignments.school_id
      where floor_plan.id = seating_assignments.floor_plan_id
        and floor_plan.district_id = seating_assignments.district_id
        and floor_plan.school_id = seating_assignments.school_id
        and floor_plan.section_id = seating_assignments.section_id
        and (
          public.sis_has_role(seating_assignments.district_id, seating_assignments.school_id, array['district_admin', 'school_admin'])
          or (
            floor_plan.teacher_id = (select auth.uid())
            and section.teacher_id = (select auth.uid())
            and public.sis_has_role(seating_assignments.district_id, seating_assignments.school_id, array['teacher'])
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.classroom_floor_plans floor_plan
      join public.course_sections section
        on section.id = seating_assignments.section_id
        and section.district_id = seating_assignments.district_id
        and section.school_id = seating_assignments.school_id
      where floor_plan.id = seating_assignments.floor_plan_id
        and floor_plan.district_id = seating_assignments.district_id
        and floor_plan.school_id = seating_assignments.school_id
        and floor_plan.section_id = seating_assignments.section_id
        and exists (
          select 1
          from public.course_enrollments enrollment
          where enrollment.section_id = seating_assignments.section_id
            and enrollment.student_id = seating_assignments.student_id
            and enrollment.district_id = seating_assignments.district_id
            and enrollment.school_id = seating_assignments.school_id
            and enrollment.status = 'active'
        )
        and exists (
          select 1
          from jsonb_array_elements(floor_plan.blocks_layout) as layout_block(value)
          where layout_block.value ->> 'id' = seating_assignments.block_id
            and (layout_block.value ->> 'type') in ('desk', 'table-2', 'table-4', 'table-6', 'rug', 'lab')
            and seating_assignments.seat_index <= case layout_block.value ->> 'type'
              when 'table-2' then 2
              when 'table-4' then 4
              when 'table-6' then 6
              when 'rug' then 4
              when 'lab' then 2
              else 1
            end
        )
        and (
          public.sis_has_role(seating_assignments.district_id, seating_assignments.school_id, array['district_admin', 'school_admin'])
          or (
            floor_plan.teacher_id = (select auth.uid())
            and section.teacher_id = (select auth.uid())
            and public.sis_has_role(seating_assignments.district_id, seating_assignments.school_id, array['teacher'])
          )
        )
    )
  );

revoke all on public.classroom_floor_plans, public.seating_assignments from anon, authenticated;
grant select, insert, update, delete on public.classroom_floor_plans, public.seating_assignments to authenticated;
grant all on public.classroom_floor_plans, public.seating_assignments to service_role;
