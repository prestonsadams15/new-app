create table if not exists public.lms_assignments (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  section_id uuid not null,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  instructions text,
  rubric_scale_type varchar(30) not null default 'standards_4_point'
    check (rubric_scale_type in ('standards_4_point', 'traditional_100_pt')),
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade,
  unique (id, district_id, school_id, section_id)
);

create index if not exists lms_assignments_section_due_idx
  on public.lms_assignments (district_id, school_id, section_id, due_date);

create table if not exists public.lms_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null,
  school_id uuid not null,
  section_id uuid not null,
  assignment_id uuid not null,
  student_id uuid not null,
  media_urls text[] not null default array[]::text[],
  canvas_annotations_json jsonb not null default '[]'::jsonb
    check (jsonb_typeof(canvas_annotations_json) in ('array', 'object')),
  predicted_mastery_level integer check (predicted_mastery_level between 1 and 4),
  student_reflection_text text check (student_reflection_text is null or char_length(student_reflection_text) <= 2000),
  student_reflection_audio_url text,
  teacher_validated_level integer check (teacher_validated_level between 1 and 4),
  traditional_score_percentage numeric(5,2) check (traditional_score_percentage between 0 and 100),
  teacher_feedback_text text,
  teacher_feedback_audio_url text,
  status varchar(24) not null default 'submitted'
    check (status in ('draft', 'submitted', 'reviewed', 'revision_requested')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (assignment_id, district_id, school_id, section_id)
    references public.lms_assignments(id, district_id, school_id, section_id) on delete cascade,
  foreign key (section_id, district_id, school_id)
    references public.course_sections(id, district_id, school_id) on delete cascade,
  foreign key (student_id, district_id, school_id)
    references public.students(id, district_id, school_id) on delete cascade,
  unique (assignment_id, student_id)
);

create index if not exists lms_submissions_assignment_status_idx
  on public.lms_assignment_submissions (district_id, school_id, assignment_id, status, submitted_at desc);
create index if not exists lms_submissions_student_recent_idx
  on public.lms_assignment_submissions (district_id, school_id, student_id, submitted_at desc);

create or replace function public.protect_lms_submission_teacher_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.teacher_validated_level is distinct from old.teacher_validated_level
    or new.traditional_score_percentage is distinct from old.traditional_score_percentage
    or new.teacher_feedback_text is distinct from old.teacher_feedback_text
    or new.teacher_feedback_audio_url is distinct from old.teacher_feedback_audio_url
    or new.reviewed_at is distinct from old.reviewed_at then
    if not (
      public.sis_has_role(new.district_id, new.school_id, array['district_admin', 'school_admin'])
      or exists (
        select 1
        from public.course_sections section
        where section.id = new.section_id
          and section.district_id = new.district_id
          and section.school_id = new.school_id
          and section.teacher_id = (select auth.uid())
          and public.sis_has_role(new.district_id, new.school_id, array['teacher'])
      )
    ) then
      raise exception 'Only the assigned teacher or a scoped administrator may validate submissions';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_lms_submission_teacher_fields() from public, anon, authenticated;
create trigger protect_lms_submission_teacher_fields
  before update on public.lms_assignment_submissions
  for each row execute function public.protect_lms_submission_teacher_fields();

alter table public.lms_assignments enable row level security;
alter table public.lms_assignment_submissions enable row level security;

create policy "Teachers and administrators manage scoped LMS assignments"
  on public.lms_assignments for all to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      created_by_user_id = (select auth.uid())
      and public.sis_has_role(district_id, school_id, array['teacher'])
      and exists (
        select 1 from public.course_sections section
        where section.id = lms_assignments.section_id
          and section.district_id = lms_assignments.district_id
          and section.school_id = lms_assignments.school_id
          and section.teacher_id = (select auth.uid())
      )
    )
  )
  with check (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      created_by_user_id = (select auth.uid())
      and public.sis_has_role(district_id, school_id, array['teacher'])
      and exists (
        select 1 from public.course_sections section
        where section.id = lms_assignments.section_id
          and section.district_id = lms_assignments.district_id
          and section.school_id = lms_assignments.school_id
          and section.teacher_id = (select auth.uid())
      )
    )
  );

create policy "Enrolled students and linked families read LMS assignments"
  on public.lms_assignments for select to authenticated
  using (
    exists (
      select 1
      from public.course_enrollments enrollment
      where enrollment.section_id = lms_assignments.section_id
        and enrollment.district_id = lms_assignments.district_id
        and enrollment.school_id = lms_assignments.school_id
        and enrollment.status = 'active'
        and (
          exists (
            select 1 from public.sis_student_user_links identity
            where identity.student_id = enrollment.student_id
              and identity.user_id = (select auth.uid())
              and identity.active
          )
          or exists (
            select 1 from public.student_guardians guardian
            where guardian.student_id = enrollment.student_id
              and guardian.guardian_user_id = (select auth.uid())
          )
        )
    )
  );

create policy "Active substitutes read assigned LMS work"
  on public.lms_assignments for select to authenticated
  using (
    exists (
      select 1 from public.sis_substitute_assignments substitute
      where substitute.substitute_user_id = (select auth.uid())
        and substitute.section_id = lms_assignments.section_id
        and substitute.district_id = lms_assignments.district_id
        and substitute.school_id = lms_assignments.school_id
        and substitute.active
        and substitute.valid_from <= now()
        and substitute.expires_at > now()
    )
  );

create policy "Assigned support staff read LMS assignments"
  on public.lms_assignments for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['paraprofessional', 'sped_case_manager'])
    and exists (
      select 1
      from public.course_enrollments enrollment
      join public.sis_student_assignments assignment
        on assignment.student_id = enrollment.student_id
        and assignment.district_id = enrollment.district_id
        and assignment.school_id = enrollment.school_id
      where enrollment.section_id = lms_assignments.section_id
        and enrollment.district_id = lms_assignments.district_id
        and enrollment.school_id = lms_assignments.school_id
        and enrollment.status = 'active'
        and assignment.user_id = (select auth.uid())
        and assignment.active
        and assignment.valid_from <= now()
        and (assignment.expires_at is null or assignment.expires_at > now())
    )
  );

create policy "Assigned teachers and administrators manage LMS submissions"
  on public.lms_assignment_submissions for all to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
    or (
      exists (
        select 1 from public.course_sections section
        where section.id = lms_assignment_submissions.section_id
          and section.district_id = lms_assignment_submissions.district_id
          and section.school_id = lms_assignment_submissions.school_id
          and section.teacher_id = (select auth.uid())
      )
      and public.sis_has_role(district_id, school_id, array['teacher'])
    )
  )
  with check (
    exists (
      select 1 from public.course_enrollments enrollment
      where enrollment.section_id = lms_assignment_submissions.section_id
        and enrollment.student_id = lms_assignment_submissions.student_id
        and enrollment.district_id = lms_assignment_submissions.district_id
        and enrollment.school_id = lms_assignment_submissions.school_id
        and enrollment.status = 'active'
    )
    and (
      public.sis_has_role(district_id, school_id, array['district_admin', 'school_admin'])
      or (
        exists (
          select 1 from public.course_sections section
          where section.id = lms_assignment_submissions.section_id
            and section.district_id = lms_assignment_submissions.district_id
            and section.school_id = lms_assignment_submissions.school_id
            and section.teacher_id = (select auth.uid())
        )
        and public.sis_has_role(district_id, school_id, array['teacher'])
      )
    )
  );

create policy "Students manage their own enrolled submissions"
  on public.lms_assignment_submissions for all to authenticated
  using (
    status in ('draft', 'submitted', 'revision_requested')
    and public.sis_has_role(district_id, school_id, array['student'])
    and exists (
      select 1
      from public.sis_student_user_links identity
      join public.course_enrollments enrollment
        on enrollment.student_id = identity.student_id
        and enrollment.district_id = lms_assignment_submissions.district_id
        and enrollment.school_id = lms_assignment_submissions.school_id
        and enrollment.section_id = lms_assignment_submissions.section_id
        and enrollment.status = 'active'
      where identity.student_id = lms_assignment_submissions.student_id
        and identity.user_id = (select auth.uid())
        and identity.active
    )
  )
  with check (
    status in ('draft', 'submitted', 'revision_requested')
    and teacher_validated_level is null
    and traditional_score_percentage is null
    and teacher_feedback_text is null
    and teacher_feedback_audio_url is null
    and reviewed_at is null
    and public.sis_has_role(district_id, school_id, array['student'])
    and exists (
      select 1
      from public.sis_student_user_links identity
      join public.course_enrollments enrollment
        on enrollment.student_id = identity.student_id
        and enrollment.district_id = lms_assignment_submissions.district_id
        and enrollment.school_id = lms_assignment_submissions.school_id
        and enrollment.section_id = lms_assignment_submissions.section_id
        and enrollment.status = 'active'
      where identity.student_id = lms_assignment_submissions.student_id
        and identity.user_id = (select auth.uid())
        and identity.active
    )
  );

create policy "Students read their own reviewed submissions"
  on public.lms_assignment_submissions for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['student'])
    and exists (
      select 1 from public.sis_student_user_links identity
      where identity.student_id = lms_assignment_submissions.student_id
        and identity.district_id = lms_assignment_submissions.district_id
        and identity.school_id = lms_assignment_submissions.school_id
        and identity.user_id = (select auth.uid())
        and identity.active
    )
  );

create policy "Linked families read student submissions"
  on public.lms_assignment_submissions for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['parent'])
    and exists (
      select 1 from public.student_guardians guardian
      where guardian.student_id = lms_assignment_submissions.student_id
        and guardian.school_id = lms_assignment_submissions.school_id
        and guardian.district_id = lms_assignment_submissions.district_id
        and guardian.guardian_user_id = (select auth.uid())
    )
  );

create policy "Active substitutes read submissions for assigned sections"
  on public.lms_assignment_submissions for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['substitute'])
    and exists (
      select 1 from public.sis_substitute_assignments substitute
      where substitute.substitute_user_id = (select auth.uid())
        and substitute.section_id = lms_assignment_submissions.section_id
        and substitute.district_id = lms_assignment_submissions.district_id
        and substitute.school_id = lms_assignment_submissions.school_id
        and substitute.active
        and substitute.valid_from <= now()
        and substitute.expires_at > now()
    )
  );

create policy "Assigned support staff read student submissions"
  on public.lms_assignment_submissions for select to authenticated
  using (
    public.sis_has_role(district_id, school_id, array['paraprofessional', 'sped_case_manager'])
    and exists (
      select 1 from public.sis_student_assignments assignment
      where assignment.user_id = (select auth.uid())
        and assignment.student_id = lms_assignment_submissions.student_id
        and assignment.district_id = lms_assignment_submissions.district_id
        and assignment.school_id = lms_assignment_submissions.school_id
        and assignment.active
        and assignment.valid_from <= now()
        and (assignment.expires_at is null or assignment.expires_at > now())
    )
  );

revoke all on public.lms_assignments, public.lms_assignment_submissions from anon, authenticated;
grant select, insert, update, delete on public.lms_assignments, public.lms_assignment_submissions to authenticated;
grant all on public.lms_assignments, public.lms_assignment_submissions to service_role;
