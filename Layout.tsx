import {
  BookOpen,
  BriefcaseBusiness,
  Landmark,
  MessageCircle,
  ShieldAlert,
  Trophy,
} from 'lucide-react-native';

export type PrimarySectionId = 'lms' | 'communication' | 'safety' | 'behavior' | 'hr' | 'admin';
export type AppRole =
  | 'district_admin' | 'school_admin' | 'secretary' | 'teacher' | 'paraprofessional'
  | 'substitute' | 'parent' | 'student' | 'registrar' | 'sped_case_manager'
  | 'counselor' | 'school_nurse' | 'state_compliance';

export type ChildTab = {
  id: string;
  label: string;
  default?: boolean;
  roles: AppRole[];
};

export type PrimarySection = {
  id: PrimarySectionId;
  title: string;
  path: string;
  defaultTab: string;
  pillarId: number;
  icon: typeof BookOpen;
  roles: AppRole[];
  tabs: ChildTab[];
};

const admins: AppRole[] = ['district_admin', 'school_admin'];
const office: AppRole[] = ['district_admin', 'school_admin', 'secretary', 'registrar'];
const educators: AppRole[] = ['district_admin', 'school_admin', 'teacher', 'sped_case_manager'];
const classroomUsers: AppRole[] = ['district_admin', 'school_admin', 'teacher', 'substitute', 'sped_case_manager'];
const safetyUsers: AppRole[] = ['district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional', 'substitute', 'counselor', 'school_nurse'];

export const primarySections: PrimarySection[] = [
  {
    id: 'lms', title: 'LMS', path: '/lms', defaultTab: 'stream', pillarId: 1, icon: BookOpen,
    roles: ['district_admin', 'school_admin', 'teacher', 'substitute', 'paraprofessional', 'counselor', 'sped_case_manager'],
    tabs: [
      { id: 'stream', label: 'Daily Stream', default: true, roles: classroomUsers },
      { id: 'gradebook', label: 'Dual Gradebook', roles: educators },
      { id: 'hattie', label: 'Hattie Self-Reporting', roles: ['district_admin', 'school_admin', 'teacher', 'student'] },
      { id: 'portfolios', label: 'Portfolios & Seesaw', roles: ['district_admin', 'school_admin', 'teacher', 'parent', 'student'] },
      { id: 'special-ed', label: 'Special Ed & IEPs', roles: ['district_admin', 'school_admin', 'teacher', 'paraprofessional', 'substitute', 'parent', 'student', 'sped_case_manager', 'counselor'] },
      { id: 'planbook', label: 'Planbook Lesson Planner', roles: classroomUsers },
      { id: 'seating', label: 'Seating Charts', roles: ['district_admin', 'school_admin', 'teacher', 'paraprofessional', 'substitute', 'sped_case_manager'] },
    ],
  },
  {
    id: 'communication', title: 'Communication', path: '/communication', defaultTab: 'feed', pillarId: 5, icon: MessageCircle,
    roles: ['district_admin', 'school_admin', 'secretary', 'teacher', 'substitute', 'parent', 'student'],
    tabs: [
      { id: 'feed', label: 'Districtgram Feed', default: true, roles: ['district_admin', 'school_admin', 'secretary', 'teacher', 'substitute', 'parent', 'student'] },
      { id: 'messages', label: 'Direct Messaging', roles: ['district_admin', 'school_admin', 'secretary', 'teacher', 'substitute', 'parent'] },
      { id: 'masked-caller', label: 'Masked Caller Gateway', roles: ['district_admin', 'school_admin', 'secretary', 'teacher'] },
      { id: 'cms', label: 'Web CMS Engine', roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'broadcasts', label: 'Emergency Broadcasts', roles: ['district_admin', 'school_admin', 'secretary'] },
    ],
  },
  {
    id: 'safety', title: 'Safety', path: '/safety', defaultTab: 'kiosk', pillarId: 2, icon: ShieldAlert,
    roles: safetyUsers,
    tabs: [
      { id: 'kiosk', label: 'Front Office Kiosk', default: true, roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'matrix', label: 'Emergency Matrix', roles: safetyUsers },
      { id: 'crisis', label: '3-Tier Crisis Alerts', roles: ['district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional', 'substitute', 'school_nurse'] },
      { id: 'incidents', label: 'Incident Reports & ODRs', roles: ['district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional', 'substitute', 'counselor', 'school_nurse'] },
      { id: 'visitors', label: 'Visitor Screening', roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'reunification', label: 'Reunification', roles: ['district_admin', 'school_admin', 'secretary'] },
    ],
  },
  {
    id: 'behavior', title: 'Behavior', path: '/behavior', defaultTab: 'mood-meter', pillarId: 4, icon: Trophy,
    roles: ['district_admin', 'school_admin', 'teacher', 'paraprofessional', 'substitute', 'student', 'sped_case_manager', 'counselor'],
    tabs: [
      { id: 'mood-meter', label: 'Mood Meter', default: true, roles: ['district_admin', 'school_admin', 'teacher', 'student', 'sped_case_manager', 'counselor'] },
      { id: 'pbis', label: 'PBIS Points & Tracker', roles: ['district_admin', 'school_admin', 'teacher', 'paraprofessional', 'substitute', 'student'] },
      { id: 'avatar', label: 'Avatar Creator', roles: ['district_admin', 'school_admin', 'teacher', 'student'] },
      { id: 'store', label: 'Classroom Store', roles: ['district_admin', 'school_admin', 'teacher', 'student'] },
      { id: 'auction', label: 'Live Class Auction', roles: ['district_admin', 'school_admin', 'teacher', 'student'] },
      { id: 'mtss', label: 'MTSS Interventions', roles: ['district_admin', 'school_admin', 'teacher', 'sped_case_manager', 'counselor'] },
    ],
  },
  {
    id: 'hr', title: 'Human Resources', path: '/hr', defaultTab: 'timecards', pillarId: 7, icon: BriefcaseBusiness,
    roles: ['district_admin', 'school_admin', 'secretary', 'paraprofessional'],
    tabs: [
      { id: 'timecards', label: 'Para Timecard Console', default: true, roles: ['district_admin', 'school_admin', 'secretary', 'paraprofessional'] },
      { id: 'sub-dispatch', label: 'Sub Dispatch Engine', roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'leave', label: 'Leave Requests', roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'credentials', label: 'Credentials & Licensing', roles: ['district_admin', 'school_admin', 'secretary'] },
    ],
  },
  {
    id: 'admin', title: 'Admin', path: '/admin', defaultTab: 'sis-directory', pillarId: 3, icon: Landmark,
    roles: ['district_admin', 'school_admin', 'secretary', 'counselor', 'registrar', 'state_compliance'],
    tabs: [
      { id: 'sis-directory', label: 'Student Directory (SIS)', default: true, roles: ['district_admin', 'school_admin', 'secretary', 'counselor', 'registrar'] },
      { id: 'door-kiosk', label: 'Door Kiosks & Attendance', roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'master-scheduling', label: 'Master Scheduling', roles: ['district_admin', 'school_admin', 'secretary', 'counselor', 'registrar'] },
      { id: 'finance', label: 'LINQ Finance & OCR', roles: ['district_admin', 'school_admin', 'secretary'] },
      { id: 'compliance', label: 'State Compliance & Ed-Fi', roles: ['district_admin', 'school_admin', 'secretary', 'state_compliance', 'registrar'] },
    ],
  },
];

export function visibleSectionsForRoles(roles: string[]): PrimarySection[] {
  return primarySections.filter((section) => section.roles.some((role) => roles.includes(role)));
}

export function visibleTabsForRoles(section: PrimarySection | undefined, roles: string[]): ChildTab[] {
  return section?.tabs.filter((tab) => tab.roles.some((role) => roles.includes(role))) ?? [];
}