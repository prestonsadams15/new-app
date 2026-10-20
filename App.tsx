import React, { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BusFront,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutDashboard,
  MessageCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShieldAlert,
  Users,
  UserRoundCheck,
  UserRoundSearch,
  WalletCards,
  X,
} from 'lucide-react-native';
import { CommunicationCenter } from './CommunicationWorkflows';
import { InstructionWorkspace } from './InstructionWorkspace';
import { LessonPlannerWorkspace } from './LessonPlannerWorkspace';
import { SpecialEducationWorkspace } from './SpecialEducationWorkspace';
import { ClassroomSeatingWorkspace } from './ClassroomSeatingWorkspace';
import { ReunificationWorkspace, VisitorScreeningWorkspace } from './SafetyOperationsWorkspace';
import { UnifiedGradebookWorkspace, type ViewId as GradebookViewId } from './UnifiedGradebookWorkspace';
import { StudentInformationWorkspace } from './StudentInformationWorkspace';
import { BehaviorRewardsWorkspace } from './BehaviorRewardsWorkspace';
import { EmergencyCommandWorkspace } from './EmergencyCommandWorkspace';
import { ClassroomKioskWorkspace } from './ClassroomKioskWorkspace';
import { K12SchedulingEngine } from './K12SchedulingEngine';
import { PrivacyComplianceWorkspace } from './PrivacyComplianceWorkspace';
import { supabase } from './lib/supabase';
import { primarySections, visibleSectionsForRoles, visibleTabsForRoles, type PrimarySectionId } from './Layout';
import { SubNavHeader } from './SubNavHeader';

 type OperationalHub = 'Classroom Hub' | 'Safety & Behavior Hub' | 'District Operations Hub';
 type Hub = 'Overview' | OperationalHub;
type KioskPath = 'Student checkout' | 'Visitor or volunteer' | 'Substitute teacher' | 'District personnel' | 'Hourly staff';
const palette = {
  ink: '#182820', muted: '#758078', canvas: '#f5f6f2', paper: '#ffffff', line: '#e6e9e3',
  forest: '#284b3c', forestDeep: '#20392f', lime: '#c5e889', limeSoft: '#eef6e3',
  orange: '#d8774d', orangeSoft: '#fff0e9', blue: '#6e94b1', blueSoft: '#eaf1f6',
  yellow: '#d4a944', yellowSoft: '#fbf4df',
};

const students = [
  { name: 'Maya Thompson', grade: 'Grade 4', room: 'Room 12', state: 'Present', initial: 'MT', color: '#f2e6d5' },
  { name: 'Ethan Chen', grade: 'Grade 2', room: 'Room 08', state: 'Present', initial: 'EC', color: '#e1e9d7' },
  { name: 'Sofia Martinez', grade: 'Grade 7', room: 'Science lab', state: 'Present', initial: 'SM', color: '#eee2ee' },
  { name: 'Noah Williams', grade: 'Kindergarten', room: 'Room 03', state: 'Checked out', initial: 'NW', color: '#e0e9ef' },
];

 const navItems: { label: Hub; icon: typeof LayoutDashboard }[] = [
   { label: 'Overview', icon: LayoutDashboard },
   { label: 'Classroom Hub', icon: GraduationCap },
   { label: 'Safety & Behavior Hub', icon: ShieldAlert },
   { label: 'District Operations Hub', icon: Users },
];
 
 const pillars: {
   id: number;
   name: string;
  icon: typeof GraduationCap;
   hubs: OperationalHub[];
   summary: string;
   features: string[];
 }[] = [
   {
     id: 1,
     name: 'LMS & Instruction',
    icon: GraduationCap,
     hubs: ['Classroom Hub'],
     summary: 'Classroom stream, portfolios, lesson planning, and special education.',
     features: ['Daily class stream and Workspace sync', 'Student portfolios and mastery', 'IEP / 504 goals and compliance', 'Lesson planner and seating charts'],
   },
   {
     id: 2,
     name: 'Safety & Security',
    icon: ShieldAlert,
     hubs: ['Safety & Behavior Hub'],
     summary: 'Campus awareness, visitor access, crisis response, and reunification.',
     features: ['Emergency attendance matrix', 'Three-tier rapid alerts', 'Visitor check-in and badge workflow', 'Incident forms and reunification'],
   },
   {
     id: 3,
     name: 'Operations & Transportation',
    icon: BusFront,
     hubs: ['District Operations Hub'],
     summary: 'Student records, enrollment, scheduling, transportation, and nutrition.',
     features: ['Student profiles and online registration', 'Master scheduling and bus routing', 'Door kiosk attendance and lunch', 'Cafeteria POS and family lunch hub'],
   },
   {
     id: 4,
     name: 'Behavior & MTSS Interventions',
    icon: HeartPulse,
     hubs: ['Safety & Behavior Hub'],
     summary: 'Whole-child wellness, positive behavior, interventions, and early warning.',
     features: ['Four-zone mood check-in', 'PBIS rewards and store', 'Tier 2 / 3 progress monitoring', 'Early warning risk indicators'],
   },
   {
     id: 5,
     name: 'Communication & Community',
    icon: MessageCircle,
     hubs: ['Classroom Hub', 'District Operations Hub'],
     summary: 'A shared family feed and publish-once district communication workflow.',
     features: ['District and school-site publishing', 'Classroom family feed and translation', 'Masked two-way messages and calls', 'Emergency broadcasts across channels'],
   },
   {
     id: 6,
     name: 'District Admin & Finance',
    icon: WalletCards,
     hubs: ['District Operations Hub'],
     summary: 'Fund accounting, purchasing, reporting, transcripts, and student fees.',
     features: ['Fund budgets and requisition approvals', 'Receipt capture and PO matching', 'Ed-Fi / OneRoster reporting pipelines', 'Transcripts, fees, and waivers'],
   },
   {
     id: 7,
     name: 'Human Resources & Payroll',
    icon: Users,
     hubs: ['District Operations Hub'],
     summary: 'Staff leave, substitute coverage, hourly timecards, and payroll routing.',
     features: ['Staff leave and credential tracking', 'Substitute dispatch and coverage', 'QR time clock and meal breaks', 'Supervisor approvals and payroll export'],
   },
 ];

const pillarRoles: Record<number, string[]> = {
  1: ['district_admin', 'school_admin', 'teacher', 'paraprofessional', 'substitute', 'parent', 'student', 'sped_case_manager', 'counselor'],
  2: ['district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional', 'substitute', 'counselor', 'school_nurse'],
  3: ['district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional', 'substitute', 'parent', 'student', 'registrar', 'state_compliance'],
  4: ['district_admin', 'school_admin', 'secretary', 'teacher', 'paraprofessional', 'substitute', 'parent', 'student', 'sped_case_manager', 'counselor'],
  5: ['district_admin', 'school_admin', 'secretary', 'teacher', 'parent', 'student'],
  6: ['district_admin', 'school_admin', 'secretary', 'registrar', 'state_compliance'],
  7: ['district_admin', 'school_admin', 'secretary', 'paraprofessional', 'substitute'],
};

function Label({ children, color = palette.muted }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.label, { color }]}>{children}</Text>;
}

function IconButton({ icon: Icon, onPress, label, badge }: {
  icon: typeof Search; onPress: () => void; label: string; badge?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <Icon size={18} color={palette.ink} strokeWidth={1.8} />
      {badge ? <View style={styles.notificationDot} /> : null}
    </Pressable>
  );
}

function RoutePreview({ section, tab }: { section: string; tab: string }) {
  return (
    <View style={styles.routePreview}>
      <Label color={palette.forest}>{section.toUpperCase()} WORKSPACE</Label>
      <Text style={styles.routePreviewTitle}>{tab}</Text>
      <Text style={styles.routePreviewCopy}>This route is part of the District OS navigation preview. Its workflow and protected data connection are not implemented yet.</Text>
      <Text style={styles.demoFootnote}>DEMO MODE · Sample data only · No live student or staff records</Text>
    </View>
  );
}

function App() {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const narrow = width < 560;
  const isDemoMode = !supabase;
  const [activeHub, setActiveHub] = useState<Hub>('Overview');
  const [activeSectionId, setActiveSectionId] = useState<PrimarySectionId>('lms');
  const [activeSubTabId, setActiveSubTabId] = useState('stream');
  const [selectedPillarId, setSelectedPillarId] = useState<number | null>(1);
  const [memberRoles, setMemberRoles] = useState<string[]>(isDemoMode ? ['district_admin'] : []);
  const [membershipsLoaded, setMembershipsLoaded] = useState(isDemoMode);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const collapsedSidebar = !compact && sidebarCollapsed;
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [kioskPath, setKioskPath] = useState<KioskPath | null>(null);
  const [kioskStep, setKioskStep] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let mounted = true;
    const applySessionRoles = async (session: Session | null) => {
      if (!session) {
        setMemberRoles([]);
        setMembershipsLoaded(true);
        return;
      }
      const { data, error } = await client.auth.getClaims(session.access_token);
      const memberships = data?.claims?.sis_memberships as { role?: string }[] | undefined;
      setMemberRoles(error ? [] : memberships?.map((membership) => membership.role).filter((role): role is string => typeof role === 'string') ?? []);
      setMembershipsLoaded(true);
    };
    void client.auth.getSession().then(({ data }) => { if (mounted) void applySessionRoles(data.session); }).catch(() => { if (mounted) setMembershipsLoaded(true); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (mounted) void applySessionRoles(session); }, 0);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  const matchedStudents = useMemo(
    () => students.filter((student) => student.name.toLowerCase().includes(search.toLowerCase())), [search],
  );
  const permittedPillars = membershipsLoaded
    ? pillars.filter((pillar) => pillarRoles[pillar.id].some((role) => memberRoles.includes(role)))
    : [];
  const visibleSections = membershipsLoaded ? visibleSectionsForRoles(memberRoles) : [];
  const activeSection = visibleSections.find((section) => section.id === activeSectionId) ?? visibleSections[0] ?? primarySections[0];
  const visibleSubTabs = visibleTabsForRoles(activeSection, memberRoles);
  const activeSubTab = visibleSubTabs.find((tab) => tab.id === activeSubTabId) ?? visibleSubTabs[0];
  const visiblePillars = permittedPillars;
  const selectedPillar = pillars.find((pillar) => pillar.id === selectedPillarId);

  useEffect(() => {
    if (!membershipsLoaded) return;
    if (!visibleSections.some((section) => section.id === activeSectionId)) {
      const firstSection = visibleSections[0];
      if (firstSection) {
        setActiveSectionId(firstSection.id);
        setActiveSubTabId(firstSection.defaultTab);
      }
      return;
    }
    if (visibleSubTabs.length && !visibleSubTabs.some((tab) => tab.id === activeSubTabId)) {
      setActiveSubTabId(visibleSubTabs[0].id);
    }
  }, [membershipsLoaded, memberRoles, activeSectionId, activeSubTabId]);

  const startKioskPath = (path: KioskPath) => { setKioskPath(path); setKioskStep(0); };
  const closeKiosk = () => { setKioskPath(null); setKioskStep(0); };
  const steps = kioskPath === 'Student checkout' ? ['Find student', 'Verify guardian', 'Confirm pickup']
    : kioskPath === 'Hourly staff' ? ['Scan staff badge', 'Choose time action', 'Confirm timecard']
      : kioskPath === 'Substitute teacher' ? ['Scan job QR', 'Confirm assignment', 'Print day pass']
        : ['Identify yourself', 'Choose visit details', 'Finish check-in'];
  const title = activeSection.title;
  const subtitle = `${activeSection.path}${activeSubTab ? `/${activeSubTab.id}` : ''} · Role-filtered workspace`;
  const selectSection = (sectionId: PrimarySectionId) => {
    const section = primarySections.find((item) => item.id === sectionId);
    if (!section) return;
    setActiveSectionId(section.id);
    setActiveSubTabId(section.defaultTab);
    setSelectedPillarId(section.pillarId);
    setMobileNavOpen(false);
  };
  const selectSubTab = (tabId: string) => setActiveSubTabId(tabId);
  const selectPillar = (pillarId: number | null) => {
    const section = primarySections.find((item) => item.pillarId === pillarId);
    if (section) selectSection(section.id);
  };
  const renderWorkspace = () => {
    const tabId = activeSubTab?.id;
    if (activeSection.id === 'lms' && ['gradebook', 'hattie', 'portfolios'].includes(tabId ?? '')) {
      const role = memberRoles.includes('student') ? 'student' : memberRoles.includes('parent') ? 'parent' : 'teacher';
      const initialView: GradebookViewId = role === 'student' ? 'canvas' : tabId === 'portfolios' || role === 'parent' ? 'queue' : 'gradebook';
      return <UnifiedGradebookWorkspace narrow={narrow} role={role} initialView={initialView} />;
    }
    if (activeSection.id === 'lms' && tabId === 'stream') return <InstructionWorkspace narrow={narrow} />;
    if (activeSection.id === 'lms' && tabId === 'special-ed') return <SpecialEducationWorkspace narrow={narrow} />;
    if (activeSection.id === 'lms' && tabId === 'planbook') return <LessonPlannerWorkspace narrow={narrow} />;
    if (activeSection.id === 'lms' && tabId === 'seating') return <ClassroomSeatingWorkspace narrow={narrow} />;
    if (activeSection.id === 'communication' && tabId === 'feed') return <CommunicationCenter narrow={narrow} />;
    if (activeSection.id === 'safety' && tabId === 'kiosk') return <ClassroomKioskWorkspace narrow={narrow} />;
    if (activeSection.id === 'safety' && (tabId === 'matrix' || tabId === 'crisis')) return <EmergencyCommandWorkspace narrow={narrow} />;
    if (activeSection.id === 'safety' && tabId === 'visitors') return <VisitorScreeningWorkspace narrow={narrow} />;
    if (activeSection.id === 'safety' && tabId === 'reunification') return <ReunificationWorkspace narrow={narrow} />;
    if (activeSection.id === 'behavior' && (tabId === 'mood-meter' || tabId === 'pbis')) return <BehaviorRewardsWorkspace narrow={narrow} />;
    if (activeSection.id === 'admin' && tabId === 'sis-directory') return <StudentInformationWorkspace narrow={narrow} />;
    if (activeSection.id === 'admin' && tabId === 'door-kiosk') return <ClassroomKioskWorkspace narrow={narrow} />;
    if (activeSection.id === 'admin' && tabId === 'master-scheduling') return <K12SchedulingEngine narrow={narrow} />;
    if (activeSection.id === 'admin' && tabId === 'compliance') return <PrivacyComplianceWorkspace narrow={narrow} />;
    return <RoutePreview section={activeSection.title} tab={activeSubTab?.label ?? activeSection.title} />;
  };

  const SidebarContent = () => (
    <>
      <View style={[styles.brandBlock, collapsedSidebar && styles.brandBlockCollapsed]}>
        <View style={styles.brandMark}><Home size={19} color={palette.forestDeep} strokeWidth={2.2} /></View>
        {!collapsedSidebar ? <View><Text style={styles.brandName}>district OS</Text><Text style={styles.brandSub}>CEDAR VALLEY</Text></View> : null}
      </View>
      {!collapsedSidebar ? <Text style={styles.sideEyebrow}>WORKSPACE</Text> : null}
      <View style={[styles.schoolPicker, collapsedSidebar && styles.schoolPickerCollapsed]}>
        <View style={styles.schoolSeal}><Text style={styles.schoolSealText}>CV</Text></View>
        {!collapsedSidebar ? <View style={{ flex: 1 }}><Text style={styles.schoolName}>Cedar Valley USD</Text><Text style={styles.schoolSub}>District view</Text></View> : null}
        {!collapsedSidebar ? <ChevronDown size={15} color="#a8b9ad" /> : null}
      </View>
      {!collapsedSidebar ? <Text style={[styles.sideEyebrow, { marginTop: 27 }]}>DISTRICT WORKSPACES</Text> : null}
      {visibleSections.map(({ id, title: sectionTitle, icon: Icon }) => {
        const selected = activeSectionId === id;
        return (
          <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={sectionTitle} onPress={() => selectSection(id)} style={[styles.navItem, collapsedSidebar && styles.navItemCollapsed, selected && styles.navItemSelected]}>
            <Icon size={18} color={selected ? palette.ink : '#b5c4ba'} strokeWidth={1.8} />
            {!collapsedSidebar ? <Text style={[styles.navText, selected && styles.navTextSelected]}>{sectionTitle}</Text> : null}
          </Pressable>
        );
      })}
      {!collapsedSidebar ? <Text style={[styles.sideEyebrow, { marginTop: 25 }]}>QUICK ACCESS</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Front office kiosk" onPress={() => startKioskPath('Visitor or volunteer')} style={[styles.quickLink, collapsedSidebar && styles.quickLinkCollapsed]}><UserRoundCheck size={17} color="#b5c4ba" />{!collapsedSidebar ? <Text style={styles.quickText}>Front office kiosk</Text> : null}</Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Staff and facilities" onPress={() => { selectSection('hr'); }} style={[styles.quickLink, collapsedSidebar && styles.quickLinkCollapsed]}><CalendarDays size={17} color="#b5c4ba" />{!collapsedSidebar ? <Text style={styles.quickText}>Staff & facilities</Text> : null}</Pressable>
      <View style={[styles.sidebarBottom, collapsedSidebar && styles.sidebarBottomCollapsed]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>JD</Text></View>
        {!collapsedSidebar ? <View style={{ flex: 1 }}><Text style={styles.profileName}>Jordan Davis</Text><Text style={styles.profileRole}>District administrator</Text></View> : null}
        {!collapsedSidebar ? <ChevronDown size={15} color="#a8b9ad" /> : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        {!compact ? <View style={[styles.sidebar, collapsedSidebar && styles.sidebarCollapsed]}><SidebarContent /></View> : null}
        {compact && mobileNavOpen ? <View style={styles.mobileDrawer}>
          <View style={styles.mobileDrawerHeader}><Text style={styles.mobileDrawerTitle}>Navigation</Text><IconButton icon={X} label="Close navigation" onPress={() => setMobileNavOpen(false)} /></View>
          <SidebarContent />
        </View> : null}
        <View style={styles.mainColumn}>
          <View style={styles.topbar}>
            <View style={styles.topLeft}>
              {compact ? <IconButton icon={Menu} label="Open navigation" onPress={() => setMobileNavOpen(!mobileNavOpen)} /> : null}
              {!compact ? <IconButton icon={sidebarCollapsed ? PanelLeftOpen : PanelLeftClose} label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onPress={() => setSidebarCollapsed(!sidebarCollapsed)} /> : null}
              <Text style={styles.breadcrumb}>Cedar Valley USD <Text style={styles.breadcrumbDivider}>/</Text> <Text style={styles.breadcrumbActive}>{activeSection.title}</Text></Text>
            </View>
            <View style={styles.topActions}>
              <Pressable onPress={() => setSearchOpen(true)} style={[styles.searchTrigger, narrow && styles.searchTriggerNarrow]}>
                <Search size={16} color={palette.muted} /><Text style={styles.searchTriggerText}>{narrow ? 'Search' : 'Search students, staff...'}</Text>
                {!narrow ? <Text style={styles.shortcut}>/</Text> : null}
              </Pressable>
              <IconButton icon={Bell} label="Open alerts" badge onPress={() => setAlertsOpen(true)} />
              {!narrow ? <View style={styles.todayPill}><View style={styles.liveDot} /><Text style={styles.todayText}>Mon, Oct 19</Text></View> : null}
            </View>
          </View>

          <SubNavHeader tabs={visibleSubTabs} activeTabId={activeSubTab?.id ?? ''} onSelect={selectSubTab} />

          <ScrollView contentContainerStyle={[styles.page, narrow && styles.pageNarrow]}>
            {!membershipsLoaded ? <View style={styles.accessGate}><Clock3 size={20} color={palette.muted} /><Text style={styles.accessTitle}>Checking district access…</Text></View>
              : !isDemoMode && memberRoles.length === 0 ? <View style={styles.accessGate}><ShieldAlert size={22} color={palette.orange} /><Text style={styles.accessTitle}>No active district role</Text><Text style={styles.accessCopy}>Sign in with a district account that has an active SIS membership to continue.</Text></View>
                : !isDemoMode ? <View style={styles.accessGate}><ShieldAlert size={22} color={palette.forest} /><Text style={styles.accessTitle}>Role verified · protected data adapters pending</Text><Text style={styles.accessCopy}>Your SIS role controls visible hubs. Sample student records stay hidden until each workspace reads through its RLS-protected repository.</Text></View>
                  : <>
            <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}><Label color={palette.forest}>MONDAY, OCTOBER 19, 2026</Label><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>
              <Pressable style={styles.primaryButton} onPress={() => startKioskPath('Visitor or volunteer')}><Plus size={17} color={palette.paper} /><Text style={styles.primaryButtonText}>Front office</Text></Pressable>
            </View>

            {renderWorkspace()}{false && <>
            <View style={[styles.metricGrid, narrow && styles.metricGridNarrow]}>
              <View style={[styles.metricCard, styles.metricCardFeatured]}>
                <View style={styles.metricTop}><Text style={[styles.metricLabel, { color: '#d1ded5' }]}>STUDENTS PRESENT</Text><GraduationCap size={18} color={palette.lime} /></View>
                <View style={styles.metricValueRow}><Text style={[styles.metricValue, { color: '#fff' }]}>4,286</Text><View style={styles.metricDelta}><ArrowUpRight size={12} color={palette.lime} /><Text style={styles.metricDeltaText}>2.4%</Text></View></View>
                <Text style={styles.metricNote}>of 4,512 enrolled today</Text><View style={styles.progressTrack}><View style={styles.progressValue} /></View>
              </View>
              <View style={styles.metricCard}>
                <View style={styles.metricTop}><Text style={styles.metricLabel}>ATTENDANCE RATE</Text><CalendarDays size={18} color={palette.forest} /></View>
                <View style={styles.metricValueRow}><Text style={styles.metricValue}>95.0%</Text><ArrowUpRight size={15} color={palette.forest} /></View>
                <Text style={styles.metricNote}>+0.8% from last Monday</Text>
                <View style={styles.miniBars}>{[26, 37, 31, 49, 43, 56, 45, 66, 52, 72, 62, 86].map((height, i) => <View key={i} style={[styles.miniBar, { height, backgroundColor: i === 11 ? palette.forest : '#dce7df' }]} />)}</View>
              </View>
              <View style={styles.metricCard}>
                <View style={styles.metricTop}><Text style={styles.metricLabel}>STAFF ON CAMPUS</Text><Users size={18} color={palette.blue} /></View>
                <View style={styles.metricValueRow}><Text style={styles.metricValue}>318</Text><View style={[styles.metricDelta, { backgroundColor: palette.blueSoft }]}><Text style={[styles.metricDeltaText, { color: '#476f8b' }]}>of 326</Text></View></View>
                <Text style={styles.metricNote}>8 out · 5 coverage requests</Text>
                <View style={styles.staffDots}>{Array.from({ length: 16 }, (_, i) => <View key={i} style={[styles.staffDot, { backgroundColor: i < 13 ? palette.blue : '#e7ebea' }]} />)}</View>
              </View>
              <View style={styles.metricCard}>
                <View style={styles.metricTop}><Text style={styles.metricLabel}>ACTIVE SAFETY ITEMS</Text><ShieldAlert size={18} color={palette.orange} /></View>
                <View style={styles.metricValueRow}><Text style={styles.metricValue}>02</Text><View style={[styles.metricDelta, { backgroundColor: palette.orangeSoft }]}><Text style={[styles.metricDeltaText, { color: '#b65c3b' }]}>Needs review</Text></View></View>
                <Text style={styles.metricNote}>1 open · 1 follow-up due</Text>
                <Pressable onPress={() => setActiveHub('Safety & Behavior Hub')} style={styles.metricLink}><Text style={styles.metricLinkText}>Review safety hub</Text><ArrowRight size={13} color={palette.forest} /></Pressable>
              </View>
            </View>

            <View style={styles.pillarSection}>
              <View style={styles.pillarHeader}>
                <View style={{ flex: 1 }}>
                  <Label color={palette.forest}>ONE PLATFORM · SEVEN PILLARS</Label>
                  <Text style={styles.pillarHeading}>{activeHub === 'Overview' ? 'Connected district workflows' : activeHub}</Text>
                  <Text style={styles.pillarSubtitle}>{activeHub === 'Overview' ? 'Browse the platform by operational hub.' : 'Pillars available to this operational hub.'}</Text>
                </View>
                <View style={styles.pillarCount}><Text style={styles.pillarCountText}>{visiblePillars.length} PILLARS</Text></View>
              </View>
              <View style={styles.sharedLayer}>
                <View style={styles.sharedLayerMarker}><Home size={14} color={palette.forest} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sharedLayerTitle}>Shared district data layer</Text>
                  <Text style={styles.sharedLayerText}>Tenant, school, and role scope connect student, staff, household, schedule, communication, and audit records across pillars.</Text>
                </View>
                <Text style={styles.architectureTag}>ARCHITECTURE PREVIEW</Text>
              </View>
              <View style={styles.pillarGrid}>
                {visiblePillars.map((pillar) => {
                  const selected = selectedPillarId === pillar.id;
                  return (
                    <Pressable key={pillar.id} onPress={() => selectPillar(selected ? null : pillar.id)} style={[styles.pillarCard, narrow && styles.pillarCardNarrow, selected && styles.pillarCardSelected]}>
                      <View style={styles.pillarCardTop}><Text style={styles.pillarNumber}>PILLAR {String(pillar.id).padStart(2, '0')}</Text><ArrowRight size={14} color={selected ? palette.forest : '#98a29a'} /></View>
                      <Text style={styles.pillarName}>{pillar.name}</Text>
                      <Text style={styles.pillarSummary}>{pillar.summary}</Text>
                      <View style={styles.pillarHubRow}>{pillar.hubs.map((hub) => <Text key={hub} style={styles.pillarHubTag}>{hub.replace(' Hub', '')}</Text>)}</View>
                    </Pressable>
                  );
                })}
              </View>
              {selectedPillar ? <View style={styles.pillarDetail}>
                <Text style={styles.pillarDetailTitle}>Pillar {selectedPillar?.id}: {selectedPillar?.name}</Text>
                <Text style={styles.pillarDetailFeatures}>{selectedPillar?.features.join('  ·  ')}</Text>
              </View> : null}
              <Text style={styles.pillarFootnote}>Hub navigation is a role-based view over shared platform domains. Backend services and access policies are not connected in this demo.</Text>
            </View>

            <View style={[styles.contentGrid, narrow && styles.contentGridNarrow]}>
              <View style={styles.panel}>
                <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>School pulse</Text><Text style={styles.panelSubtitle}>Live snapshot across your district</Text></View><Pressable style={styles.dropdown}><Text style={styles.dropdownText}>All schools</Text><ChevronDown size={14} color={palette.muted} /></Pressable></View>
                <View style={styles.schoolRow}><View style={[styles.schoolGlyph, { backgroundColor: '#e5f0df' }]}><Text style={[styles.schoolGlyphText, { color: '#4e7044' }]}>E</Text></View><View style={styles.schoolInfo}><Text style={styles.schoolRowName}>Evergreen Elementary</Text><Text style={styles.schoolRowMeta}>K–5 · 682 students</Text></View><View style={styles.schoolStat}><Text style={styles.schoolRate}>96.8%</Text><Text style={styles.schoolRateCaption}>present</Text></View><View style={[styles.statusPill, { backgroundColor: palette.limeSoft }]}><View style={[styles.statusDot, { backgroundColor: '#73a553' }]} /><Text style={[styles.statusText, { color: '#50753a' }]}>On track</Text></View><ChevronRight size={16} color="#a3ada5" /></View>
                <View style={styles.schoolRow}><View style={[styles.schoolGlyph, { backgroundColor: '#f7ebd9' }]}><Text style={[styles.schoolGlyphText, { color: '#a47134' }]}>C</Text></View><View style={styles.schoolInfo}><Text style={styles.schoolRowName}>Canyon Ridge Middle</Text><Text style={styles.schoolRowMeta}>6–8 · 514 students</Text></View><View style={styles.schoolStat}><Text style={styles.schoolRate}>93.2%</Text><Text style={styles.schoolRateCaption}>present</Text></View><View style={[styles.statusPill, { backgroundColor: palette.yellowSoft }]}><View style={[styles.statusDot, { backgroundColor: palette.yellow }]} /><Text style={[styles.statusText, { color: '#96742b' }]}>Watch</Text></View><ChevronRight size={16} color="#a3ada5" /></View>
                <View style={styles.schoolRow}><View style={[styles.schoolGlyph, { backgroundColor: '#e1ebf2' }]}><Text style={[styles.schoolGlyphText, { color: '#55778e' }]}>W</Text></View><View style={styles.schoolInfo}><Text style={styles.schoolRowName}>Westfield High School</Text><Text style={styles.schoolRowMeta}>9–12 · 1,204 students</Text></View><View style={styles.schoolStat}><Text style={styles.schoolRate}>94.4%</Text><Text style={styles.schoolRateCaption}>present</Text></View><View style={[styles.statusPill, { backgroundColor: palette.limeSoft }]}><View style={[styles.statusDot, { backgroundColor: '#73a553' }]} /><Text style={[styles.statusText, { color: '#50753a' }]}>On track</Text></View><ChevronRight size={16} color="#a3ada5" /></View>
                <View style={styles.schoolRow}><View style={[styles.schoolGlyph, { backgroundColor: '#f0e7eb' }]}><Text style={[styles.schoolGlyphText, { color: '#906579' }]}>M</Text></View><View style={styles.schoolInfo}><Text style={styles.schoolRowName}>Maple Grove Elementary</Text><Text style={styles.schoolRowMeta}>K–5 · 398 students</Text></View><View style={styles.schoolStat}><Text style={styles.schoolRate}>91.6%</Text><Text style={styles.schoolRateCaption}>present</Text></View><View style={[styles.statusPill, { backgroundColor: palette.orangeSoft }]}><View style={[styles.statusDot, { backgroundColor: palette.orange }]} /><Text style={[styles.statusText, { color: '#a8583d' }]}>Attention</Text></View><ChevronRight size={16} color="#a3ada5" /></View>
                <Pressable onPress={() => setActiveHub('District Operations Hub')} style={styles.panelFooter}><Text style={styles.footerLink}>View attendance detail</Text><ArrowRight size={14} color={palette.forest} /></Pressable>
              </View>

              <View style={styles.rightStack}>
                <View style={styles.panel}>
                  <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Needs your attention</Text><Text style={styles.panelSubtitle}>A few things to take care of</Text></View><View style={styles.alertCounter}><Text style={styles.alertCounterText}>3</Text></View></View>
                  <Pressable onPress={() => setActiveHub('Safety & Behavior Hub')} style={styles.attentionRow}><View style={[styles.attentionIcon, { backgroundColor: palette.orangeSoft }]}><ShieldAlert size={17} color={palette.orange} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>Safety follow-up due</Text><Text style={styles.attentionMeta}>Maple Grove · 10:30 AM</Text></View><ChevronRight size={15} color="#9ba59d" /></Pressable>
                  <Pressable onPress={() => setActiveHub('District Operations Hub')} style={styles.attentionRow}><View style={[styles.attentionIcon, { backgroundColor: palette.yellowSoft }]}><UserRoundSearch size={17} color="#ab8737" /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>2 classes need coverage</Text><Text style={styles.attentionMeta}>Westfield High · 11:15 AM</Text></View><ChevronRight size={15} color="#9ba59d" /></Pressable>
                  <Pressable onPress={() => setActiveHub('District Operations Hub')} style={[styles.attentionRow, { borderBottomWidth: 0 }]}><View style={[styles.attentionIcon, { backgroundColor: palette.blueSoft }]}><BusFront size={17} color={palette.blue} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>Dismissal change requested</Text><Text style={styles.attentionMeta}>1 student · Awaiting approval</Text></View><ChevronRight size={15} color="#9ba59d" /></Pressable>
                </View>
                <View style={styles.kioskPanel}>
                  <View style={styles.kioskTopline}><View style={styles.kioskSmallIcon}><UserRoundCheck size={16} color={palette.lime} /></View><Text style={styles.kioskEyebrow}>FRONT OFFICE</Text><View style={styles.kioskLive}><View style={styles.kioskLiveDot} /><Text style={styles.kioskLiveText}>READY</Text></View></View>
                  <Text style={styles.kioskTitle}>Kiosk terminal</Text><Text style={styles.kioskDescription}>Check in visitors, manage student pickup, and log staff arrival.</Text>
                  <Pressable onPress={() => startKioskPath('Visitor or volunteer')} style={styles.kioskButton}><Text style={styles.kioskButtonText}>Open kiosk</Text><ArrowRight size={15} color={palette.forestDeep} /></Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.activityPanel, narrow && { paddingHorizontal: 15 }]}>
              <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Recent activity</Text><Text style={styles.panelSubtitle}>Updates from across your district</Text></View><Pressable style={styles.activityFilter}><Text style={styles.activityFilterText}>All activity</Text><ChevronDown size={14} color={palette.muted} /></Pressable></View>
              <View style={styles.activityRow}><View style={[styles.activityIcon, { backgroundColor: palette.limeSoft }]}><CheckCircle2 size={16} color="#618d43" /></View><View style={{ flex: 1 }}><Text style={styles.activityTitle}><Text style={styles.activityStrong}>Attendance submitted</Text> by Avery Brooks</Text><Text style={styles.activityMeta}>Evergreen Elementary · Grade 4 · Room 12</Text></View><Text style={styles.activityTime}>8:42 AM</Text></View>
              <View style={styles.activityRow}><View style={[styles.activityIcon, { backgroundColor: palette.blueSoft }]}><HeartPulse size={16} color={palette.blue} /></View><View style={{ flex: 1 }}><Text style={styles.activityTitle}><Text style={styles.activityStrong}>Wellness visit recorded</Text> for student</Text><Text style={styles.activityMeta}>Canyon Ridge Middle · Counselor follow-up scheduled</Text></View><Text style={styles.activityTime}>8:31 AM</Text></View>
              <View style={[styles.activityRow, { borderBottomWidth: 0 }]}><View style={[styles.activityIcon, { backgroundColor: palette.yellowSoft }]}><ArrowDownRight size={16} color="#ab8737" /></View><View style={{ flex: 1 }}><Text style={styles.activityTitle}><Text style={styles.activityStrong}>Staff absence reported</Text> by Morgan Lee</Text><Text style={styles.activityMeta}>Westfield High School · Coverage requested</Text></View><Text style={styles.activityTime}>8:18 AM</Text></View>
            </View>
            <Text style={styles.demoFootnote}>District OS demo · Sample data only · No live student records or external services connected</Text>
            </>}
                </>}
          </ScrollView>
        </View>

        {searchOpen ? <View style={styles.modalScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setSearchOpen(false); setSearch(''); }} />
          <View style={[styles.searchModal, narrow && styles.searchModalNarrow]}>
            <View style={styles.modalSearchRow}><Search size={18} color={palette.muted} /><TextInput autoFocus placeholder="Search student name" placeholderTextColor="#9ca59d" value={search} onChangeText={setSearch} style={styles.modalSearchInput} /><Pressable onPress={() => { setSearchOpen(false); setSearch(''); }}><X size={18} color={palette.muted} /></Pressable></View>
            <Text style={styles.modalSectionLabel}>{search ? 'MATCHING STUDENTS' : 'RECENT STUDENTS'}</Text>
            {matchedStudents.length ? matchedStudents.map((student) => <Pressable key={student.name} style={styles.searchResult} onPress={() => { setSearchOpen(false); setSearch(''); setActiveHub('District Operations Hub'); }}>
              <View style={[styles.studentInitial, { backgroundColor: student.color }]}><Text style={styles.studentInitialText}>{student.initial}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.studentName}>{student.name}</Text><Text style={styles.studentDetails}>{student.grade} · {student.room}</Text></View>
              <Text style={[styles.studentState, student.state === 'Checked out' && { color: palette.orange }]}>{student.state}</Text><ChevronRight size={15} color="#a3ada5" />
            </Pressable>) : <Text style={styles.noResults}>No students match that name.</Text>}
            <Text style={styles.demoSearchNote}>Sample directory · Search is not connected to student records</Text>
          </View>
        </View> : null}

        {alertsOpen ? <View style={styles.modalScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAlertsOpen(false)} />
          <View style={[styles.alertModal, narrow && styles.searchModalNarrow]}>
            <View style={styles.modalTitleRow}><View><Text style={styles.panelTitle}>District alerts</Text><Text style={styles.panelSubtitle}>Items that may need your attention</Text></View><IconButton icon={X} label="Close alerts" onPress={() => setAlertsOpen(false)} /></View>
            <View style={styles.alertModalItem}><View style={[styles.attentionIcon, { backgroundColor: palette.orangeSoft }]}><ShieldAlert size={17} color={palette.orange} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>Safety follow-up due</Text><Text style={styles.attentionMeta}>Maple Grove · 10:30 AM</Text></View><ChevronRight size={15} color="#9ba59d" /></View>
            <View style={styles.alertModalItem}><View style={[styles.attentionIcon, { backgroundColor: palette.yellowSoft }]}><UserRoundSearch size={17} color="#ab8737" /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>2 classes need coverage</Text><Text style={styles.attentionMeta}>Westfield High · 11:15 AM</Text></View><ChevronRight size={15} color="#9ba59d" /></View>
            <View style={[styles.alertModalItem, { borderBottomWidth: 0 }]}><View style={[styles.attentionIcon, { backgroundColor: palette.blueSoft }]}><BusFront size={17} color={palette.blue} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>Dismissal change requested</Text><Text style={styles.attentionMeta}>1 student · Awaiting approval</Text></View><ChevronRight size={15} color="#9ba59d" /></View>
          </View>
        </View> : null}

        {kioskPath ? <View style={styles.modalScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeKiosk} />
          <View style={[styles.kioskModal, narrow && styles.kioskModalNarrow]}>
            <View style={styles.kioskModalHeader}><View style={styles.kioskModalBrand}><View style={styles.brandMarkSmall}><Home size={16} color={palette.forestDeep} /></View><View><Text style={styles.kioskModalBrandName}>Cedar Valley</Text><Text style={styles.kioskModalBrandSub}>FRONT OFFICE TERMINAL</Text></View></View><IconButton icon={X} label="Close kiosk" onPress={closeKiosk} /></View>
            <View style={styles.kioskModalBody}>
              <Label color={palette.forest}>WELCOME · {steps[kioskStep].toUpperCase()}</Label>
              <Text style={styles.kioskModalTitle}>{kioskStep >= steps.length - 1 ? 'Ready to finish?' : kioskStep === 0 ? kioskPath : 'One more step'}</Text>
              <Text style={styles.kioskModalSubtitle}>{kioskStep === 0 && kioskPath === 'Student checkout' ? 'Search for the student you are picking up. A staff member will verify approved contacts before release.'
                : kioskStep === 0 && kioskPath === 'Hourly staff' ? 'Use your district ID badge or enter the staff code to begin a timecard entry.'
                  : kioskStep === 0 && kioskPath === 'Substitute teacher' ? 'Scan the QR code on your job assignment to look up today’s placement.'
                    : kioskStep === 0 ? 'Choose a visitor type to begin a secure check-in with the front office.'
                      : 'Review the details with front office staff before confirming this demo workflow.'}</Text>
              <View style={styles.stepIndicator}>{steps.map((step, index) => <View key={step} style={styles.stepItem}><View style={[styles.stepNumber, index <= kioskStep && styles.stepNumberActive]}>{index < kioskStep ? <Check size={13} color="#fff" /> : <Text style={[styles.stepNumberText, index === kioskStep && { color: '#fff' }]}>{index + 1}</Text>}</View><Text style={[styles.stepText, index === kioskStep && styles.stepTextActive]}>{step}</Text>{index < steps.length - 1 ? <View style={[styles.stepLine, index < kioskStep && styles.stepLineActive]} /> : null}</View>)}</View>
              {kioskStep === 0 && kioskPath === 'Student checkout' ? <View style={styles.kioskForm}><Label>STUDENT NAME</Label><TextInput placeholder="Search student name" placeholderTextColor="#9ca59d" style={styles.kioskInput} /><Label>ADULT PICKING UP</Label><TextInput placeholder="Enter your full name" placeholderTextColor="#9ca59d" style={styles.kioskInput} /></View>
                : kioskStep === 0 ? <View style={styles.kioskPathList}>{(kioskPath === 'Hourly staff' ? ['Clock in', 'Start meal break', 'End meal break', 'Clock out'] : kioskPath === 'Visitor or volunteer' ? ['Visitor', 'Volunteer', 'Family member'] : kioskPath === 'District personnel' ? ['Instructional services', 'Facilities & operations', 'District administration'] : ['Teacher', 'Paraprofessional', 'Other staff']).map((choice) => <Pressable key={choice} style={styles.kioskChoice} onPress={() => setKioskStep(1)}><View style={styles.choiceRadio} /><Text style={styles.choiceText}>{choice}</Text><ChevronRight size={15} color="#9ba59d" /></Pressable>)}</View>
                  : <View style={styles.confirmationBox}><View style={styles.confirmationIcon}><CheckCircle2 size={23} color={palette.forest} /></View><Text style={styles.confirmationTitle}>Staff review required</Text><Text style={styles.confirmationText}>This demo does not verify identity, check custody records, issue badges, or submit live timecards.</Text></View>}
              <View style={styles.kioskModalFooter}><Pressable onPress={() => kioskStep === 0 ? closeKiosk() : setKioskStep(kioskStep - 1)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{kioskStep === 0 ? 'Cancel' : 'Back'}</Text></Pressable><Pressable onPress={() => kioskStep >= steps.length - 1 ? closeKiosk() : setKioskStep(kioskStep + 1)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{kioskStep >= steps.length - 1 ? 'Finish' : 'Continue'}</Text><ArrowRight size={15} color="#fff" /></Pressable></View>
            </View>
            <Text style={styles.kioskDemoNote}>DEMO MODE · Please see front office staff for assistance</Text>
          </View>
        </View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas }, appShell: { flex: 1, flexDirection: 'row', backgroundColor: palette.canvas },
  accessGate: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: palette.line, borderRadius: 6, padding: 20 },
  routePreview: { minHeight: 250, justifyContent: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line, padding: 24 },
  routePreviewTitle: { color: palette.ink, fontSize: 20, fontWeight: '700', marginTop: 9 },
  routePreviewCopy: { color: palette.muted, maxWidth: 510, fontSize: 12, lineHeight: 18, marginTop: 8 },
  accessTitle: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  accessCopy: { maxWidth: 360, color: palette.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  sidebar: { width: 244, backgroundColor: palette.forestDeep, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 12 },
  sidebarCollapsed: { width: 68, paddingHorizontal: 9 },
  brandBlock: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 11, paddingLeft: 2, marginBottom: 30 },
  brandBlockCollapsed: { justifyContent: 'center', paddingLeft: 0 },
  brandMark: { width: 35, height: 35, borderRadius: 9, backgroundColor: palette.lime, justifyContent: 'center', alignItems: 'center' },
  brandName: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0 }, brandSub: { color: '#9cad9f', fontSize: 9, fontWeight: '700', marginTop: 3, letterSpacing: 1.2 },
  sideEyebrow: { color: '#84988a', fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginLeft: 7 },
  schoolPicker: { height: 58, borderRadius: 6, borderWidth: 1, borderColor: '#3c5447', backgroundColor: '#294538', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, gap: 9 },
  schoolPickerCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  schoolSeal: { width: 32, height: 32, borderRadius: 5, backgroundColor: '#dce9d7', justifyContent: 'center', alignItems: 'center' }, schoolSealText: { color: palette.forest, fontSize: 11, fontWeight: '800' },
  schoolName: { color: '#f5f8f4', fontSize: 12, fontWeight: '600' }, schoolSub: { color: '#a8b9ad', fontSize: 10, marginTop: 3 },
  navItem: { height: 42, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, marginBottom: 3 }, navItemSelected: { backgroundColor: palette.lime },
  navItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  navText: { color: '#c2cec5', fontSize: 12, flex: 1, fontWeight: '500' }, navTextSelected: { color: palette.ink, fontWeight: '700' },
  navCount: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#e9a27f', justifyContent: 'center', alignItems: 'center' }, navCountText: { color: '#40261d', fontSize: 10, fontWeight: '700' },
  quickLink: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10 }, quickText: { color: '#c2cec5', fontSize: 11 },
  quickLinkCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  sidebarBottom: { borderTopWidth: 1, borderTopColor: '#3c5447', marginTop: 'auto', paddingTop: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sidebarBottomCollapsed: { justifyContent: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f2d4b6', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#68452f', fontSize: 10, fontWeight: '700' },
  profileName: { color: '#fff', fontSize: 11, fontWeight: '600' }, profileRole: { color: '#a8b9ad', fontSize: 9, marginTop: 3 },
  mainColumn: { flex: 1, minWidth: 0 }, topbar: { height: 62, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 27 },
  subTabHeader: { height: 47, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: palette.line, paddingLeft: 27, gap: 18 },
  subTabEyebrow: { color: '#89938b', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  subTabList: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 18 },
  subTab: { height: 31, borderRadius: 4, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  subTabSelected: { backgroundColor: '#edf3e9' },
  subTabIndex: { color: '#8b968d', fontSize: 8, fontWeight: '700' },
  subTabText: { color: '#67736a', fontSize: 9, fontWeight: '500' },
  subTabTextSelected: { color: palette.forest, fontWeight: '700' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 }, breadcrumb: { color: '#87918a', fontSize: 11 }, breadcrumbDivider: { color: '#c1c8c1' }, breadcrumbActive: { color: palette.ink, fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 }, searchTrigger: { width: 224, height: 34, borderWidth: 1, borderColor: palette.line, borderRadius: 5, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  searchTriggerNarrow: { width: 86 }, searchTriggerText: { flex: 1, color: '#8b958d', fontSize: 10 }, shortcut: { color: '#8b958d', fontSize: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  iconButton: { width: 34, height: 34, borderRadius: 5, borderWidth: 1, borderColor: palette.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', position: 'relative' }, notificationDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: palette.orange, top: 7, right: 7 },
  todayPill: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, backgroundColor: palette.canvas, borderRadius: 4 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#76a456' }, todayText: { color: '#536057', fontSize: 10, fontWeight: '500' },
  page: { paddingHorizontal: 28, paddingTop: 27, paddingBottom: 28, maxWidth: 1500, width: '100%', alignSelf: 'center' }, pageNarrow: { paddingHorizontal: 16, paddingTop: 21 },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 21, gap: 14 }, label: { fontSize: 9, fontWeight: '700', letterSpacing: 1 }, pageTitle: { color: palette.ink, fontSize: 27, lineHeight: 34, fontWeight: '700', marginTop: 5 }, pageSubtitle: { color: palette.muted, fontSize: 12, marginTop: 3 },
  primaryButton: { minHeight: 36, borderRadius: 5, backgroundColor: palette.forest, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, primaryButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 14 }, metricGridNarrow: { gap: 9 },
  metricCard: { flexGrow: 1, flexBasis: '22%', minWidth: 164, height: 144, padding: 14, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: palette.line }, metricCardFeatured: { backgroundColor: palette.forest, borderColor: palette.forest, flexBasis: '22%' },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, metricLabel: { color: '#78837a', fontSize: 9, fontWeight: '700', letterSpacing: 0.55 }, metricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }, metricValue: { color: palette.ink, fontSize: 27, fontWeight: '700', lineHeight: 31 },
  metricDelta: { height: 20, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 3, backgroundColor: '#45634e', paddingHorizontal: 5 }, metricDeltaText: { color: palette.lime, fontSize: 9, fontWeight: '700' }, metricNote: { color: '#7b857d', fontSize: 10, marginTop: 4 },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: '#45634e', marginTop: 12 }, progressValue: { height: 4, width: '95%', borderRadius: 3, backgroundColor: palette.lime }, miniBars: { height: 28, flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 5 }, miniBar: { flex: 1, borderRadius: 2 },
  staffDots: { flexDirection: 'row', gap: 5, marginTop: 14 }, staffDot: { width: 8, height: 8, borderRadius: 4 }, metricLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 }, metricLinkText: { color: palette.forest, fontSize: 10, fontWeight: '600' },
  pillarSection: { paddingTop: 18, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#e4e9e1', borderBottomWidth: 1, borderBottomColor: '#e4e9e1', marginBottom: 14 },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  pillarHeading: { color: palette.ink, fontSize: 17, fontWeight: '700', marginTop: 5 },
  pillarSubtitle: { color: palette.muted, fontSize: 10, marginTop: 4 },
  pillarCount: { borderRadius: 4, backgroundColor: '#e9efe7', paddingHorizontal: 8, paddingVertical: 6 },
  pillarCountText: { color: palette.forest, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  sharedLayer: { minHeight: 56, backgroundColor: '#eaf0e8', borderRadius: 5, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  sharedLayerMarker: { width: 27, height: 27, borderRadius: 5, backgroundColor: '#dce9d7', alignItems: 'center', justifyContent: 'center' },
  sharedLayerTitle: { color: palette.ink, fontSize: 10, fontWeight: '700' },
  sharedLayerText: { color: '#65736a', fontSize: 9, lineHeight: 13, marginTop: 3 },
  architectureTag: { color: '#66776a', fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  pillarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillarCard: { flexGrow: 1, flexBasis: '31%', minWidth: 188, minHeight: 133, borderWidth: 1, borderColor: palette.line, borderRadius: 5, backgroundColor: '#fff', padding: 12 },
  pillarCardNarrow: { flexBasis: '47%', minWidth: 136, padding: 10 },
  pillarCardSelected: { borderColor: palette.forest, backgroundColor: '#f5f8f2' },
  pillarCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillarNumber: { color: '#87938a', fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  pillarName: { color: palette.ink, fontSize: 11, fontWeight: '700', lineHeight: 15, marginTop: 11 },
  pillarSummary: { color: '#77827a', fontSize: 9, lineHeight: 14, marginTop: 5 },
  pillarHubRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 'auto', paddingTop: 9 },
  pillarHubTag: { color: palette.forest, fontSize: 7, fontWeight: '600', backgroundColor: '#edf3e9', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3 },
  pillarDetail: { borderTopWidth: 1, borderTopColor: '#e4e9e1', marginTop: 11, paddingTop: 9 },
  pillarDetailTitle: { color: palette.ink, fontSize: 10, fontWeight: '700' },
  pillarDetailFeatures: { color: '#68756c', fontSize: 9, lineHeight: 15, marginTop: 5 },
  pillarFootnote: { color: '#879189', fontSize: 8, lineHeight: 13, marginTop: 10 },
  contentGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 }, contentGridNarrow: { flexDirection: 'column' }, panel: { flex: 1, minWidth: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: palette.line, borderRadius: 6, paddingHorizontal: 16, paddingTop: 15 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11, gap: 8 }, panelTitle: { color: palette.ink, fontSize: 13, fontWeight: '700' }, panelSubtitle: { color: palette.muted, fontSize: 10, marginTop: 4 },
  dropdown: { height: 29, borderWidth: 1, borderColor: palette.line, borderRadius: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7 }, dropdownText: { color: '#59655c', fontSize: 9 },
  schoolRow: { minHeight: 59, borderTopWidth: 1, borderTopColor: '#edf0eb', flexDirection: 'row', alignItems: 'center', gap: 9 }, schoolGlyph: { width: 31, height: 31, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, schoolGlyphText: { fontSize: 12, fontWeight: '700' }, schoolInfo: { flex: 1, minWidth: 80 }, schoolRowName: { color: palette.ink, fontSize: 10, fontWeight: '600' }, schoolRowMeta: { color: '#89938b', fontSize: 9, marginTop: 4 },
  schoolStat: { alignItems: 'flex-end', minWidth: 43 }, schoolRate: { color: palette.ink, fontSize: 10, fontWeight: '700' }, schoolRateCaption: { color: '#89938b', fontSize: 8, marginTop: 3 }, statusPill: { minWidth: 63, height: 21, paddingHorizontal: 6, borderRadius: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, statusDot: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 8, fontWeight: '600' },
  panelFooter: { height: 38, borderTopWidth: 1, borderTopColor: '#edf0eb', marginTop: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }, footerLink: { color: palette.forest, fontSize: 10, fontWeight: '600' }, rightStack: { width: '35%', minWidth: 250, gap: 13 },
  attentionRow: { minHeight: 55, borderTopWidth: 1, borderTopColor: '#edf0eb', flexDirection: 'row', alignItems: 'center', gap: 9 }, attentionIcon: { width: 30, height: 30, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, attentionTitle: { color: palette.ink, fontSize: 10, fontWeight: '600' }, attentionMeta: { color: '#89938b', fontSize: 9, marginTop: 4 },
  alertCounter: { width: 21, height: 21, borderRadius: 11, backgroundColor: palette.orangeSoft, alignItems: 'center', justifyContent: 'center' }, alertCounterText: { color: '#af6042', fontSize: 10, fontWeight: '700' }, kioskPanel: { minHeight: 173, borderRadius: 6, padding: 14, backgroundColor: palette.forestDeep },
  kioskTopline: { flexDirection: 'row', alignItems: 'center', gap: 7 }, kioskSmallIcon: { width: 25, height: 25, borderRadius: 5, backgroundColor: '#355547', alignItems: 'center', justifyContent: 'center' }, kioskEyebrow: { color: '#d1ded5', fontSize: 8, fontWeight: '700', letterSpacing: 0.7, flex: 1 }, kioskLive: { height: 18, borderRadius: 3, backgroundColor: '#355547', paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }, kioskLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.lime }, kioskLiveText: { color: palette.lime, fontSize: 7, fontWeight: '700' },
  kioskTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 11 }, kioskDescription: { color: '#bdccc1', fontSize: 10, lineHeight: 15, marginTop: 5, maxWidth: 290 }, kioskButton: { height: 31, marginTop: 10, borderRadius: 4, backgroundColor: palette.lime, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, kioskButtonText: { color: palette.forestDeep, fontSize: 10, fontWeight: '700' },
  activityPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: palette.line, borderRadius: 6, paddingHorizontal: 16, paddingTop: 15, marginTop: 14 }, activityFilter: { height: 28, borderWidth: 1, borderColor: palette.line, borderRadius: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }, activityFilterText: { color: '#59655c', fontSize: 9 },
  activityRow: { minHeight: 53, borderTopWidth: 1, borderTopColor: '#edf0eb', flexDirection: 'row', alignItems: 'center', gap: 9 }, activityIcon: { width: 29, height: 29, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, activityTitle: { color: '#69756c', fontSize: 10 }, activityStrong: { color: palette.ink, fontWeight: '600' }, activityMeta: { color: '#89938b', fontSize: 9, marginTop: 4 }, activityTime: { color: '#89938b', fontSize: 9 }, demoFootnote: { color: '#969f97', fontSize: 9, textAlign: 'center', marginTop: 15 },
  mobileDrawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 265, zIndex: 10, backgroundColor: palette.forestDeep, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 }, mobileDrawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, mobileDrawerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalScrim: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: 'rgba(18, 31, 24, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 18 }, searchModal: { width: '100%', maxWidth: 540, maxHeight: '80%', borderRadius: 7, backgroundColor: '#fff', padding: 17 }, searchModalNarrow: { width: '100%', maxWidth: 450 }, modalSearchRow: { height: 42, borderWidth: 1, borderColor: '#dfe5de', borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11 }, modalSearchInput: { flex: 1, color: palette.ink, fontSize: 12, outlineStyle: 'none' } as any,
  modalSectionLabel: { color: '#89938b', fontSize: 9, fontWeight: '700', letterSpacing: 0.7, marginTop: 19, marginBottom: 7 }, searchResult: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: '#edf0eb' }, studentInitial: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, studentInitialText: { color: '#405249', fontSize: 9, fontWeight: '700' }, studentName: { color: palette.ink, fontSize: 11, fontWeight: '600' }, studentDetails: { color: '#89938b', fontSize: 9, marginTop: 3 }, studentState: { color: '#64874c', fontSize: 9, marginRight: 5 }, noResults: { color: palette.muted, fontSize: 11, paddingVertical: 20, textAlign: 'center' }, demoSearchNote: { color: '#9ca59d', fontSize: 9, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingTop: 11, marginTop: 5 },
  alertModal: { width: '100%', maxWidth: 420, borderRadius: 7, backgroundColor: '#fff', paddingHorizontal: 17, paddingTop: 17, paddingBottom: 6 }, modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, alertModalItem: { minHeight: 60, borderTopWidth: 1, borderTopColor: '#edf0eb', flexDirection: 'row', alignItems: 'center', gap: 10 },
  kioskModal: { width: '100%', maxWidth: 560, maxHeight: '94%', backgroundColor: '#fff', borderRadius: 7, overflow: 'hidden' }, kioskModalNarrow: { width: '100%', maxWidth: 460 }, kioskModalHeader: { minHeight: 58, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kioskModalBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandMarkSmall: { width: 30, height: 30, borderRadius: 6, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' }, kioskModalBrandName: { color: palette.ink, fontSize: 11, fontWeight: '700' }, kioskModalBrandSub: { color: '#89938b', fontSize: 8, fontWeight: '700', letterSpacing: 0.7, marginTop: 3 },
  kioskModalBody: { padding: 22 }, kioskModalTitle: { color: palette.ink, fontSize: 22, fontWeight: '700', marginTop: 8 }, kioskModalSubtitle: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 7, maxWidth: 440 }, stepIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 20 }, stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 }, stepNumber: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#dce3db', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, stepNumberActive: { borderColor: palette.forest, backgroundColor: palette.forest }, stepNumberText: { color: '#77827a', fontSize: 9, fontWeight: '700' }, stepText: { color: '#88928a', fontSize: 8, marginLeft: 5 }, stepTextActive: { color: palette.ink, fontWeight: '700' }, stepLine: { height: 1, flex: 1, minWidth: 7, backgroundColor: '#e5e9e3', marginHorizontal: 7 }, stepLineActive: { backgroundColor: '#83a768' },
  kioskForm: { gap: 8 }, kioskInput: { height: 39, borderWidth: 1, borderColor: '#dfe5de', borderRadius: 4, paddingHorizontal: 10, color: palette.ink, fontSize: 11, marginBottom: 5, outlineStyle: 'none' } as any, kioskPathList: { borderTopWidth: 1, borderTopColor: '#edf0eb' }, kioskChoice: { minHeight: 43, borderBottomWidth: 1, borderBottomColor: '#edf0eb', flexDirection: 'row', alignItems: 'center', gap: 9 }, choiceRadio: { width: 15, height: 15, borderRadius: 8, borderWidth: 1, borderColor: '#c7d0c8' }, choiceText: { color: palette.ink, fontSize: 11, flex: 1 },
  confirmationBox: { minHeight: 127, backgroundColor: '#f2f6ee', borderRadius: 5, padding: 15, alignItems: 'center', justifyContent: 'center' }, confirmationIcon: { width: 37, height: 37, borderRadius: 19, backgroundColor: '#e2edda', alignItems: 'center', justifyContent: 'center' }, confirmationTitle: { color: palette.ink, fontSize: 11, fontWeight: '700', marginTop: 8 }, confirmationText: { color: palette.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 5, maxWidth: 330 }, kioskModalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }, secondaryButton: { height: 35, borderWidth: 1, borderColor: palette.line, borderRadius: 5, justifyContent: 'center', paddingHorizontal: 13 }, secondaryButtonText: { color: '#536057', fontSize: 10, fontWeight: '600' }, kioskDemoNote: { backgroundColor: '#f7f8f5', color: '#89938b', fontSize: 8, textAlign: 'center', paddingVertical: 9, letterSpacing: 0.3 },
});

export default App;