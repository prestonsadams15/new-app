import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Clock3,
  FireExtinguisher,
  HeartPulse,
  LockKeyhole,
  MapPin,
  PhoneCall,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react-native';

type Tier = 'tier_1_yellow' | 'tier_2_orange' | 'tier_3_red';
type IncidentKind = 'medical' | 'classroom_clear' | 'fire' | 'lockdown' | 'active_threat';
type IncidentStatus = 'active' | 'all_clear' | 'resolved';
type PersonStatus = 'unreported' | 'accounted_for' | 'missing' | 'extra_student' | 'injured';
type Srp = 'hold' | 'secure' | 'lockdown' | 'evacuate' | 'shelter';
type StudentRecord = { id: string; name: string; grade: string; room: string; status: PersonStatus; notes?: string };
type StaffRecord = { id: string; name: string; role: string; status: 'unconfirmed' | 'secured' | 'needs_assistance' | 'evacuated'; room: string; studentCount: number };
type Incident = { id: string; tier: Tier; kind: IncidentKind; srp: Srp; zone: string; status: IncidentStatus; createdAt: string; dispatchNotified: boolean };
const srpOptions: Srp[] = ['hold', 'secure', 'lockdown', 'evacuate', 'shelter'];
const automationTriggers = ['Smart-door lock webhooks', 'PA audio announcement', 'Visual strobe alerts', 'Public web CMS override', '911 PSAP dispatch API'];
type EventRecord = { id: string; title: string; detail: string; time: string; tone: 'green' | 'yellow' | 'red' };

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f',
  limeSoft: '#eef6e3', orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df',
  blue: '#6e94b1', blueSoft: '#eaf1f6', red: '#b64036', redSoft: '#fdecea',
};

const studentSeed = [
  { id: 'stu-1', name: 'Maya Thompson', grade: '4', room: '12' },
  { id: 'stu-2', name: 'Ethan Chen', grade: '2', room: '12' },
  { id: 'stu-3', name: 'Ava Johnson', grade: 'K', room: '03' },
  { id: 'stu-4', name: 'Lucy Garcia', grade: '1', room: '03' },
  { id: 'stu-5', name: 'Noah Williams', grade: '6', room: '21' },
  { id: 'stu-6', name: 'Sofia Martinez', grade: '7', room: '18' },
  { id: 'stu-7', name: 'Owen Brooks', grade: '3', room: '14' },
  { id: 'stu-8', name: 'Nina Patel', grade: '5', room: '16' },
];

const staffSeed = [
  { id: 'staff-1', name: 'Avery Brooks', role: 'Teacher', room: '12' },
  { id: 'staff-2', name: 'Renee Cole', role: 'SPED · itinerant', room: '03' },
  { id: 'staff-3', name: 'Sam Patel', role: 'Counselor', room: '18' },
  { id: 'staff-4', name: 'Morgan Lee', role: 'Substitute', room: '21' },
];

const tierDetails: Record<Tier, { label: string; title: string; detail: string; tone: 'yellow' | 'orange' | 'red' }> = {
  tier_1_yellow: { label: 'TIER 1 · YELLOW', title: 'Internal assistance', detail: 'Medical or behavioral support · Dispatch designated school responders', tone: 'yellow' },
  tier_2_orange: { label: 'TIER 2 · ORANGE', title: 'Classroom clear / hold', detail: 'Localized response · Notify nearby staff and building command', tone: 'orange' },
  tier_3_red: { label: 'TIER 3 · RED', title: 'Active threat / lockdown', detail: 'Building-wide protective action · Emergency services escalation required', tone: 'red' },
};

const timestamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

export function EmergencyCommandWorkspace({ narrow }: { narrow: boolean }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [tier, setTier] = useState<Tier>('tier_1_yellow');
  const [kind, setKind] = useState<IncidentKind>('medical');
  const [srp, setSrp] = useState<Srp>('hold');
  const [zone, setZone] = useState('Main building');
  const [redConfirmOpen, setRedConfirmOpen] = useState(false);
  const [redAuthorized, setRedAuthorized] = useState(false);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>(staffSeed.map((member) => ({ ...member, status: 'unconfirmed', studentCount: 0 })));
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [activeRoom, setActiveRoom] = useState('All rooms');
  const [extraName, setExtraName] = useState('');
  const [extraRoom, setExtraRoom] = useState('12');
  const [staffEditorId, setStaffEditorId] = useState<string | null>(null);
  const [staffRoom, setStaffRoom] = useState('12');
  const [staffHeadcount, setStaffHeadcount] = useState('0');
  const [notice, setNotice] = useState('');

  const accountedCount = students.filter((student) => student.status === 'accounted_for').length;
  const missingCount = students.filter((student) => student.status === 'missing').length;
  const injuredCount = students.filter((student) => student.status === 'injured').length;
  const unreportedCount = students.filter((student) => student.status === 'unreported').length;
  const unconfirmedStaff = staff.filter((member) => member.status === 'unconfirmed').length;
  const filteredStudents = activeRoom === 'All rooms' ? students : students.filter((student) => student.room === activeRoom);
  const roomNames = ['All rooms', '03', '12', '14', '18', '21', 'Library', 'Gym'];

  const recordEvent = (title: string, detail: string, tone: EventRecord['tone']) => {
    setEvents((current) => [{ id: `event-${Date.now()}-${Math.random()}`, title, detail, time: timestamp(), tone }, ...current]);
  };

  const activateIncident = () => {
    if (tier === 'tier_3_red' && !redAuthorized) {
      setRedConfirmOpen(true);
      return;
    }
    const created: Incident = {
      id: `incident-${Date.now()}`, tier, kind, srp, zone, status: 'active', createdAt: timestamp(), dispatchNotified: false,
    };
    setIncident(created);
    setStudents(studentSeed.map((student) => ({ ...student, status: 'unreported' })));
    setStaff(staffSeed.map((member) => ({ ...member, status: 'unconfirmed', studentCount: 0 })));
    setEvents([{ id: `event-${Date.now()}`, title: `${tierDetails[tier].label} activated`, detail: `${kind.replace('_', ' ')} · SRP ${srp} · ${zone}`, time: timestamp(), tone: tier === 'tier_3_red' ? 'red' : tier === 'tier_2_orange' ? 'yellow' : 'green' }]);
    setNotice(tier === 'tier_3_red'
      ? 'Red alert preview activated. Automated 911 dispatch is not connected; follow your school emergency plan and call 911 using the local procedure.'
      : `${tierDetails[tier].title} preview activated for ${zone}. No external alerts were sent.`);
    setRedConfirmOpen(false);
    setRedAuthorized(false);
  };

  const updateStudentStatus = (studentId: string, status: PersonStatus) => {
    const student = students.find((item) => item.id === studentId);
    setStudents((current) => current.map((item) => item.id === studentId ? { ...item, status } : item));
    if (student) recordEvent('Student status updated', `${student.name} · Room ${student.room} · ${status.replaceAll('_', ' ')}`, status === 'missing' || status === 'injured' ? 'red' : status === 'accounted_for' ? 'green' : 'yellow');
    if (status === 'injured') setNotice('Injured flag recorded locally. Call medical responders and 911 directly; this preview does not notify anyone.');
  };

  const addExtraStudent = () => {
    if (!extraName.trim()) { setNotice('Enter a name or identifier for the extra student.'); return; }
    const student: StudentRecord = { id: `extra-${Date.now()}`, name: extraName.trim(), grade: '—', room: extraRoom, status: 'extra_student' };
    setStudents((current) => [student, ...current]);
    recordEvent('Extra student reported', `${student.name} · Room ${student.room}`, 'yellow');
    setExtraName('');
    setNotice(`${student.name} added to the accountability roster for verification.`);
  };

  const openStaffCheckIn = (member: StaffRecord) => {
    setStaffEditorId(member.id);
    setStaffRoom(member.room);
    setStaffHeadcount(String(member.studentCount));
  };

  const confirmStaffCheckIn = () => {
    if (!staffEditorId) return;
    const count = Number(staffHeadcount);
    if (!Number.isInteger(count) || count < 0) { setNotice('Enter a valid student headcount.'); return; }
    const member = staff.find((item) => item.id === staffEditorId);
    setStaff((current) => current.map((item) => item.id === staffEditorId ? { ...item, room: staffRoom.trim() || item.room, studentCount: count, status: 'secured' } : item));
    if (member) recordEvent('Staff check-in', `${member.name} · Secured in Room ${staffRoom} with ${count} students`, 'green');
    setStaffEditorId(null);
    setNotice('Staff location reported to this local incident preview.');
  };

  const clearIncident = () => {
    if (!incident) return;
    setIncident({ ...incident, status: 'all_clear' });
    recordEvent('All clear recorded', 'Local command-center preview only', 'green');
    setNotice('All clear recorded locally. Follow district authorization before ending a real incident.');
  };

  const exportRoster = async () => {
    const rows = [
      ['Person', 'Type', 'Grade', 'Status', 'Room', 'Reported at'],
      ...students.map((student) => [student.name, student.id.startsWith('extra-') ? 'Extra student' : 'Student', student.grade, student.status, student.room, '']),
      ...staff.map((member) => [member.name, member.role, '', member.status, member.room, '']),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `evacuation-roster-${incident?.id ?? 'preview'}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice('Evacuation roster CSV downloaded. This file contains sample data.');
      return;
    }
    await Share.share({ title: 'Evacuation roster preview', message: csv });
  };

  const tabs = [
    { title: 'Tier 1 · Yellow', value: 'tier_1_yellow' as Tier, tone: 'yellow' as const, detail: 'Internal medical / behavioral assistance', icon: HeartPulse },
    { title: 'Tier 2 · Orange', value: 'tier_2_orange' as Tier, tone: 'orange' as const, detail: 'Classroom clear / hold', icon: AlertTriangle },
    { title: 'Tier 3 · Red', value: 'tier_3_red' as Tier, tone: 'red' as const, detail: 'Lockdown / active threat', icon: LockKeyhole },
  ];
  const incidentKinds: IncidentKind[] = ['medical', 'classroom_clear', 'fire', 'lockdown', 'active_threat'];

  return (
    <View style={styles.workspace}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><ShieldAlert size={17} color={colors.forest} /></View>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Emergency command center</Text><Text style={styles.headerSubtitle}>Evergreen Elementary · Safety &amp; Security</Text></View>
        <View style={incident?.status === 'active' ? styles.liveBadge : styles.previewBadge}><View style={[styles.liveDot, incident?.status !== 'active' && styles.previewDot]} /><Text style={styles.liveBadgeText}>{incident?.status === 'active' ? 'INCIDENT ACTIVE' : 'SIMULATION'}</Text></View>
      </View>

      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      <View style={[styles.alertGrid, narrow && styles.alertGridNarrow]}>
        {tabs.map((item) => { const Icon = item.icon; const selected = tier === item.value; return <Pressable key={item.value} onPress={() => { setTier(item.value); setRedConfirmOpen(false); }} style={[styles.alertCard, item.tone === 'yellow' ? styles.alertYellow : item.tone === 'orange' ? styles.alertOrange : styles.alertRed, selected && styles.alertSelected]}><View style={styles.alertCardHeader}><Icon size={17} color={item.tone === 'red' ? colors.red : item.tone === 'orange' ? colors.orange : colors.yellow} /><Text style={styles.alertLevel}>{item.title}</Text></View><Text style={styles.alertDetail}>{item.detail}</Text></Pressable>; })}
      </View>

      <View style={styles.controlPanel}>
        <View style={styles.incidentControls}>
          <View style={styles.controlField}><Text style={styles.fieldLabel}>INCIDENT TYPE</Text><View style={styles.typeOptions}>{incidentKinds.map((item) => <Pressable key={item} onPress={() => setKind(item)} style={[styles.typeOption, kind === item && styles.typeOptionSelected]}><Text style={[styles.typeOptionText, kind === item && styles.typeOptionTextSelected]}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</View></View>
          <View style={styles.controlField}><Text style={styles.fieldLabel}>STANDARD RESPONSE PROTOCOL</Text><View style={styles.typeOptions}>{srpOptions.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: srp === item }} onPress={() => setSrp(item)} style={[styles.typeOption, srp === item && styles.typeOptionSelected]}><Text style={[styles.typeOptionText, srp === item && styles.typeOptionTextSelected]}>{item}</Text></Pressable>)}</View></View>
          <View style={styles.controlField}><Text style={styles.fieldLabel}>BUILDING ZONE</Text><View style={styles.typeOptions}>{['Main building', 'North wing', 'Gym & field', 'Cafeteria'].map((item) => <Pressable key={item} onPress={() => setZone(item)} style={[styles.typeOption, zone === item && styles.typeOptionSelected]}><Text style={[styles.typeOptionText, zone === item && styles.typeOptionTextSelected]}>{item}</Text></Pressable>)}</View></View>
          {incident?.status === 'active' ? <Pressable onPress={clearIncident} style={styles.clearButton}><CheckCircle2 size={14} color="#fff" /><Text style={styles.clearButtonText}>Record all clear</Text></Pressable> : <Pressable onPress={() => { setNotice(''); if (tier === 'tier_3_red') { setRedConfirmOpen(true); return; } activateIncident(); }} style={[styles.activateButton, tier === 'tier_3_red' && styles.activateButtonRed]}><AlertTriangle size={14} color="#fff" /><Text style={styles.activateButtonText}>Activate {tierDetails[tier].label}</Text></Pressable>}
        </View>
        {tier === 'tier_3_red' && incident?.status !== 'active' ? <View style={styles.dispatchGuard}><PhoneCall size={14} color={colors.red} /><Text style={styles.dispatchGuardText}>911 dispatch is not connected. Use the school’s established emergency procedure for real incidents.</Text></View> : null}
      </View>

      {redConfirmOpen ? <View style={styles.confirmPanel}><View style={styles.confirmIcon}><LockKeyhole size={16} color={colors.red} /></View><View style={{ flex: 1 }}><Text style={styles.confirmTitle}>Confirm Tier 3 red-alert preview</Text><Text style={styles.confirmCopy}>This records a local lockdown/active-threat simulation for {zone}. No 911 call or external alert will be sent.</Text><Pressable style={styles.confirmCheck} onPress={() => setRedAuthorized(!redAuthorized)}><View style={[styles.checkbox, redAuthorized && styles.checkboxChecked]}>{redAuthorized ? <Check size={10} color="#fff" /> : null}</View><Text style={styles.confirmCheckText}>I am authorized to activate this response workflow.</Text></Pressable><Pressable disabled={!redAuthorized} onPress={activateIncident} style={[styles.confirmRedButton, !redAuthorized && styles.buttonDisabled]}><Text style={styles.confirmRedButtonText}>Confirm red-alert preview</Text></Pressable></View></View> : null}

      {incident ? <>
        <View style={[styles.statsGrid, narrow && styles.statsGridNarrow]}>
          <View style={[styles.statCard, styles.statGreen]}><Text style={styles.statLabel}>ACCOUNTED FOR</Text><Text style={styles.statValue}>{accountedCount}<Text style={styles.statTotal}> / {students.length}</Text></Text></View>
          <View style={[styles.statCard, styles.statRed]}><Text style={styles.statLabel}>MISSING · INJURED</Text><Text style={styles.statValue}>{missingCount}<Text style={styles.statTotal}> · {injuredCount}</Text></Text></View>
          <View style={[styles.statCard, styles.statYellow]}><Text style={styles.statLabel}>UNREPORTED</Text><Text style={styles.statValue}>{unreportedCount}</Text></View>
          <View style={[styles.statCard, styles.statBlue]}><Text style={styles.statLabel}>UNCONFIRMED STAFF</Text><Text style={styles.statValue}>{unconfirmedStaff}</Text></View>
        </View>

        <View style={[styles.commandGrid, narrow && styles.commandGridNarrow]}>
          <View style={styles.commandMain}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Floorplan command view</Text><Text style={styles.panelSubtitle}>{incident.zone} · Tap a room to filter accountability</Text></View><MapPin size={15} color={colors.forest} /></View>
              <View style={styles.floorplan}>{['03', '12', '14', '18', '21', 'Gym', 'Cafeteria', 'Library'].map((room) => {
                const roomStudents = students.filter((student) => student.room === room);
                const roomMissing = roomStudents.some((student) => student.status === 'missing' || student.status === 'injured');
                const roomUnreported = roomStudents.some((student) => student.status === 'unreported');
                const roomSecured = roomStudents.length > 0 && !roomMissing && !roomUnreported;
                return <Pressable key={room} onPress={() => setActiveRoom(activeRoom === room ? 'All rooms' : room)} style={[styles.roomTile, roomMissing && styles.roomTileMissing, !roomMissing && roomUnreported && styles.roomTileUnreported, roomSecured && styles.roomTileSecured, activeRoom === room && styles.roomTileSelected]}><Text style={styles.roomTileLabel}>{room === 'Gym' || room === 'Cafeteria' || room === 'Library' ? room : `ROOM ${room}`}</Text><Text style={styles.roomTileCount}>{roomStudents.length} students</Text></Pressable>;
              })}</View>
              <View style={styles.matrixHeader}><View><Text style={styles.panelTitle}>Student accountability matrix</Text><Text style={styles.panelSubtitle}>{activeRoom === 'All rooms' ? 'All rostered students' : `Filtered to Room ${activeRoom}`}</Text></View><Pressable onPress={() => setActiveRoom('All rooms')}><Text style={styles.resetLink}>All rooms</Text></Pressable></View>
              <View style={styles.matrixRows}>{filteredStudents.map((student) => <View key={student.id} style={styles.studentRow}><View style={{ flex: 1 }}><Text style={styles.studentName}>{student.name}</Text><Text style={styles.studentMeta}>Grade {student.grade} · Room {student.room}</Text></View><View style={styles.statusButtons}>{(['accounted_for', 'missing', 'extra_student', 'injured'] as PersonStatus[]).map((status) => <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected: student.status === status }} onPress={() => updateStudentStatus(student.id, status)} style={[styles.statusButton, student.status === status && statusStyle(status)]}><Text style={[styles.statusButtonText, student.status === status && styles.statusButtonTextActive]}>{status === 'accounted_for' ? 'Here' : status === 'missing' ? 'Missing' : status === 'injured' ? 'Injured' : 'Extra'}</Text></Pressable>)}</View></View>)}</View>
              <View style={styles.extraStudentForm}><TextInput value={extraName} onChangeText={setExtraName} placeholder="Extra student / unidentified person" style={styles.extraNameInput} /><TextInput value={extraRoom} onChangeText={setExtraRoom} placeholder="Room" style={styles.extraRoomInput} /><Pressable onPress={addExtraStudent} style={styles.extraAddButton}><Plus size={11} color="#fff" /><Text style={styles.extraAddText}>Add</Text></Pressable></View>
            </View>
          </View>

          <View style={[styles.commandRail, narrow && styles.commandRailNarrow]}>
            <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Staff accountability</Text><Text style={styles.panelSubtitle}>Self-report secured location</Text></View><Users size={15} color={colors.forest} /></View>
              {staff.map((member) => <View key={member.id} style={styles.staffRow}><View style={{ flex: 1 }}><Text style={styles.staffName}>{member.name}</Text><Text style={styles.staffMeta}>{member.role} · {member.status === 'secured' ? `Room ${member.room} · ${member.studentCount} students` : member.status.replaceAll('_', ' ')}</Text></View><Pressable onPress={() => { setStaffEditorId(staffEditorId === member.id ? null : member.id); setStaffRoom(member.room); setStaffHeadcount(String(member.studentCount)); }} style={[styles.staffCheckButton, member.status === 'secured' && styles.staffConfirmed]}><Text style={styles.staffCheckText}>{member.status === 'secured' ? 'Update' : 'Check in'}</Text></Pressable></View>)}
              {staffEditorId ? <View style={styles.staffEditor}><Text style={styles.fieldLabel}>SECURED LOCATION</Text><TextInput value={staffRoom} onChangeText={setStaffRoom} placeholder="Room number" style={styles.staffInput} /><Text style={styles.fieldLabel}>STUDENT HEADCOUNT</Text><TextInput value={staffHeadcount} onChangeText={setStaffHeadcount} keyboardType="number-pad" style={styles.staffInput} /><Pressable onPress={confirmStaffCheckIn} style={styles.saveStaffButton}><Check size={11} color="#fff" /><Text style={styles.saveStaffText}>Report secured</Text></Pressable></View> : null}
            </View>
            <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Visitor / substitute presence</Text><Text style={styles.panelSubtitle}>Front-office directory preview</Text></View><Users size={15} color={colors.blue} /></View><View style={styles.presenceRow}><Text style={styles.presenceType}>Visitors</Text><Text style={styles.presenceCount}>2</Text></View><View style={styles.presenceRow}><Text style={styles.presenceType}>Substitutes</Text><Text style={styles.presenceCount}>1</Text></View><View style={styles.presenceRow}><Text style={styles.presenceType}>Contractors</Text><Text style={styles.presenceCount}>0</Text></View></View>
            <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Automated triggers</Text><Text style={styles.panelSubtitle}>Requires district hardware and provider setup</Text></View><LockKeyhole size={15} color={colors.red} /></View>{automationTriggers.map((trigger) => <View key={trigger} style={styles.presenceRow}><Text style={styles.presenceType}>{trigger}</Text><Text style={styles.triggerOff}>NOT CONNECTED</Text></View>)}</View>
            <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Responder roster</Text><Text style={styles.panelSubtitle}>Export current local accountability</Text></View></View><Pressable onPress={exportRoster} style={styles.exportButton}><ArrowDownToLine size={13} color={colors.forest} /><Text style={styles.exportButtonText}>Export evacuation roster</Text></Pressable><Text style={styles.safetyNote}>Roster includes student names, grades, locations, and staff check-ins. Share only with authorized responders.</Text></View>
          </View>
        </View>

        <View style={styles.eventPanel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Incident event log</Text><Text style={styles.panelSubtitle}>Local audit preview · {incident.createdAt}</Text></View><Text style={styles.incidentStatus}>{incident.status.toUpperCase()}</Text></View>{events.slice(0, 6).map((event) => <View key={event.id} style={styles.eventRow}><View style={[styles.eventDot, event.tone === 'red' && styles.eventDotRed, event.tone === 'yellow' && styles.eventDotYellow]} /><View style={{ flex: 1 }}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventDetail}>{event.detail}</Text></View><Text style={styles.eventTime}>{event.time}</Text></View>)}</View>
      </> : <View style={styles.emptyIncident}><View style={styles.emptyIcon}><ShieldAlert size={22} color={colors.forest} /></View><Text style={styles.emptyTitle}>No active incident</Text><Text style={styles.emptyCopy}>Select an alert tier, incident type, and zone. This command-center preview does not contact emergency services.</Text></View>}
      <Text style={styles.footerText}>EMERGENCY WORKFLOW PREVIEW · SAMPLE ROSTER · NO 911, STAFF, OR FAMILY DISPATCH INTEGRATION</Text>
    </View>
  );
}

function statusStyle(status: PersonStatus) {
  if (status === 'accounted_for') return styles.statusAccounted;
  if (status === 'missing' || status === 'injured') return styles.statusMissing;
  return styles.statusExtra;
}

const styles = StyleSheet.create({
  workspace: { gap: 10 },
  header: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5 },
  headerIcon: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangeSoft, borderRadius: 5 },
  headerTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, backgroundColor: colors.redSoft, paddingHorizontal: 6, paddingVertical: 5 },
  previewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 6, paddingVertical: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.red }, previewDot: { backgroundColor: colors.yellow }, liveBadgeText: { color: colors.red, fontSize: 6, fontWeight: '700' },
  notice: { borderRadius: 4, backgroundColor: colors.yellowSoft, padding: 8 }, noticeText: { color: '#76602a', fontSize: 7, lineHeight: 11 },
  alertGrid: { flexDirection: 'row', gap: 7 }, alertGridNarrow: { flexDirection: 'column' },
  alertCard: { flex: 1, minHeight: 73, borderRadius: 5, borderWidth: 1, borderColor: 'transparent', padding: 9 }, alertSelected: { borderWidth: 2, borderColor: colors.forest },
  alertYellow: { backgroundColor: colors.yellowSoft }, alertOrange: { backgroundColor: colors.orangeSoft }, alertRed: { backgroundColor: colors.redSoft },
  alertCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 }, alertLevel: { color: colors.ink, fontSize: 7, fontWeight: '700' }, alertDetail: { color: '#667269', fontSize: 7, lineHeight: 11, marginTop: 6 },
  controlPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 10 }, incidentControls: { gap: 8 }, controlField: { gap: 5 }, fieldLabel: { color: '#758078', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 }, typeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  typeOption: { minHeight: 24, justifyContent: 'center', borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 7 }, typeOptionSelected: { backgroundColor: '#e4eee0' }, typeOptionText: { color: '#69756c', fontSize: 6, textTransform: 'capitalize' }, typeOptionTextSelected: { color: colors.forest, fontWeight: '700' },
  activateButton: { minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 4, backgroundColor: '#9b7527', paddingHorizontal: 9, alignSelf: 'flex-start' }, activateButtonRed: { backgroundColor: colors.red }, activateButtonText: { color: '#fff', fontSize: 7, fontWeight: '700' },
  clearButton: { minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 4, backgroundColor: colors.forest, paddingHorizontal: 9, alignSelf: 'flex-start' }, clearButtonText: { color: '#fff', fontSize: 7, fontWeight: '700' },
  dispatchGuard: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, padding: 8, borderRadius: 4, backgroundColor: colors.redSoft }, dispatchGuardText: { flex: 1, color: '#944138', fontSize: 7, lineHeight: 11 },
  confirmPanel: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderColor: '#e9b8b3', borderRadius: 5, backgroundColor: '#fff7f6', padding: 10 }, confirmIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.redSoft }, confirmTitle: { color: colors.red, fontSize: 8, fontWeight: '700' }, confirmCopy: { color: '#765c59', fontSize: 7, lineHeight: 11, marginTop: 4 }, confirmCheck: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }, checkbox: { width: 13, height: 13, borderRadius: 3, borderWidth: 1, borderColor: '#b9a6a3', alignItems: 'center', justifyContent: 'center' }, checkboxChecked: { backgroundColor: colors.red, borderColor: colors.red }, confirmCheckText: { color: '#705b58', fontSize: 7 }, confirmRedButton: { minHeight: 27, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 8, borderRadius: 3, backgroundColor: colors.red, paddingHorizontal: 8 }, confirmRedButtonText: { color: '#fff', fontSize: 7, fontWeight: '700' }, buttonDisabled: { opacity: 0.45 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, statsGridNarrow: { gap: 5 }, statCard: { flexGrow: 1, flexBasis: '23%', minWidth: 105, minHeight: 65, borderRadius: 4, padding: 8 }, statGreen: { backgroundColor: colors.limeSoft }, statRed: { backgroundColor: colors.redSoft }, statYellow: { backgroundColor: colors.yellowSoft }, statBlue: { backgroundColor: colors.blueSoft }, statLabel: { color: '#718073', fontSize: 6, fontWeight: '700', letterSpacing: 0.4 }, statValue: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 5 }, statTotal: { color: colors.muted, fontSize: 9 },
  commandGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, commandGridNarrow: { flexDirection: 'column' }, commandMain: { flex: 1, minWidth: 0 }, commandRail: { width: 230, gap: 8 }, commandRailNarrow: { width: '100%' }, panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 10, marginBottom: 8 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginBottom: 8 }, panelTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 },
  floorplan: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: '#f8f9f6' }, roomTile: { minWidth: 72, minHeight: 42, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dfe5dc', borderRadius: 3, backgroundColor: colors.limeSoft }, roomTileMissing: { backgroundColor: colors.redSoft, borderColor: '#e5aaa5' }, roomTileUnreported: { backgroundColor: colors.yellowSoft, borderColor: '#ead59a' }, roomTileSelected: { borderColor: colors.forest, borderWidth: 2 }, roomTileLabel: { color: colors.ink, fontSize: 6, fontWeight: '700' }, roomTileCount: { color: colors.muted, fontSize: 5, marginTop: 3 },
  matrixHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, marginBottom: 4 }, resetLink: { color: colors.forest, fontSize: 6, fontWeight: '600' }, matrixRows: { borderTopWidth: 1, borderTopColor: '#edf0eb' }, studentRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#edf0eb' }, studentName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, studentMeta: { color: colors.muted, fontSize: 6, marginTop: 3 }, statusButtons: { flexDirection: 'row', gap: 3 }, statusButton: { minHeight: 21, justifyContent: 'center', borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 5 }, statusAccounted: { backgroundColor: colors.limeSoft }, statusMissing: { backgroundColor: colors.redSoft }, statusExtra: { backgroundColor: colors.yellowSoft }, statusButtonText: { color: '#737e75', fontSize: 5 }, statusButtonTextActive: { color: colors.ink, fontWeight: '700' },
  extraStudentForm: { flexDirection: 'row', gap: 4, marginTop: 8 }, extraNameInput: { flex: 1, height: 27, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, fontSize: 6 }, extraRoomInput: { width: 49, height: 27, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5, fontSize: 6 }, extraAddButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 3, backgroundColor: colors.forest, paddingHorizontal: 7 }, extraAddText: { color: '#fff', fontSize: 6 },
  staffRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, staffName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, staffMeta: { color: colors.muted, fontSize: 6, marginTop: 3 }, staffCheckButton: { minHeight: 23, justifyContent: 'center', borderRadius: 3, backgroundColor: colors.blueSoft, paddingHorizontal: 6 }, staffConfirmed: { backgroundColor: colors.limeSoft }, staffCheckText: { color: colors.forest, fontSize: 6, fontWeight: '600' }, staffEditor: { gap: 4, backgroundColor: '#f7f8f5', borderRadius: 4, padding: 7, marginTop: 7 }, staffInput: { height: 26, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, fontSize: 7 }, saveStaffButton: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 3, backgroundColor: colors.forest, marginTop: 3 }, saveStaffText: { color: '#fff', fontSize: 6, fontWeight: '600' },
  roomTileSecured: { backgroundColor: colors.limeSoft, borderColor: '#aec39b' }, triggerOff: { color: colors.red, fontSize: 5, fontWeight: '700' },
  presenceRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf0eb' }, presenceType: { color: '#5f6c62', fontSize: 7 }, presenceCount: { color: colors.ink, fontSize: 8, fontWeight: '700' },
  exportButton: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 3, backgroundColor: colors.limeSoft }, exportButtonText: { color: colors.forest, fontSize: 7, fontWeight: '600' }, safetyNote: { color: '#8b958d', fontSize: 6, lineHeight: 10, marginTop: 6 },
  eventPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 10 }, incidentStatus: { color: colors.red, fontSize: 6, fontWeight: '700', backgroundColor: colors.redSoft, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3 }, eventRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, eventDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7ea267' }, eventDotRed: { backgroundColor: colors.red }, eventDotYellow: { backgroundColor: colors.yellow }, eventTitle: { color: colors.ink, fontSize: 7, fontWeight: '600' }, eventDetail: { color: colors.muted, fontSize: 6, marginTop: 2 }, eventTime: { color: colors.muted, fontSize: 6 },
  emptyIncident: { minHeight: 210, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 18 }, emptyIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.limeSoft }, emptyTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 9 }, emptyCopy: { maxWidth: 360, color: colors.muted, fontSize: 7, lineHeight: 12, textAlign: 'center', marginTop: 5 }, footerText: { color: '#99a198', fontSize: 6, textAlign: 'center', fontWeight: '700', letterSpacing: 0.35 },
});