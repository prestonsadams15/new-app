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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShieldAlert,
  Users,
  UserRoundCheck,
  UserRoundSearch,
  X,
} from 'lucide-react-native';
import { CommunityFeed, DirectMessaging, EmergencyBroadcast } from './CommunicationWorkflows';
import { InstructionWorkspace } from './InstructionWorkspace';
import { LessonPlannerWorkspace } from './LessonPlannerWorkspace';
import { SpecialEducationWorkspace, type SpecialEdSection } from './SpecialEducationWorkspace';
import { ClassroomSeatingWorkspace } from './ClassroomSeatingWorkspace';
import { ReunificationWorkspace, VisitorScreeningWorkspace } from './SafetyOperationsWorkspace';
import { UnifiedGradebookWorkspace, type ViewId as GradebookViewId } from './UnifiedGradebookWorkspace';
import { StudentInformationWorkspace, type SisTab } from './StudentInformationWorkspace';
import { BehaviorRewardsWorkspace, type BehaviorTab } from './BehaviorRewardsWorkspace';
import { EmergencyCommandWorkspace } from './EmergencyCommandWorkspace';
import { ClassroomKioskWorkspace, type KioskViewTab } from './ClassroomKioskWorkspace';
import { K12SchedulingEngine, type SchedulingTier } from './K12SchedulingEngine';
import { PrivacyComplianceWorkspace } from './PrivacyComplianceWorkspace';
import { supabase } from './lib/supabase';
import { setDocumentTitle, sameRoute, useHashRoute, type Route } from './lib/routing';
import {
  OVERVIEW_TAB_ID,
  hubFor,
  hubs,
  sectionsForHub,
  visibleSectionsForRoles,
  visibleTabsForRoles,
  type PrimarySection,
  type PrimarySectionId,
} from './Layout';
import { SubNavHeader } from './SubNavHeader';
import { HubBreakdown, ModuleBlueprint, SectionOverview } from './SiteMapPages';

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

/*
 * Site page → internal workspace view. Several workspaces already had their own tab bars;
 * each of those views is now a page with its own URL, and the reverse maps keep the URL
 * in sync if a workspace switches views itself.
 */
const behaviorViews: Record<string, BehaviorTab> = { pbis: 'Points', categories: 'Categories', store: 'Class store', auction: 'Live auction' };
const specialEdViews: Record<string, SpecialEdSection> = { iep: 'IEP & timeline', goals: 'SMART goals', accommodations: 'Accommodations', services: 'Service log', consent: 'Parent consent' };
const schedulingViews: Record<string, SchedulingTier> = { elementary: 'elementary', middle: 'middle', high: 'high' };
const kioskRoutes: Record<KioskViewTab, Route> = {
  'Door kiosk': { sectionId: 'students', tabId: 'attendance' },
  'Cafeteria prep': { sectionId: 'students', tabId: 'lunch-count' },
  'Office attendance': { sectionId: 'safety', tabId: 'kiosk' },
};
const sisRoutes: Record<SisTab, Route> = {
  Directory: { sectionId: 'students', tabId: 'directory' },
  Registration: { sectionId: 'students', tabId: 'registration' },
  Scheduling: { sectionId: 'scheduling', tabId: 'elementary' },
  Compliance: { sectionId: 'compliance', tabId: 'state-reporting' },
  'Privacy & records': { sectionId: 'compliance', tabId: 'privacy' },
  'Door kiosk': { sectionId: 'students', tabId: 'attendance' },
};
const reverse = <T extends string>(map: Record<string, T>, value: T) => Object.keys(map).find((key) => map[key] === value) ?? null;

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

function App() {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const narrow = width < 560;
  const isDemoMode = !supabase;
  const [route, navigate] = useHashRoute();
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

  // ── Route resolution: #/ → home, #/<section> → overview, #/<section>/<page> → page ──
  const visibleSections = membershipsLoaded ? visibleSectionsForRoles(memberRoles) : [];
  const tabsFor = (section: PrimarySection) => visibleTabsForRoles(section, memberRoles);
  const activeSection = route.sectionId ? visibleSections.find((section) => section.id === route.sectionId) : undefined;
  const isHome = !activeSection;
  const visibleSubTabs = activeSection ? tabsFor(activeSection) : [];
  const activeSubTab = visibleSubTabs.find((tab) => tab.id === route.tabId);
  const activeTabId = activeSubTab?.id ?? OVERVIEW_TAB_ID;
  const activeHub = activeSection ? hubFor(activeSection) : null;

  useEffect(() => {
    if (!membershipsLoaded) return;
    // Unknown or unauthorized routes fall back to the nearest page the user can see.
    const normalized: Route = activeSection ? { sectionId: activeSection.id, tabId: activeSubTab?.id ?? null } : { sectionId: null, tabId: null };
    if (!sameRoute(normalized, route)) navigate(normalized, { replace: true });
  }, [membershipsLoaded, memberRoles, route.sectionId, route.tabId]);

  useEffect(() => {
    const parts = [activeSubTab?.label, activeSection?.title, 'District OS'].filter(Boolean);
    setDocumentTitle(isHome ? 'District OS · Cedar Valley USD' : parts.join(' · '));
  }, [isHome, activeSection?.id, activeSubTab?.id]);

  const go = (next: Route) => { navigate(next); setMobileNavOpen(false); };
  const goHome = () => go({ sectionId: null, tabId: null });
  const goSection = (sectionId: PrimarySectionId) => go({ sectionId, tabId: null });
  const goTab = (tabId: string) => activeSection && go({ sectionId: activeSection.id, tabId: tabId === OVERVIEW_TAB_ID ? null : tabId });

  const startKioskPath = (path: KioskPath) => { setKioskPath(path); setKioskStep(0); };
  const closeKiosk = () => { setKioskPath(null); setKioskStep(0); };
  const steps = kioskPath === 'Student checkout' ? ['Find student', 'Verify guardian', 'Confirm pickup']
    : kioskPath === 'Hourly staff' ? ['Scan staff badge', 'Choose time action', 'Confirm timecard']
      : kioskPath === 'Substitute teacher' ? ['Scan job QR', 'Confirm assignment', 'Print day pass']
        : ['Identify yourself', 'Choose visit details', 'Finish check-in'];

  const renderPage = () => {
    if (!activeSection) return null;
    if (!activeSubTab) return <SectionOverview section={activeSection} tabs={visibleSubTabs} narrow={narrow} onOpen={goTab} />;
    if (activeSubTab.status === 'planned') {
      return <ModuleBlueprint section={activeSection} tab={activeSubTab} siblings={visibleSubTabs} narrow={narrow} onBack={() => goTab(OVERVIEW_TAB_ID)} onOpen={goTab} />;
    }
    const sectionId = activeSection.id;
    const tabId = activeSubTab.id;
    const key = `${sectionId}/${tabId}`;
    switch (sectionId) {
      case 'instruction':
        if (tabId === 'stream') return <InstructionWorkspace key={key} narrow={narrow} />;
        if (tabId === 'planbook') return <LessonPlannerWorkspace key={key} narrow={narrow} />;
        if (tabId === 'seating') return <ClassroomSeatingWorkspace key={key} narrow={narrow} />;
        break;
      case 'grades': {
        const role = memberRoles.includes('student') ? 'student' : memberRoles.includes('parent') ? 'parent' : 'teacher';
        const initialView: GradebookViewId = role === 'student' ? 'canvas' : tabId === 'portfolios' || role === 'parent' ? 'queue' : 'gradebook';
        return <UnifiedGradebookWorkspace key={key} narrow={narrow} role={role} initialView={initialView} />;
      }
      case 'special-ed':
        if (specialEdViews[tabId]) return <SpecialEducationWorkspace key={key} narrow={narrow} tab={specialEdViews[tabId]} onTabChange={(view) => go({ sectionId, tabId: reverse(specialEdViews, view) })} />;
        break;
      case 'communication':
        if (tabId === 'feed') return <CommunityFeed key={key} narrow={narrow} />;
        if (tabId === 'messages' || tabId === 'masked-caller') return <DirectMessaging key={key} narrow={narrow} />;
        if (tabId === 'broadcasts') return <EmergencyBroadcast key={key} narrow={narrow} />;
        break;
      case 'safety':
        if (tabId === 'kiosk') return <ClassroomKioskWorkspace key={key} narrow={narrow} tab="Office attendance" onTabChange={(view) => go(kioskRoutes[view])} />;
        if (tabId === 'crisis' || tabId === 'matrix') return <EmergencyCommandWorkspace key={key} narrow={narrow} />;
        if (tabId === 'visitors') return <VisitorScreeningWorkspace key={key} narrow={narrow} />;
        if (tabId === 'reunification') return <ReunificationWorkspace key={key} narrow={narrow} />;
        break;
      case 'behavior':
        if (behaviorViews[tabId]) return <BehaviorRewardsWorkspace key={key} narrow={narrow} tab={behaviorViews[tabId]} onTabChange={(view) => go({ sectionId, tabId: reverse(behaviorViews, view) })} />;
        break;
      case 'students':
        if (tabId === 'directory') return <StudentInformationWorkspace key={key} narrow={narrow} tab="Directory" onTabChange={(view) => go(sisRoutes[view])} />;
        if (tabId === 'registration') return <StudentInformationWorkspace key={key} narrow={narrow} tab="Registration" onTabChange={(view) => go(sisRoutes[view])} />;
        if (tabId === 'attendance') return <ClassroomKioskWorkspace key={key} narrow={narrow} tab="Door kiosk" onTabChange={(view) => go(kioskRoutes[view])} />;
        if (tabId === 'lunch-count') return <ClassroomKioskWorkspace key={key} narrow={narrow} tab="Cafeteria prep" onTabChange={(view) => go(kioskRoutes[view])} />;
        break;
      case 'scheduling':
        if (schedulingViews[tabId]) return <K12SchedulingEngine key={key} narrow={narrow} tier={schedulingViews[tabId]} />;
        break;
      case 'compliance':
        if (tabId === 'privacy') return <PrivacyComplianceWorkspace key={key} narrow={narrow} />;
        if (tabId === 'state-reporting') return <StudentInformationWorkspace key={key} narrow={narrow} tab="Compliance" onTabChange={(view) => go(sisRoutes[view])} />;
        break;
      default:
        break;
    }
    // A page marked `demo` without a workspace mapping is a site-map bug; show its blueprint.
    return <ModuleBlueprint section={activeSection} tab={activeSubTab} siblings={visibleSubTabs} narrow={narrow} onBack={() => goTab(OVERVIEW_TAB_ID)} onOpen={goTab} />;
  };

  const renderSidebar = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={navStyles.sidebarScroll}>
      <View style={[styles.brandBlock, collapsedSidebar && styles.brandBlockCollapsed]}>
        <View style={styles.brandMark}><Home size={19} color={palette.forestDeep} strokeWidth={2.2} /></View>
        {!collapsedSidebar ? <View><Text style={styles.brandName}>district OS</Text><Text style={styles.brandSub}>CEDAR VALLEY</Text></View> : null}
      </View>
      <View style={[styles.schoolPicker, collapsedSidebar && styles.schoolPickerCollapsed]}>
        <View style={styles.schoolSeal}><Text style={styles.schoolSealText}>CV</Text></View>
        {!collapsedSidebar ? <View style={{ flex: 1 }}><Text style={styles.schoolName}>Cedar Valley USD</Text><Text style={styles.schoolSub}>District view</Text></View> : null}
        {!collapsedSidebar ? <ChevronDown size={15} color="#a8b9ad" /> : null}
      </View>

      <Pressable accessibilityRole="link" accessibilityState={{ selected: isHome }} accessibilityLabel="District home" onPress={goHome} style={[navStyles.navItem, { marginTop: 18 }, collapsedSidebar && styles.navItemCollapsed, isHome && styles.navItemSelected]}>
        <LayoutDashboard size={17} color={isHome ? palette.ink : '#b5c4ba'} strokeWidth={1.8} />
        {!collapsedSidebar ? <Text style={[styles.navText, isHome && styles.navTextSelected]}>Home</Text> : null}
      </Pressable>

      {hubs.map((hub) => {
        const hubSections = sectionsForHub(hub.id, visibleSections);
        if (!hubSections.length) return null;
        return <View key={hub.id} style={navStyles.hubGroup}>
          {!collapsedSidebar ? <Text style={navStyles.hubLabel}>{hub.shortTitle.toUpperCase()}</Text> : <View style={navStyles.hubRule} />}
          {hubSections.map(({ id, title: sectionTitle, icon: Icon }) => {
            const selected = activeSection?.id === id;
            return (
              <Pressable key={id} accessibilityRole="link" accessibilityState={{ selected }} accessibilityLabel={sectionTitle} onPress={() => goSection(id)} style={[navStyles.navItem, collapsedSidebar && styles.navItemCollapsed, selected && styles.navItemSelected]}>
                <Icon size={17} color={selected ? palette.ink : '#b5c4ba'} strokeWidth={1.8} />
                {!collapsedSidebar ? <Text numberOfLines={1} style={[styles.navText, selected && styles.navTextSelected]}>{sectionTitle}</Text> : null}
              </Pressable>
            );
          })}
        </View>;
      })}

      {!collapsedSidebar ? <Text style={navStyles.hubLabel}>QUICK ACCESS</Text> : <View style={navStyles.hubRule} />}
      <Pressable accessibilityRole="button" accessibilityLabel="Front office kiosk" onPress={() => startKioskPath('Visitor or volunteer')} style={[styles.quickLink, collapsedSidebar && styles.quickLinkCollapsed]}><UserRoundCheck size={17} color="#b5c4ba" />{!collapsedSidebar ? <Text style={styles.quickText}>Front office kiosk</Text> : null}</Pressable>
      <View style={[styles.sidebarBottom, collapsedSidebar && styles.sidebarBottomCollapsed]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>JD</Text></View>
        {!collapsedSidebar ? <View style={{ flex: 1 }}><Text style={styles.profileName}>Jordan Davis</Text><Text style={styles.profileRole}>District administrator</Text></View> : null}
        {!collapsedSidebar ? <ChevronDown size={15} color="#a8b9ad" /> : null}
      </View>
    </ScrollView>
  );

  const crumbs: { label: string; onPress?: () => void }[] = [{ label: 'Cedar Valley USD', onPress: isHome ? undefined : goHome }];
  if (activeSection && activeHub) {
    crumbs.push({ label: activeHub.shortTitle });
    crumbs.push({ label: activeSection.title, onPress: activeSubTab ? () => goSection(activeSection.id) : undefined });
    if (activeSubTab) crumbs.push({ label: activeSubTab.label });
  } else {
    crumbs.push({ label: 'Home' });
  }
  const shownCrumbs = narrow ? crumbs.slice(-2) : crumbs;

  const pageHeader = isHome
    ? { eyebrow: 'MONDAY, OCTOBER 19, 2026', title: 'District overview', subtitle: 'Today across Cedar Valley, and every part of District OS.' }
    : activeSubTab && activeSection && activeHub
      ? { eyebrow: `${activeHub.shortTitle.toUpperCase()} · ${activeSection.title.toUpperCase()}`, title: activeSubTab.label, subtitle: activeSubTab.summary }
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        {!compact ? <View style={[styles.sidebar, collapsedSidebar && styles.sidebarCollapsed]}>{renderSidebar()}</View> : null}
        {compact && mobileNavOpen ? <View style={styles.mobileDrawer}>
          <View style={styles.mobileDrawerHeader}><Text style={styles.mobileDrawerTitle}>Navigation</Text><IconButton icon={X} label="Close navigation" onPress={() => setMobileNavOpen(false)} /></View>
          {renderSidebar()}
        </View> : null}
        <View style={styles.mainColumn}>
          <View style={styles.topbar}>
            <View style={[styles.topLeft, { flex: 1, minWidth: 0 }]}>
              {compact ? <IconButton icon={Menu} label="Open navigation" onPress={() => setMobileNavOpen(!mobileNavOpen)} /> : null}
              {!compact ? <IconButton icon={sidebarCollapsed ? PanelLeftOpen : PanelLeftClose} label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onPress={() => setSidebarCollapsed(!sidebarCollapsed)} /> : null}
              <View style={navStyles.crumbs}>
                {shownCrumbs.map((crumb, index) => {
                  const last = index === shownCrumbs.length - 1;
                  return <View key={`${crumb.label}-${index}`} style={navStyles.crumbItem}>
                    {index > 0 ? <ChevronRight size={12} color="#c1c8c1" /> : null}
                    {crumb.onPress ? <Pressable accessibilityRole="link" onPress={crumb.onPress}><Text numberOfLines={1} style={[styles.breadcrumb, navStyles.crumbLink]}>{crumb.label}</Text></Pressable>
                      : <Text numberOfLines={1} style={[styles.breadcrumb, last && styles.breadcrumbActive]}>{crumb.label}</Text>}
                  </View>;
                })}
              </View>
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

          {activeSection ? <SubNavHeader sectionTitle={activeSection.title} tabs={visibleSubTabs} activeTabId={activeTabId} onSelect={goTab} /> : null}

          <ScrollView contentContainerStyle={[styles.page, narrow && styles.pageNarrow]}>
            {!membershipsLoaded ? <View style={styles.accessGate}><Clock3 size={20} color={palette.muted} /><Text style={styles.accessTitle}>Checking district access…</Text></View>
              : !isDemoMode && memberRoles.length === 0 ? <View style={styles.accessGate}><ShieldAlert size={22} color={palette.orange} /><Text style={styles.accessTitle}>No active district role</Text><Text style={styles.accessCopy}>Sign in with a district account that has an active SIS membership to continue.</Text></View>
                : !isDemoMode ? <View style={styles.accessGate}><ShieldAlert size={22} color={palette.forest} /><Text style={styles.accessTitle}>Role verified · protected data adapters pending</Text><Text style={styles.accessCopy}>Your SIS role controls visible hubs. Sample student records stay hidden until each workspace reads through its RLS-protected repository.</Text></View>
                  : <>
            {pageHeader ? <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}><Label color={palette.forest}>{pageHeader.eyebrow}</Label><Text style={styles.pageTitle}>{pageHeader.title}</Text><Text style={styles.pageSubtitle}>{pageHeader.subtitle}</Text></View>
              {isHome ? <Pressable style={styles.primaryButton} onPress={() => startKioskPath('Visitor or volunteer')}><Plus size={17} color={palette.paper} /><Text style={styles.primaryButtonText}>Front office</Text></Pressable> : null}
            </View> : null}

            {!isHome ? renderPage() : <>
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
                <View style={styles.miniBars}>{[26, 37, 31, 49, 43, 56, 45, 66, 52, 72, 62, 86].map((height, i) => <View key={i} style={[styles.miniBar, { height: height * 0.32, backgroundColor: i === 11 ? palette.forest : '#dce7df' }]} />)}</View>
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
                <Pressable onPress={() => goSection('safety')} style={styles.metricLink}><Text style={styles.metricLinkText}>Open Safety</Text><ArrowRight size={13} color={palette.forest} /></Pressable>
              </View>
            </View>

            <HubBreakdown sections={visibleSections} tabsFor={tabsFor} narrow={narrow} onOpenSection={goSection} />

            <View style={[styles.contentGrid, narrow && styles.contentGridNarrow]}>
              <View style={styles.panel}>
                <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>School pulse</Text><Text style={styles.panelSubtitle}>Live snapshot across your district</Text></View><Pressable style={styles.dropdown}><Text style={styles.dropdownText}>All schools</Text><ChevronDown size={14} color={palette.muted} /></Pressable></View>
                {[
                  { name: 'Evergreen Elementary', meta: 'K–5 · 682 students', rate: '96.8%', status: 'On track', glyph: 'E', bg: '#e5f0df', fg: '#4e7044', pill: palette.limeSoft, dot: '#73a553', text: '#50753a' },
                  { name: 'Canyon Ridge Middle', meta: '6–8 · 514 students', rate: '93.2%', status: 'Watch', glyph: 'C', bg: '#f7ebd9', fg: '#a47134', pill: palette.yellowSoft, dot: palette.yellow, text: '#96742b' },
                  { name: 'Westfield High School', meta: '9–12 · 1,204 students', rate: '94.4%', status: 'On track', glyph: 'W', bg: '#e1ebf2', fg: '#55778e', pill: palette.limeSoft, dot: '#73a553', text: '#50753a' },
                  { name: 'Maple Grove Elementary', meta: 'K–5 · 398 students', rate: '91.6%', status: 'Attention', glyph: 'M', bg: '#f0e7eb', fg: '#906579', pill: palette.orangeSoft, dot: palette.orange, text: '#a8583d' },
                ].map((school) => <Pressable key={school.name} onPress={() => go({ sectionId: 'students', tabId: 'attendance' })} style={styles.schoolRow}>
                  <View style={[styles.schoolGlyph, { backgroundColor: school.bg }]}><Text style={[styles.schoolGlyphText, { color: school.fg }]}>{school.glyph}</Text></View>
                  <View style={styles.schoolInfo}><Text style={styles.schoolRowName}>{school.name}</Text><Text style={styles.schoolRowMeta}>{school.meta}</Text></View>
                  <View style={styles.schoolStat}><Text style={styles.schoolRate}>{school.rate}</Text><Text style={styles.schoolRateCaption}>present</Text></View>
                  {!narrow ? <View style={[styles.statusPill, { backgroundColor: school.pill }]}><View style={[styles.statusDot, { backgroundColor: school.dot }]} /><Text style={[styles.statusText, { color: school.text }]}>{school.status}</Text></View> : null}
                  <ChevronRight size={16} color="#a3ada5" />
                </Pressable>)}
                <Pressable onPress={() => go({ sectionId: 'students', tabId: 'attendance' })} style={styles.panelFooter}><Text style={styles.footerLink}>View attendance detail</Text><ArrowRight size={14} color={palette.forest} /></Pressable>
              </View>

              <View style={[styles.rightStack, narrow && { width: '100%' }]}>
                <View style={styles.panel}>
                  <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Needs your attention</Text><Text style={styles.panelSubtitle}>A few things to take care of</Text></View><View style={styles.alertCounter}><Text style={styles.alertCounterText}>3</Text></View></View>
                  <Pressable onPress={() => go({ sectionId: 'safety', tabId: 'incidents' })} style={styles.attentionRow}><View style={[styles.attentionIcon, { backgroundColor: palette.orangeSoft }]}><ShieldAlert size={17} color={palette.orange} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>Safety follow-up due</Text><Text style={styles.attentionMeta}>Maple Grove · 10:30 AM</Text></View><ChevronRight size={15} color="#9ba59d" /></Pressable>
                  <Pressable onPress={() => go({ sectionId: 'hr', tabId: 'sub-dispatch' })} style={styles.attentionRow}><View style={[styles.attentionIcon, { backgroundColor: palette.yellowSoft }]}><UserRoundSearch size={17} color="#ab8737" /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>2 classes need coverage</Text><Text style={styles.attentionMeta}>Westfield High · 11:15 AM</Text></View><ChevronRight size={15} color="#9ba59d" /></Pressable>
                  <Pressable onPress={() => go({ sectionId: 'transportation', tabId: 'dismissal' })} style={[styles.attentionRow, { borderBottomWidth: 0 }]}><View style={[styles.attentionIcon, { backgroundColor: palette.blueSoft }]}><BusFront size={17} color={palette.blue} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>Dismissal change requested</Text><Text style={styles.attentionMeta}>1 student · Awaiting approval</Text></View><ChevronRight size={15} color="#9ba59d" /></Pressable>
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
            </>}
            <Text style={styles.demoFootnote}>DEMO MODE · Sample data only · No live student or staff records or external services connected</Text>
                </>}
          </ScrollView>
        </View>

        {searchOpen ? <View style={styles.modalScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setSearchOpen(false); setSearch(''); }} />
          <View style={[styles.searchModal, narrow && styles.searchModalNarrow]}>
            <View style={styles.modalSearchRow}><Search size={18} color={palette.muted} /><TextInput autoFocus placeholder="Search student name" placeholderTextColor="#9ca59d" value={search} onChangeText={setSearch} style={styles.modalSearchInput} /><Pressable onPress={() => { setSearchOpen(false); setSearch(''); }}><X size={18} color={palette.muted} /></Pressable></View>
            <Text style={styles.modalSectionLabel}>{search ? 'MATCHING STUDENTS' : 'RECENT STUDENTS'}</Text>
            {matchedStudents.length ? matchedStudents.map((student) => <Pressable key={student.name} style={styles.searchResult} onPress={() => { setSearchOpen(false); setSearch(''); go({ sectionId: 'students', tabId: 'directory' }); }}>
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
            {[
              { title: 'Safety follow-up due', meta: 'Maple Grove · 10:30 AM', icon: ShieldAlert, bg: palette.orangeSoft, fg: palette.orange, route: { sectionId: 'safety', tabId: 'incidents' } },
              { title: '2 classes need coverage', meta: 'Westfield High · 11:15 AM', icon: UserRoundSearch, bg: palette.yellowSoft, fg: '#ab8737', route: { sectionId: 'hr', tabId: 'sub-dispatch' } },
              { title: 'Dismissal change requested', meta: '1 student · Awaiting approval', icon: BusFront, bg: palette.blueSoft, fg: palette.blue, route: { sectionId: 'transportation', tabId: 'dismissal' } },
            ].map(({ title: alertTitle, meta, icon: AlertIcon, bg, fg, route: alertRoute }, index, list) => <Pressable key={alertTitle} onPress={() => { setAlertsOpen(false); go(alertRoute); }} style={[styles.alertModalItem, index === list.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.attentionIcon, { backgroundColor: bg }]}><AlertIcon size={17} color={fg} /></View>
              <View style={{ flex: 1 }}><Text style={styles.attentionTitle}>{alertTitle}</Text><Text style={styles.attentionMeta}>{meta}</Text></View><ChevronRight size={15} color="#9ba59d" />
            </Pressable>)}
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

const navStyles = StyleSheet.create({
  sidebarScroll: { flexGrow: 1, paddingBottom: 4 },
  navItem: { height: 36, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, marginBottom: 2 },
  hubGroup: { marginTop: 16 },
  hubLabel: { color: '#84988a', fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 7, marginLeft: 7, marginTop: 4 },
  hubRule: { height: 1, backgroundColor: '#3c5447', marginVertical: 9, marginHorizontal: 6 },
  crumbs: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' },
  crumbItem: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 5, flexShrink: 1, minWidth: 0 },
  crumbLink: { color: '#5d6b62', textDecorationLine: 'underline', textDecorationColor: '#cfd6cf' } as any,
});

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