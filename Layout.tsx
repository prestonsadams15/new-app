import {
  BookOpen,
  BriefcaseBusiness,
  BusFront,
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Landmark,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react-native';

/*
 * District OS site map.
 *
 *   Hub (role-based grouping)  →  Section (sidebar item, one URL prefix)  →  Page (sub-nav tab, own URL)
 *
 * Every section also gets a generated "Overview" page (`/#/<section>`) that breaks down
 * its pages, their status, who can use them, and the data tables behind them.
 * Pages marked `planned` render a blueprint instead of a workspace.
 */

export type HubId = 'classroom' | 'safety' | 'operations';
export type PrimarySectionId =
  | 'instruction' | 'grades' | 'special-ed' | 'communication'
  | 'safety' | 'behavior'
  | 'students' | 'scheduling' | 'transportation' | 'finance' | 'hr' | 'compliance';
export type AppRole =
  | 'district_admin' | 'school_admin' | 'secretary' | 'teacher' | 'paraprofessional'
  | 'substitute' | 'parent' | 'student' | 'registrar' | 'sped_case_manager'
  | 'counselor' | 'school_nurse' | 'state_compliance';

/** `demo` = interactive workspace exists (sample data). `planned` = blueprint only. */
export type PageStatus = 'demo' | 'planned';

export type ChildTab = {
  id: string;
  label: string;
  roles: AppRole[];
  status: PageStatus;
  summary: string;
  capabilities: string[];
  /** Supabase tables that back (or will back) this page. */
  data?: string[];
};

export type PrimarySection = {
  id: PrimarySectionId;
  title: string;
  hub: HubId;
  pillarId: number;
  icon: typeof BookOpen;
  summary: string;
  roles: AppRole[];
  tabs: ChildTab[];
};

export type Hub = { id: HubId; title: string; shortTitle: string; summary: string; icon: typeof BookOpen };

export const OVERVIEW_TAB_ID = 'overview';

export const roleLabels: Record<AppRole, string> = {
  district_admin: 'District admin', school_admin: 'School admin', secretary: 'Secretary', teacher: 'Teacher',
  paraprofessional: 'Paraprofessional', substitute: 'Substitute', parent: 'Parent', student: 'Student',
  registrar: 'Registrar', sped_case_manager: 'SPED case manager', counselor: 'Counselor',
  school_nurse: 'School nurse', state_compliance: 'State compliance',
};

export const hubs: Hub[] = [
  { id: 'classroom', title: 'Classroom Hub', shortTitle: 'Classroom', icon: GraduationCap, summary: 'Teaching, grading, special education, and family communication.' },
  { id: 'safety', title: 'Safety & Behavior Hub', shortTitle: 'Safety & Behavior', icon: ShieldAlert, summary: 'Campus safety, crisis response, positive behavior, and interventions.' },
  { id: 'operations', title: 'District Operations Hub', shortTitle: 'Operations', icon: Landmark, summary: 'Student records, scheduling, transportation, finance, staff, and compliance.' },
];

const leaders: AppRole[] = ['district_admin', 'school_admin'];
const office: AppRole[] = [...leaders, 'secretary'];
const records: AppRole[] = [...office, 'registrar'];
const educators: AppRole[] = [...leaders, 'teacher', 'sped_case_manager'];
const classroomUsers: AppRole[] = [...educators, 'substitute'];
const classroomStaff: AppRole[] = [...classroomUsers, 'paraprofessional'];
const spedTeam: AppRole[] = [...leaders, 'teacher', 'paraprofessional', 'sped_case_manager', 'counselor'];
const safetyUsers: AppRole[] = [...office, 'teacher', 'paraprofessional', 'substitute', 'counselor', 'school_nurse'];
const wellness: AppRole[] = [...leaders, 'teacher', 'sped_case_manager', 'counselor'];
const rewardUsers: AppRole[] = [...leaders, 'teacher', 'paraprofessional', 'substitute', 'student'];
const familyFacing: AppRole[] = [...office, 'teacher', 'substitute', 'parent', 'student'];

export const primarySections: PrimarySection[] = [
  // ───────────── Classroom Hub ─────────────
  {
    id: 'instruction', title: 'Instruction', hub: 'classroom', pillarId: 1, icon: BookOpen,
    summary: 'Plan lessons, run the daily class stream, and arrange the room.',
    roles: [...classroomStaff, 'counselor'],
    tabs: [
      { id: 'stream', label: 'Daily Stream', status: 'demo', roles: classroomUsers,
        summary: "Today's lessons and student supports in one teacher view.",
        capabilities: ["Today's lesson plan at a glance", 'Jump to IEP supports for the period', 'Shared with substitutes during active assignments'],
        data: ['lesson_plans', 'sis_substitute_assignments'] },
      { id: 'planbook', label: 'Lesson Planner', status: 'demo', roles: classroomUsers,
        summary: 'Week, day, month, and class views with standards coverage.',
        capabilities: ['Week / day / month / class views', 'Fixed, A/B block, and rotating schedules', 'Standards tagging and coverage stages', 'Substitute packet preview'],
        data: ['lesson_plan_settings', 'lesson_plans', 'academic_standards', 'lesson_plan_standards'] },
      { id: 'seating', label: 'Seating Charts', status: 'demo', roles: classroomStaff,
        summary: 'Floor-plan builder with accommodation-aware auto seating.',
        capabilities: ['Desks, tables, rug and lab spots', 'Alphabetical, random, and balanced layouts', 'Separation conflicts blocked', 'Front-row and language supports'],
        data: ['classroom_floor_plans', 'seating_assignments'] },
      { id: 'rosters', label: 'Rosters & Sync', status: 'planned', roles: educators,
        summary: 'Class rosters synced to Google Workspace and Microsoft 365.',
        capabilities: ['Section rosters from the SIS', 'Google Classroom / Teams class creation', 'OneRoster export for third-party apps', 'Co-teacher and para access'],
        data: ['course_sections', 'course_enrollments'] },
    ],
  },
  {
    id: 'grades', title: 'Grades & Portfolios', hub: 'classroom', pillarId: 1, icon: ClipboardCheck,
    summary: 'Mastery gradebook, student self-assessment, and family-facing portfolios.',
    roles: [...educators, 'parent', 'student'],
    tabs: [
      { id: 'gradebook', label: 'Mastery Gradebook', status: 'demo', roles: educators,
        summary: 'Standards mastery matrix with a teacher approval queue.',
        capabilities: ['Mastery levels per assignment', 'Approval queue for submissions', 'Teacher-validated fields locked from students'],
        data: ['lms_assignments', 'lms_assignment_submissions'] },
      { id: 'hattie', label: 'Self-Reporting', status: 'demo', roles: [...leaders, 'teacher', 'student'],
        summary: 'Hattie-style prediction and reflection before grades are shown.',
        capabilities: ['Students predict their score', 'Reflection gate before release', 'Prediction vs. result tracking'],
        data: ['lms_assignment_submissions'] },
      { id: 'portfolios', label: 'Portfolios', status: 'demo', roles: [...leaders, 'teacher', 'parent', 'student'],
        summary: 'Photo, drawing, audio, and screen-recorded evidence of learning.',
        capabilities: ['Multimodal artifact canvas', 'Teacher review before families see it', 'Read-only family portfolio view'],
        data: ['lms_assignment_submissions'] },
      { id: 'report-cards', label: 'Report Cards', status: 'planned', roles: [...educators, 'parent', 'student'],
        summary: 'Standards-based report cards generated from the mastery gradebook.',
        capabilities: ['Term roll-up from mastery evidence', 'Teacher comments with translation', 'Family delivery and acknowledgment', 'PDF archive to student record'] },
    ],
  },
  {
    id: 'special-ed', title: 'Special Education', hub: 'classroom', pillarId: 1, icon: HeartHandshake,
    summary: 'IEP and 504 lifecycle, goals, accommodations, services, and consent.',
    roles: [...spedTeam, 'substitute', 'parent', 'student'],
    tabs: [
      { id: 'iep', label: 'IEP & Timeline', status: 'demo', roles: spedTeam,
        summary: 'IEP drafts on state templates with compliance deadlines.',
        capabilities: ['Utah USBE or district template', 'Annual review and re-eval countdowns', 'Meeting and draft status'],
        data: ['student_program_designations', 'student_restricted_program_notes'] },
      { id: 'goals', label: 'SMART Goals', status: 'demo', roles: spedTeam,
        summary: 'Measurable goals with progress-monitoring data points.',
        capabilities: ['Baseline, target, and measurement method', 'Progress data entry', 'Goal bank suggestions'] },
      { id: 'accommodations', label: 'Accommodations', status: 'demo', roles: [...spedTeam, 'substitute', 'parent'],
        summary: 'Accommodation badges that follow the student into every class.',
        capabilities: ['Classroom and testing accommodations', 'Visible to assigned staff only', 'Shown on seating charts and sub packets'],
        data: ['student_accommodation_badges'] },
      { id: 'services', label: 'Service Log', status: 'demo', roles: spedTeam,
        summary: 'Minutes delivered against minutes required.',
        capabilities: ['Log sessions by provider', 'Minutes owed vs. delivered', 'Missed-session reasons'] },
      { id: 'consent', label: 'Parent Consent', status: 'demo', roles: [...spedTeam, 'parent'],
        summary: 'Prior written notice and consent requests to families.',
        capabilities: ['Consent request tracking', 'Prior written notice drafts', 'Family signature status'] },
    ],
  },
  {
    id: 'communication', title: 'Communication', hub: 'classroom', pillarId: 5, icon: MessageCircle,
    summary: 'Family feeds, private messaging, masked calls, and emergency broadcasts.',
    roles: familyFacing,
    tabs: [
      { id: 'feed', label: 'Community Feed', status: 'demo', roles: familyFacing,
        summary: 'Classroom, school, and district posts in one family feed.',
        capabilities: ['Classroom / school / district scopes', 'Photo posts with directory opt-out checks', 'Translation preview'] },
      { id: 'messages', label: 'Direct Messages', status: 'demo', roles: [...office, 'teacher', 'substitute', 'parent'],
        summary: 'Private parent, staff, and office threads.',
        capabilities: ['Parent ↔ teacher threads', 'Office and staff threads', 'Read receipts and quiet hours'] },
      { id: 'masked-caller', label: 'Masked Calling', status: 'demo', roles: [...office, 'teacher'],
        summary: "Call and text families without exposing staff phone numbers.",
        capabilities: ['Twilio bridge using the school caller ID', 'Guardian voice-consent check', 'Call audit without recordings'],
        data: ['voice_call_routes', 'voice_call_guardian_contacts', 'voice_call_audit'] },
      { id: 'broadcasts', label: 'Emergency Broadcasts', status: 'demo', roles: office,
        summary: 'One message out to SMS, email, voice, and app at once.',
        capabilities: ['Audience by school or district', 'Channel selection', 'Pre-approved templates'] },
      { id: 'cms', label: 'Website CMS', status: 'planned', roles: office,
        summary: 'Publish once to the district and school websites.',
        capabilities: ['District and school page trees', 'Calendar and news syndication', 'Accessibility checks before publish', 'Emergency banner override'] },
    ],
  },

  // ───────────── Safety & Behavior Hub ─────────────
  {
    id: 'safety', title: 'Safety', hub: 'safety', pillarId: 2, icon: ShieldAlert,
    summary: 'Front office, crisis alerts, accountability, visitors, and reunification.',
    roles: safetyUsers,
    tabs: [
      { id: 'kiosk', label: 'Front Office Kiosk', status: 'demo', roles: office,
        summary: 'Student, visitor, and staff check-in at the front desk.',
        capabilities: ['Photo, icon, QR, or PIN identification', 'Tardy and early checkout', 'Cafeteria lunch count'] },
      { id: 'crisis', label: 'Crisis Alerts', status: 'demo', roles: [...office, 'teacher', 'paraprofessional', 'substitute', 'school_nurse'],
        summary: 'Three-tier alerts with Standard Response Protocol actions.',
        capabilities: ['Tier 1 / 2 / 3 escalation', 'Hold, secure, lockdown, evacuate, shelter', 'Tier 3 authorization confirm'],
        data: ['emergency_incidents', 'emergency_event_log'] },
      { id: 'matrix', label: 'Accountability Matrix', status: 'demo', roles: safetyUsers,
        summary: 'Live student and staff accountability by room.',
        capabilities: ['Unreported vs. missing vs. injured', 'Room headcount reports', 'Heatmap and CSV roster export'],
        data: ['emergency_student_status', 'emergency_staff_status', 'emergency_external_presence'] },
      { id: 'visitors', label: 'Visitor Screening', status: 'demo', roles: office,
        summary: 'ID scan with watchlist and custody checks.',
        capabilities: ['PDF417 license scan with manual fallback', 'Custody restriction flags', 'Admin override with reason'],
        data: ['visitor_screening_logs'] },
      { id: 'reunification', label: 'Reunification', status: 'demo', roles: office,
        summary: 'Verified student release to authorized guardians.',
        capabilities: ['Guardian ID verification', 'Authorized-pickup check', 'Admin required for custody restrictions'],
        data: ['student_reunification_logs', 'student_guardians', 'student_safety_restrictions'] },
      { id: 'incidents', label: 'Incident Reports', status: 'planned', roles: safetyUsers,
        summary: 'Injury, property, and safety incident reports with follow-up.',
        capabilities: ['Structured incident forms', 'Witness statements', 'Nurse and admin follow-up tasks', 'Insurance and state export'] },
    ],
  },
  {
    id: 'behavior', title: 'Behavior & MTSS', hub: 'safety', pillarId: 4, icon: HeartPulse,
    summary: 'Positive behavior rewards, wellness check-ins, and tiered interventions.',
    roles: [...leaders, 'teacher', 'paraprofessional', 'substitute', 'student', 'sped_case_manager', 'counselor'],
    tabs: [
      { id: 'pbis', label: 'PBIS Points', status: 'demo', roles: rewardUsers,
        summary: 'Quick +1 to +5 awards for individuals, groups, and tables.',
        capabilities: ['Single, bulk, and table-group awards', 'Optional notes', 'Insert-only point ledger'],
        data: ['pbis_transactions'] },
      { id: 'categories', label: 'Behavior Categories', status: 'demo', roles: [...leaders, 'teacher'],
        summary: 'District matrix defaults with teacher custom labels.',
        capabilities: ['District default matrix', 'Custom icons, labels, and values', 'School-scoped categories'],
        data: ['behavior_categories'] },
      { id: 'store', label: 'Classroom Store', status: 'demo', roles: [...leaders, 'teacher', 'student'],
        summary: 'Students spend points on classroom rewards.',
        capabilities: ['Token store inventory', 'Purchase confirmations', 'Balance checks'] },
      { id: 'auction', label: 'Live Auction', status: 'demo', roles: [...leaders, 'teacher', 'student'],
        summary: 'Timed classroom auction for big-ticket rewards.',
        capabilities: ['Timed bidding rounds', 'Live high-bid display', 'Winner settlement'] },
      { id: 'mood-meter', label: 'Mood Meter', status: 'planned', roles: [...wellness, 'student'],
        summary: 'Four-zone daily check-in that flags students who need a counselor.',
        capabilities: ['Red / yellow / blue / green zones', 'Private student check-in', 'Counselor alerts for repeat red/blue', 'Trend view by class'] },
      { id: 'mtss', label: 'MTSS Interventions', status: 'planned', roles: wellness,
        summary: 'Tier 2 and Tier 3 intervention plans with progress monitoring.',
        capabilities: ['Intervention plans by tier', 'Progress-monitoring probes', 'Team meeting notes', 'Fidelity tracking'] },
      { id: 'early-warning', label: 'Early Warning', status: 'planned', roles: wellness,
        summary: 'Attendance, behavior, and course risk indicators in one list.',
        capabilities: ['ABC risk indicators', 'Threshold alerts', 'Assign an adult mentor', 'Export to MTSS team'] },
    ],
  },

  // ───────────── District Operations Hub ─────────────
  {
    id: 'students', title: 'Students & SIS', hub: 'operations', pillarId: 3, icon: Users,
    summary: 'Student records, registration, and daily attendance.',
    roles: [...records, 'counselor', 'teacher'],
    tabs: [
      { id: 'directory', label: 'Student Directory', status: 'demo', roles: [...records, 'counselor'],
        summary: 'Searchable student profiles with role-filtered fields.',
        capabilities: ['Teacher vs. office field views', 'Guardians and safety restrictions', 'Program designations'],
        data: ['students', 'student_guardians', 'student_program_designations'] },
      { id: 'registration', label: 'Registration', status: 'demo', roles: records,
        summary: 'Online enrollment applications and document review.',
        capabilities: ['Application review queue', 'Required documents checklist', 'Placement handoff'],
        data: ['registration_applications'] },
      { id: 'attendance', label: 'Door Kiosk Attendance', status: 'demo', roles: [...office, 'teacher'],
        summary: 'Students sign in at the classroom door; office reconciles.',
        capabilities: ['Classroom door sign-in', 'Office attendance reconciliation', 'Tardy codes'] },
      { id: 'lunch-count', label: 'Cafeteria Prep', status: 'demo', roles: office,
        summary: 'Morning lunch counts rolled up for the kitchen.',
        capabilities: ['Hot / cold / from-home counts', 'Totals by room', 'Kitchen-ready summary'] },
    ],
  },
  {
    id: 'scheduling', title: 'Scheduling', hub: 'operations', pillarId: 3, icon: CalendarRange,
    summary: 'Elementary, middle, and high school master scheduling.',
    roles: [...records, 'counselor'],
    tabs: [
      { id: 'elementary', label: 'Elementary', status: 'demo', roles: [...records, 'counselor'],
        summary: 'Balanced homerooms, specialist wheels, and flex groups.',
        capabilities: ['Balanced class placement', 'Specialist rotation wheel', 'Reading / math flex groups'],
        data: ['grade_scheduling_configs', 'specialist_rotations', 'elementary_placement_cards'] },
      { id: 'middle', label: 'Middle School', status: 'demo', roles: [...records, 'counselor'],
        summary: 'Teams/pods, exploratory wheels, and WIN blocks.',
        capabilities: ['Pod assignment', 'Exploratory rotations', 'WIN intervention blocks'],
        data: ['grade_scheduling_configs', 'scheduling_runs'] },
      { id: 'high', label: 'High School', status: 'demo', roles: [...records, 'counselor'],
        summary: 'Course requests, conflict matching, and credit audit.',
        capabilities: ['Course request intake', 'Conflict-aware placement', 'Graduation credit audit', 'Arena selection preview'],
        data: ['secondary_course_requests', 'scheduling_runs', 'scheduling_run_assignments'] },
      { id: 'calendar', label: 'District Calendar', status: 'planned', roles: [...records, 'counselor'],
        summary: 'Instructional days, bell schedules, and early-out days.',
        capabilities: ['Instructional day count', 'Bell schedules per school', 'Early-out and testing days', 'Publish to family calendars'] },
    ],
  },
  {
    id: 'transportation', title: 'Transportation & Nutrition', hub: 'operations', pillarId: 3, icon: BusFront,
    summary: 'Bus routing, dismissal changes, and school meals.',
    roles: [...office, 'parent'],
    tabs: [
      { id: 'routes', label: 'Bus Routes', status: 'planned', roles: office,
        summary: 'Stops, riders, and route timing for every bus.',
        capabilities: ['Stop and rider assignment', 'Route timing and capacity', 'Driver run sheets', 'Live bus location for families'] },
      { id: 'dismissal', label: 'Dismissal Changes', status: 'planned', roles: [...office, 'parent'],
        summary: 'Parent-requested changes to how a student goes home.',
        capabilities: ['Parent change requests', 'Office approval queue', 'Teacher dismissal list', 'Custody restriction check'] },
      { id: 'cafeteria-pos', label: 'Cafeteria POS', status: 'planned', roles: office,
        summary: 'Point-of-sale lines with allergy alerts.',
        capabilities: ['PIN / badge checkout', 'Allergy and meal-plan alerts', 'Free & reduced eligibility', 'Daily reimbursement report'] },
      { id: 'lunch-accounts', label: 'Family Lunch Accounts', status: 'planned', roles: [...office, 'parent'],
        summary: 'Balances, deposits, and low-balance notices for families.',
        capabilities: ['Account balances', 'Online deposits', 'Low-balance notices', 'Meal history'] },
    ],
  },
  {
    id: 'finance', title: 'Finance', hub: 'operations', pillarId: 6, icon: WalletCards,
    summary: 'Fund budgets, purchasing, receipts, and student fees.',
    roles: [...office, 'registrar'],
    tabs: [
      { id: 'budgets', label: 'Fund Budgets', status: 'planned', roles: leaders,
        summary: 'Budget vs. actual by fund, school, and program.',
        capabilities: ['Fund accounting codes', 'Budget vs. actual', 'Grant fund restrictions', 'Board-ready summaries'] },
      { id: 'requisitions', label: 'Requisitions & POs', status: 'planned', roles: office,
        summary: 'Purchase requests with approval routing.',
        capabilities: ['Requisition forms', 'Approval chains by amount', 'PO generation', 'Vendor records'] },
      { id: 'receipts', label: 'Receipt OCR', status: 'planned', roles: office,
        summary: 'Snap receipts and match them to purchase orders.',
        capabilities: ['Photo receipt capture', 'OCR line-item extraction', 'Three-way PO matching', 'Exception queue'] },
      { id: 'fees', label: 'Student Fees', status: 'planned', roles: [...office, 'registrar'],
        summary: 'Course and activity fees with waivers.',
        capabilities: ['Fee schedules', 'Fee waivers', 'Family payment portal', 'Transcript holds'] },
    ],
  },
  {
    id: 'hr', title: 'HR & Payroll', hub: 'operations', pillarId: 7, icon: BriefcaseBusiness,
    summary: 'Timecards, substitutes, leave, credentials, and payroll export.',
    roles: [...office, 'paraprofessional', 'substitute'],
    tabs: [
      { id: 'timecards', label: 'Timecards', status: 'planned', roles: [...office, 'paraprofessional'],
        summary: 'QR time clock with meal breaks and supervisor approval.',
        capabilities: ['QR / badge clock in and out', 'Meal-break compliance', 'Supervisor approvals', 'Overtime flags'] },
      { id: 'sub-dispatch', label: 'Substitute Dispatch', status: 'planned', roles: [...office, 'substitute'],
        summary: 'Fill absences with qualified substitutes automatically.',
        capabilities: ['Absence intake', 'Preferred-sub lists', 'Auto-dispatch by credential', 'Day pass at the kiosk'],
        data: ['sis_substitute_assignments'] },
      { id: 'leave', label: 'Leave Requests', status: 'planned', roles: office,
        summary: 'Staff leave with balances and approvals.',
        capabilities: ['Leave types and balances', 'Approval routing', 'Coverage request link', 'Calendar view'] },
      { id: 'credentials', label: 'Credentials', status: 'planned', roles: office,
        summary: 'Licenses, endorsements, and expiration reminders.',
        capabilities: ['License and endorsement records', 'Expiration reminders', 'Assignment qualification checks', 'Background-check dates'] },
      { id: 'payroll', label: 'Payroll Export', status: 'planned', roles: leaders,
        summary: 'Approved time and leave exported to payroll.',
        capabilities: ['Pay-period close', 'Earning codes', 'Export to payroll provider', 'Audit trail'] },
    ],
  },
  {
    id: 'compliance', title: 'Compliance', hub: 'operations', pillarId: 6, icon: ShieldCheck,
    summary: 'FERPA privacy, records requests, retention, and state reporting.',
    roles: [...records, 'state_compliance'],
    tabs: [
      { id: 'privacy', label: 'Privacy & Records', status: 'demo', roles: [...records, 'state_compliance'],
        summary: 'Directory opt-outs, emergency access, and 45-day record requests.',
        capabilities: ['Directory and photo opt-outs', 'Five-minute LEI access grants', '45-day request deadlines', 'Retention rule drafts'],
        data: ['parent_privacy_preferences', 'student_lei_access_grants', 'ferpa_record_requests', 'data_retention_policies'] },
      { id: 'state-reporting', label: 'State Reporting', status: 'demo', roles: [...records, 'state_compliance'],
        summary: 'Ed-Fi and state submission readiness.',
        capabilities: ['Submission readiness checks', 'State identifier review', 'Reporting outbox'],
        data: ['student_state_identifiers', 'sis_reporting_outbox'] },
      { id: 'audit-log', label: 'Audit Log', status: 'planned', roles: [...leaders, 'state_compliance'],
        summary: 'Who viewed or changed sensitive records, and why.',
        capabilities: ['Append-only access log', 'Filter by student or staff', 'Sensitive-field reads', 'Export for investigations'],
        data: ['ferpa_audit_logs'] },
      { id: 'access', label: 'Roles & Access', status: 'planned', roles: leaders,
        summary: 'Assign scoped, expiring roles to staff.',
        capabilities: ['Scoped school / district memberships', 'Expiring substitute access', 'Permission catalog', 'Access reviews'],
        data: ['sis_memberships', 'sis_role_permissions'] },
    ],
  },
];

export function sectionsForHub(hubId: HubId, sections: PrimarySection[]): PrimarySection[] {
  return sections.filter((section) => section.hub === hubId);
}

export function visibleSectionsForRoles(roles: string[]): PrimarySection[] {
  return primarySections.filter((section) => section.roles.some((role) => roles.includes(role)));
}

export function visibleTabsForRoles(section: PrimarySection | undefined, roles: string[]): ChildTab[] {
  return section?.tabs.filter((tab) => tab.roles.some((role) => roles.includes(role))) ?? [];
}

export function hubFor(section: PrimarySection): Hub {
  return hubs.find((hub) => hub.id === section.hub) ?? hubs[0];
}
