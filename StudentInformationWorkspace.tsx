import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  BusFront,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  LockKeyhole,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Upload,
  Users,
} from 'lucide-react-native';
import { ClassroomKioskWorkspace } from './ClassroomKioskWorkspace';
import { K12SchedulingEngine } from './K12SchedulingEngine';
import { PrivacyComplianceWorkspace } from './PrivacyComplianceWorkspace';

type Tab = 'Directory' | 'Registration' | 'Scheduling' | 'Compliance' | 'Privacy & records' | 'Door kiosk';
export type SisTab = Tab;
type RoleView = 'Teacher' | 'Office';
type SisStudent = {
  id: string;
  name: string;
  grade: string;
  school: string;
  room: string;
  status: string;
  initials: string;
  dob: string;
  guardian: string;
  guardianContact: string;
  custodyAlert: boolean;
  custodyNote: string;
  medicalAlert: string;
  designations: string[];
};
type CourseSection = { id: string; course: string; teacher: string; period: number; room: string; support?: string };

const colors = { ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f', limeSoft: '#eef6e3', blueSoft: '#eaf1f6', orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df' };

const directory: SisStudent[] = [
  { id: '10042', name: 'Maya Thompson', grade: '4', school: 'Evergreen Elementary', room: '12', status: 'Enrolled', initials: 'MT', dob: 'Apr 12, 2016', guardian: 'Pat Thompson', guardianContact: '(555) 014-8821', custodyAlert: true, custodyNote: 'Court order on file · Office verification required before release', medicalAlert: 'Dairy allergy · emergency plan on file', designations: ['504 plan', 'English learner'] },
  { id: '10087', name: 'Ethan Chen', grade: '2', school: 'Evergreen Elementary', room: '08', status: 'Enrolled', initials: 'EC', dob: 'Feb 08, 2018', guardian: 'Morgan Chen', guardianContact: '(555) 014-3362', custodyAlert: false, custodyNote: '', medicalAlert: '', designations: [] },
  { id: '10116', name: 'Sofia Martinez', grade: '7', school: 'Canyon Ridge Middle', room: '18', status: 'Enrolled', initials: 'SM', dob: 'Jul 18, 2013', guardian: 'Elena Martinez', guardianContact: '(555) 014-5177', custodyAlert: false, custodyNote: '', medicalAlert: '', designations: ['IEP'] },
  { id: '10204', name: 'Noah Williams', grade: '6', school: 'Westfield Middle', room: '21', status: 'Enrolled', initials: 'NW', dob: 'Sep 21, 2014', guardian: 'Andre Williams', guardianContact: '(555) 014-7800', custodyAlert: false, custodyNote: '', medicalAlert: '', designations: ['McKinney-Vento'] },
];

const sections: CourseSection[] = [
  { id: 'ela-1', course: 'English Language Arts', teacher: 'Avery Brooks', period: 1, room: '12' },
  { id: 'math-2', course: 'Mathematics', teacher: 'Avery Brooks', period: 2, room: '12' },
  { id: 'science-3', course: 'Science', teacher: 'Jordan Davis', period: 3, room: 'Lab 2', support: 'Renee Cole · SPED push-in' },
  { id: 'art-4', course: 'Visual Arts', teacher: 'Morgan Lee', period: 4, room: 'Art 1' },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function StudentInformationWorkspace({ narrow, tab: routeTab, onTabChange }: { narrow: boolean; tab?: SisTab; onTabChange?: (tab: SisTab) => void }) {
  const [localTab, setLocalTab] = useState<Tab>(routeTab ?? 'Directory');
  const tab = routeTab ?? localTab;
  const setTab = (next: Tab) => { setLocalTab(next); onTabChange?.(next); };
  const [role, setRole] = useState<RoleView>('Office');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('10042');
  const [notice, setNotice] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('All schools');
  const [scheduleStudent, setScheduleStudent] = useState(directory[0]);
  const [schedule, setSchedule] = useState<CourseSection[]>([]);
  const [reportPrepared, setReportPrepared] = useState(false);
  const [rosterPrepared, setRosterPrepared] = useState(false);

  const filteredStudents = useMemo(() => directory.filter((student) => student.name.toLowerCase().includes(search.toLowerCase()) || student.id.includes(search)), [search]);
  const selectedStudent = directory.find((student) => student.id === selectedId) ?? directory[0];
  const enrollmentApplicants = [
    { name: 'Liam Peterson', grade: 'Kindergarten', school: 'Evergreen Elementary', complete: 3, total: 4, status: 'Needs proof of residency' },
    { name: 'Amira Hassan', grade: 'Grade 6', school: 'Canyon Ridge Middle', complete: 4, total: 4, status: 'Ready for review' },
    { name: 'Oliver Reed', grade: 'Grade 9', school: 'Westfield High', complete: 2, total: 4, status: 'Needs immunization record' },
  ];

  const enrollSection = (section: CourseSection) => {
    if (schedule.some((item) => item.period === section.period)) {
      setNotice(`Schedule conflict: ${section.course} overlaps with an existing period ${section.period} course.`);
      return;
    }
    setSchedule((current) => [...current, section].sort((left, right) => left.period - right.period));
    setNotice(`${section.course} added to ${scheduleStudent.name}'s local schedule preview.`);
  };

  const generateSchedule = () => {
    const uniquePeriods = new Set<number>();
    const nextSchedule = sections.filter((section) => {
      if (uniquePeriods.has(section.period)) return false;
      uniquePeriods.add(section.period);
      return true;
    });
    setSchedule(nextSchedule);
    setNotice(`Conflict check complete. ${nextSchedule.length} courses fit the sample schedule.`);
  };

  const tabs: Tab[] = ['Directory', 'Registration', 'Scheduling', 'Compliance', 'Privacy & records', 'Door kiosk'];

  return (
    <View style={styles.workspace}>
      <View style={styles.workspaceHeader}><View style={styles.headerIcon}><GraduationCap size={17} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.workspaceTitle}>Student information system</Text><Text style={styles.workspaceSubtitle}>Evergreen Elementary · Operations & transportation</Text></View><View style={styles.sampleTag}><Text style={styles.sampleTagText}>SAMPLE RECORDS</Text></View></View>
      {routeTab ? null : <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => { setTab(item); setNotice(''); }} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}</ScrollView></>}
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      {tab === 'Directory' ? <View style={[styles.directoryLayout, narrow && styles.directoryLayoutNarrow]}>
        <View style={styles.directoryRail}>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Student directory</Text><Text style={styles.panelSubtitle}>{filteredStudents.length} matching records</Text></View><Users size={15} color={colors.forest} /></View>
            <View style={styles.searchBox}><Search size={13} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Name or student ID" style={styles.searchInput} /></View>
            {filteredStudents.map((student) => <Pressable key={student.id} onPress={() => setSelectedId(student.id)} style={[styles.studentRow, selectedId === student.id && styles.studentRowSelected]}><View style={styles.studentAvatar}><Text style={styles.studentInitials}>{student.initials}</Text></View><View style={{ flex: 1 }}><Text style={styles.studentName}>{student.name}</Text><Text style={styles.studentMeta}>ID {student.id} · Grade {student.grade}</Text></View><ChevronRight size={13} color={colors.muted} /></Pressable>)}
          </View>
          <Text style={styles.disclaimer}>Sample directory only. Search is not connected to SIS records.</Text>
        </View>
        <View style={styles.profileColumn}>
          <View style={styles.panel}>
            <View style={styles.profileHeader}><View style={styles.profileAvatar}><Text style={styles.profileInitials}>{selectedStudent.initials}</Text></View><View style={{ flex: 1 }}><Eyebrow>STUDENT PROFILE · {selectedStudent.status.toUpperCase()}</Eyebrow><Text style={styles.profileName}>{selectedStudent.name}</Text><Text style={styles.profileMeta}>ID {selectedStudent.id} · Grade {selectedStudent.grade} · {selectedStudent.school}</Text></View><View style={styles.roleToggle}>{(['Teacher', 'Office'] as RoleView[]).map((item) => <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleButton, role === item && styles.roleButtonSelected]}><Text style={[styles.roleButtonText, role === item && styles.roleButtonTextSelected]}>{item}</Text></Pressable>)}</View></View>
            <View style={styles.profileFacts}><View style={styles.fact}><Text style={styles.factLabel}>HOMEROOM</Text><Text style={styles.factValue}>Room {selectedStudent.room}</Text></View><View style={styles.fact}><Text style={styles.factLabel}>DATE OF BIRTH</Text><Text style={styles.factValue}>{role === 'Office' ? selectedStudent.dob : 'Restricted'}</Text></View><View style={styles.fact}><Text style={styles.factLabel}>ENROLLMENT</Text><Text style={styles.factValue}>{selectedStudent.status}</Text></View></View>
            <View style={styles.profileSection}><View style={styles.sectionHeading}><Users size={13} color={colors.forest} /><Text style={styles.sectionTitle}>Household & guardian</Text></View><Text style={styles.guardianName}>{selectedStudent.guardian}</Text><Text style={styles.guardianContact}>{role === 'Office' ? selectedStudent.guardianContact : 'Contact details restricted by role'}</Text><Text style={styles.guardianMeta}>Primary contact · Pickup authorization on file</Text></View>
            <View style={styles.profileSection}><View style={styles.sectionHeading}><ShieldAlert size={13} color={colors.orange} /><Text style={styles.sectionTitle}>Safety & restricted records</Text><LockKeyhole size={12} color={colors.muted} /></View>
              {role === 'Office' ? <><View style={styles.sensitiveRow}><Text style={styles.sensitiveLabel}>Custody alert</Text><Text style={[styles.sensitiveValue, selectedStudent.custodyAlert && styles.alertValue]}>{selectedStudent.custodyAlert ? 'RESTRICTED PICKUP · VERIFY WITH OFFICE' : 'No alert on sample record'}</Text></View>{selectedStudent.custodyNote ? <Text style={styles.restrictedNote}>{selectedStudent.custodyNote}</Text> : null}<View style={styles.sensitiveRow}><Text style={styles.sensitiveLabel}>Medical alert</Text><Text style={styles.sensitiveValue}>{selectedStudent.medicalAlert || 'None on sample record'}</Text></View><Text style={styles.designationTitle}>Program designations · restricted</Text><View style={styles.designationRow}>{selectedStudent.designations.length ? selectedStudent.designations.map((item) => <View key={item} style={styles.designationTag}><Text style={styles.designationText}>{item}</Text></View>) : <Text style={styles.guardianMeta}>No sample designation</Text>}</View></> : <View style={styles.accessNotice}><LockKeyhole size={14} color={colors.forest} /><Text style={styles.accessNoticeText}>Custody, medical, guardian contact, and program-designation fields require an authorized office role. Database RLS is required in production.</Text></View>}
            </View>
            <View style={styles.profileSection}><View style={styles.sectionHeading}><BusFront size={13} color={colors.forest} /><Text style={styles.sectionTitle}>Transportation & attendance</Text></View><View style={styles.profileFacts}><View style={styles.fact}><Text style={styles.factLabel}>BUS ROUTE</Text><Text style={styles.factValue}>Route 14 · North</Text></View><View style={styles.fact}><Text style={styles.factLabel}>TODAY</Text><Text style={styles.factValue}>Present · 8:14 AM</Text></View></View></View>
          </View>
        </View>
      </View> : null}

      {tab === 'Registration' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Online registration & census</Text><Text style={styles.panelSubtitle}>New enrollment and annual re-enrollment applications</Text></View><View style={styles.filterButton}><Text style={styles.filterText}>{registrationFilter}</Text><ChevronDown size={12} color={colors.muted} /></View></View>
        <View style={styles.registrationMetrics}><View style={styles.registrationMetric}><Text style={styles.metricValue}>12</Text><Text style={styles.metricLabel}>IN PROGRESS</Text></View><View style={styles.registrationMetric}><Text style={styles.metricValue}>4</Text><Text style={styles.metricLabel}>READY TO REVIEW</Text></View><View style={styles.registrationMetric}><Text style={styles.metricValue}>3</Text><Text style={styles.metricLabel}>DOCUMENTS NEEDED</Text></View></View>
        {enrollmentApplicants.map((application) => <View key={application.name} style={styles.applicationRow}><View style={styles.applicationAvatar}><Text style={styles.applicationInitial}>{application.name.split(' ').map((part) => part[0]).join('')}</Text></View><View style={styles.applicationInfo}><Text style={styles.applicationName}>{application.name}</Text><Text style={styles.applicationMeta}>{application.grade} · {application.school}</Text><View style={styles.applicationProgress}><View style={styles.applicationTrack}><View style={[styles.applicationFill, { width: `${application.complete / application.total * 100}%` }]} /></View><Text style={styles.applicationProgressText}>{application.complete}/{application.total} steps</Text></View></View><View style={styles.applicationActions}><Text style={[styles.applicationStatus, application.complete === application.total ? styles.readyStatus : null]}>{application.status}</Text><Pressable onPress={() => setNotice(`Opening local registration review for ${application.name}.`)} style={styles.reviewButton}><Text style={styles.reviewButtonText}>Review</Text></Pressable></View></View>)}
        <View style={styles.registrationFooter}><MapPin size={14} color={colors.forest} /><View style={{ flex: 1 }}><Text style={styles.footerTitle}>Address zone verification</Text><Text style={styles.footerCopy}>Geocoding and boundary assignment are preview-only. No address service is configured.</Text></View><Pressable onPress={() => setNotice('Address geocoding requires a district-approved provider and is not connected.')}><ArrowRight size={14} color={colors.forest} /></Pressable></View>
        <Text style={styles.disclaimer}>Document upload is not connected. Do not enter or upload real student documents in this demo.</Text>
      </View> : null}

      {tab === 'Scheduling' ? <K12SchedulingEngine narrow={narrow} /> : null}

      {tab === 'Privacy & records' ? <PrivacyComplianceWorkspace narrow={narrow} /> : null}

      {tab === 'Compliance' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>State & roster interoperability</Text><Text style={styles.panelSubtitle}>Ed-Fi / USBE · OneRoster · LTI 1.3</Text></View><ShieldAlert size={15} color={colors.forest} /></View>
        <View style={styles.integrationGrid}><View style={styles.integrationCard}><View style={styles.integrationCardHeader}><Text style={styles.integrationName}>Ed-Fi · USBE</Text><View style={styles.previewStatus}><View style={styles.previewDot} /><Text style={styles.previewStatusText}>PREVIEW ONLY</Text></View></View><Text style={styles.integrationCopy}>Enrollment, attendance, course, and discipline event mapping.</Text><Text style={styles.integrationMeta}>Endpoint · Not configured</Text><Pressable onPress={() => { setReportPrepared(true); setNotice('Ed-Fi report preview prepared locally. No state endpoint was contacted.'); }} style={styles.integrationAction}><Text style={styles.integrationActionText}>{reportPrepared ? 'Preview prepared' : 'Prepare state report'}</Text><ArrowRight size={11} color={colors.forest} /></Pressable></View>
          <View style={styles.integrationCard}><View style={styles.integrationCardHeader}><Text style={styles.integrationName}>OneRoster 1.2</Text><View style={styles.previewStatus}><View style={styles.previewDot} /><Text style={styles.previewStatusText}>PREVIEW ONLY</Text></View></View><Text style={styles.integrationCopy}>Class rosters, users, courses, and enrollment synchronization.</Text><Text style={styles.integrationMeta}>OAuth / credentials · Not configured</Text><Pressable onPress={() => { setRosterPrepared(true); setNotice('OneRoster roster preview prepared locally. No third-party platform was contacted.'); }} style={styles.integrationAction}><Text style={styles.integrationActionText}>{rosterPrepared ? 'Roster preview prepared' : 'Preview roster sync'}</Text><ArrowRight size={11} color={colors.forest} /></Pressable></View></View>
        <View style={styles.outboxPanel}><View style={styles.outboxHeader}><FileText size={14} color={colors.forest} /><Text style={styles.sectionTitle}>Reporting outbox</Text><Text style={styles.outboxCount}>{reportPrepared || rosterPrepared ? '1 local preview' : '0 queued'}</Text></View><Text style={styles.outboxCopy}>Production state reporting should use a server-side outbox with retries, idempotency keys, delivery receipts, and audit records. This demo does not stream student records.</Text></View>
        <Text style={styles.disclaimer}>Never place state API credentials or student payloads in the Expo client. Configure authorized server-side integrations and district data agreements first.</Text>
      </View> : null}

      {tab === 'Door kiosk' ? <ClassroomKioskWorkspace narrow={narrow} /> : null}
      <Text style={styles.footerText}>SIS DEMO · SAMPLE STUDENT DATA · ROLE PREVIEW IS NOT DATABASE AUTHORIZATION</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 10 }, workspaceHeader: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9 },
  headerIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: colors.limeSoft }, workspaceTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' }, workspaceSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  sampleTag: { borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 6, paddingVertical: 4 }, sampleTagText: { color: '#808a82', fontSize: 6, fontWeight: '700' },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 4 }, tab: { minHeight: 29, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 4, backgroundColor: '#e9ede7' }, tabActive: { backgroundColor: colors.forest }, tabText: { color: '#637067', fontSize: 7, fontWeight: '600' }, tabTextActive: { color: '#fff' },
  notice: { padding: 8, backgroundColor: colors.limeSoft, borderRadius: 4 }, noticeText: { color: colors.forest, fontSize: 7, lineHeight: 11 },
  directoryLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, directoryLayoutNarrow: { flexDirection: 'column' }, directoryRail: { width: 225 }, profileColumn: { flex: 1, minWidth: 0 },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 11, marginBottom: 9 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginBottom: 8 }, panelTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  searchBox: { height: 29, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7, marginBottom: 6 }, searchInput: { flex: 1, color: colors.ink, fontSize: 7 },
  studentRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingHorizontal: 4 }, studentRowSelected: { backgroundColor: '#f1f6ed' }, studentAvatar: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft }, studentInitials: { color: colors.forest, fontSize: 7, fontWeight: '700' }, studentName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, studentMeta: { color: colors.muted, fontSize: 6, marginTop: 2 },
  disclaimer: { color: '#89938b', fontSize: 6, lineHeight: 10, marginTop: 7 }, profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, profileAvatar: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2e6d5' }, profileInitials: { color: colors.forest, fontSize: 9, fontWeight: '700' }, eyebrow: { color: colors.forest, fontSize: 6, fontWeight: '700', letterSpacing: 0.4 }, profileName: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 3 }, profileMeta: { color: colors.muted, fontSize: 6, marginTop: 3 },
  roleToggle: { flexDirection: 'row', gap: 2, backgroundColor: '#eef0ec', padding: 2, borderRadius: 3 }, roleButton: { paddingHorizontal: 5, paddingVertical: 4, borderRadius: 2 }, roleButtonSelected: { backgroundColor: '#fff' }, roleButtonText: { color: colors.muted, fontSize: 6 }, roleButtonTextSelected: { color: colors.forest, fontWeight: '700' },
  profileFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingVertical: 9 }, fact: { minWidth: 75 }, factLabel: { color: '#89938b', fontSize: 5, fontWeight: '700', letterSpacing: 0.4 }, factValue: { color: colors.ink, fontSize: 7, fontWeight: '600', marginTop: 4 }, profileSection: { borderTopWidth: 1, borderTopColor: '#edf0eb', paddingTop: 8, paddingBottom: 4 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }, sectionTitle: { color: colors.ink, fontSize: 7, fontWeight: '700', flex: 1 },
  guardianName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, guardianContact: { color: '#53645a', fontSize: 7, marginTop: 3 }, guardianMeta: { color: colors.muted, fontSize: 6, marginTop: 3 }, sensitiveRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 5 }, sensitiveLabel: { color: colors.muted, fontSize: 6 }, sensitiveValue: { color: '#617168', fontSize: 6, textAlign: 'right', flex: 1 }, alertValue: { color: '#a94f38', fontWeight: '700' }, restrictedNote: { color: '#a25742', fontSize: 6, lineHeight: 10, marginTop: 4, padding: 5, backgroundColor: colors.orangeSoft, borderRadius: 3 }, designationTitle: { color: colors.muted, fontSize: 6, marginTop: 8 }, designationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }, designationTag: { backgroundColor: colors.blueSoft, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3 }, designationText: { color: '#52738a', fontSize: 6 }, accessNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: colors.yellowSoft, padding: 8, borderRadius: 4 }, accessNoticeText: { color: '#79632e', fontSize: 7, lineHeight: 11, flex: 1 },
  registrationMetrics: { flexDirection: 'row', gap: 7, marginBottom: 10 }, registrationMetric: { flex: 1, minHeight: 55, justifyContent: 'center', backgroundColor: '#f3f5f1', borderRadius: 4, padding: 8 }, metricValue: { color: colors.ink, fontSize: 15, fontWeight: '700' }, metricLabel: { color: colors.muted, fontSize: 5, fontWeight: '700', marginTop: 3 }, filterButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 5 }, filterText: { color: colors.muted, fontSize: 6 },
  applicationRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb' }, applicationAvatar: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.blueSoft }, applicationInitial: { color: colors.forest, fontSize: 7, fontWeight: '700' }, applicationInfo: { flex: 1 }, applicationName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, applicationMeta: { color: colors.muted, fontSize: 6, marginTop: 3 }, applicationProgress: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }, applicationTrack: { width: 62, height: 3, backgroundColor: '#e5eae2', borderRadius: 2 }, applicationFill: { height: 3, backgroundColor: colors.forest, borderRadius: 2 }, applicationProgressText: { color: colors.muted, fontSize: 5 }, applicationActions: { alignItems: 'flex-end', gap: 4 }, applicationStatus: { color: '#9d633f', fontSize: 5 }, readyStatus: { color: colors.forest }, reviewButton: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 3, backgroundColor: colors.limeSoft }, reviewButtonText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  registrationFooter: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11, padding: 8, backgroundColor: '#f2f6ee', borderRadius: 4 }, footerTitle: { color: colors.ink, fontSize: 7, fontWeight: '700' }, footerCopy: { color: colors.muted, fontSize: 6, lineHeight: 10, marginTop: 3 },
  scheduleLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, scheduleLayoutNarrow: { flexDirection: 'column' }, scheduleMain: { flex: 1, minWidth: 0 }, scheduleRail: { width: 225 }, scheduleRailNarrow: { width: '100%' }, scheduleStudentPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 7 }, scheduleStudentButton: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 3, backgroundColor: '#f0f2ee' }, scheduleStudentButtonSelected: { backgroundColor: colors.limeSoft }, scheduleStudentButtonText: { color: colors.muted, fontSize: 6 }, scheduleStudentButtonTextSelected: { color: colors.forest, fontWeight: '700' },
  primaryAction: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 3, backgroundColor: colors.forest }, primaryActionText: { color: '#fff', fontSize: 6, fontWeight: '600' }, subsectionTitle: { color: colors.ink, fontSize: 7, fontWeight: '700', marginTop: 11, marginBottom: 4 }, courseRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, periodBadge: { width: 23, height: 23, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.blueSoft }, periodText: { color: '#52738a', fontSize: 6, fontWeight: '700' }, courseName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, courseMeta: { color: colors.muted, fontSize: 5, marginTop: 3 }, disabledButton: { opacity: 0.35 }, enrolledTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.limeSoft, paddingHorizontal: 5, paddingVertical: 4, borderRadius: 3 }, enrolledText: { color: colors.forest, fontSize: 5 }, addCourseButton: { width: 23, height: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 4 },
  scheduledRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, scheduledPeriod: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft }, scheduledPeriodText: { color: colors.forest, fontSize: 6, fontWeight: '700' }, scheduledCourse: { color: colors.ink, fontSize: 6, fontWeight: '600' }, emptySchedule: { color: colors.muted, fontSize: 6, lineHeight: 10, paddingVertical: 8 }, itinerantCallout: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 8, padding: 7, backgroundColor: colors.blueSoft, borderRadius: 3 }, itinerantText: { color: '#54748a', fontSize: 6, lineHeight: 10, flex: 1 },
  integrationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, integrationCard: { flexGrow: 1, flexBasis: '46%', minWidth: 175, borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 9 }, integrationCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, integrationName: { color: colors.ink, fontSize: 8, fontWeight: '700' }, previewStatus: { flexDirection: 'row', alignItems: 'center', gap: 3 }, previewDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.yellow }, previewStatusText: { color: '#8a7139', fontSize: 5, fontWeight: '700' }, integrationCopy: { color: '#657168', fontSize: 6, lineHeight: 10, marginTop: 7 }, integrationMeta: { color: colors.muted, fontSize: 5, marginTop: 6 }, integrationAction: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf0eb', marginTop: 6 }, integrationActionText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  outboxPanel: { backgroundColor: '#f2f5f0', borderRadius: 4, padding: 9, marginTop: 9 }, outboxHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 }, outboxCount: { color: colors.muted, fontSize: 6 }, outboxCopy: { color: '#6e7a71', fontSize: 6, lineHeight: 10, marginTop: 6 }, footerText: { color: '#99a198', fontSize: 6, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3, marginTop: 2 },
});