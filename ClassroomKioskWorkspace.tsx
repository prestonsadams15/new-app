import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  Backpack,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Leaf,
  Music,
  Pizza,
  Search,
  ShieldAlert,
  Smile,
  Star,
  Sun,
  Users,
} from 'lucide-react-native';

type ViewTab = 'Door kiosk' | 'Cafeteria prep' | 'Office attendance';
export type KioskViewTab = ViewTab;
type IdentifyMode = 'Photo / name' | 'Personal icon' | 'QR badge' | '4-digit PIN';
type Meal = 'Hot lunch' | 'Cold lunch' | 'From home';
type Attendance = 'Present' | 'Tardy · excused' | 'Tardy · unexcused' | 'Absent · unaccounted';
type Student = {
  id: string;
  name: string;
  grade: string;
  room: string;
  initials: string;
  badgeCode: string;
  pin?: string;
  personalIcon?: string;
  allergy?: string;
};

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f',
  lime: '#c5e889', limeSoft: '#eef6e3', orange: '#d8774d', orangeSoft: '#fff0e9',
  blue: '#6e94b1', blueSoft: '#eaf1f6', yellow: '#d4a944', yellowSoft: '#fbf4df',
};

const students: Student[] = [
  { id: 's-01', name: 'Maya Thompson', grade: '4', room: '12', initials: 'MT', badgeCode: 'EV-0412', pin: '1832', allergy: 'Dairy · verify meal label' },
  { id: 's-02', name: 'Ethan Chen', grade: '2', room: '08', initials: 'EC', badgeCode: 'EV-0208', pin: '2048', personalIcon: 'Music' },
  { id: 's-03', name: 'Ava Johnson', grade: 'K', room: '03', initials: 'AJ', badgeCode: 'EV-K003', personalIcon: 'Star', allergy: 'Severe peanut allergy' },
  { id: 's-04', name: 'Lucy Garcia', grade: '1', room: '05', initials: 'LG', badgeCode: 'EV-0105', personalIcon: 'Smile' },
  { id: 's-05', name: 'Noah Williams', grade: '6', room: '21', initials: 'NW', badgeCode: 'EV-0621', pin: '6006' },
  { id: 's-06', name: 'Sofia Martinez', grade: '7', room: '18', initials: 'SM', badgeCode: 'EV-0718', pin: '7018' },
  { id: 's-07', name: 'Owen Brooks', grade: '3', room: '14', initials: 'OB', badgeCode: 'EV-0314', pin: '3014' },
  { id: 's-08', name: 'Nina Patel', grade: '5', room: '16', initials: 'NP', badgeCode: 'EV-0516', pin: '5016', allergy: 'Peanuts · severe reaction plan on file' },
];

const initialAttendance: Record<string, { status: Attendance; time?: string }> = {
  's-01': { status: 'Present', time: '8:14 AM' },
  's-02': { status: 'Present', time: '8:21 AM' },
  's-03': { status: 'Present', time: '8:08 AM' },
  's-04': { status: 'Present', time: '8:29 AM' },
  's-05': { status: 'Absent · unaccounted' },
  's-06': { status: 'Absent · unaccounted' },
  's-07': { status: 'Tardy · excused', time: '8:56 AM' },
  's-08': { status: 'Present', time: '8:18 AM' },
};

const initialMeals: Record<string, Meal> = {
  's-01': 'Cold lunch', 's-02': 'Hot lunch', 's-03': 'From home', 's-04': 'Hot lunch', 's-08': 'Hot lunch',
};

const initialCounts: Record<Meal, number> = { 'Hot lunch': 342, 'Cold lunch': 88, 'From home': 126 };

const formatMinute = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function ClassroomKioskWorkspace({ narrow, tab: routeTab, onTabChange }: { narrow: boolean; tab?: KioskViewTab; onTabChange?: (tab: KioskViewTab) => void }) {
  const [localTab, setLocalTab] = useState<ViewTab>(routeTab ?? 'Door kiosk');
  const tab = routeTab ?? localTab;
  const setTab = (next: ViewTab) => { setLocalTab(next); onTabChange?.(next); };
  const [mode, setMode] = useState<IdentifyMode>('Photo / name');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [meals, setMeals] = useState(initialMeals);
  const [mealAdjustments, setMealAdjustments] = useState<Record<Meal, number>>({ 'Hot lunch': 0, 'Cold lunch': 0, 'From home': 0 });
  const [mealChoice, setMealChoice] = useState<Meal | null>(null);
  const [pin, setPin] = useState('');
  const [badgeCode, setBadgeCode] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [guardianAlerts, setGuardianAlerts] = useState<string[]>([]);
  const [tardyChoice, setTardyChoice] = useState<'Tardy · excused' | 'Tardy · unexcused'>('Tardy · excused');

  const filteredStudents = useMemo(() => students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const lunchCounts = useMemo(() => {
    return {
      'Hot lunch': initialCounts['Hot lunch'] + mealAdjustments['Hot lunch'],
      'Cold lunch': initialCounts['Cold lunch'] + mealAdjustments['Cold lunch'],
      'From home': initialCounts['From home'] + mealAdjustments['From home'],
    };
  }, [mealAdjustments]);
  const absentStudents = students.filter((student) => attendance[student.id]?.status === 'Absent · unaccounted');

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setMealChoice(meals[student.id] ?? null);
    setNotice('');
  };

  const identifyByPin = () => {
    if (pin.length !== 4) { setNotice('Enter a 4-digit student PIN.'); return; }
    const student = students.find((item) => item.pin === pin);
    setPin('');
    if (!student) { setNotice('No student matched that PIN. Ask the front office for help.'); return; }
    selectStudent(student);
  };

  const identifyByBadge = () => {
    const student = students.find((item) => item.badgeCode.toLowerCase() === badgeCode.trim().toLowerCase());
    setBadgeCode('');
    if (!student) { setNotice('Badge not found in the sample class roster.'); return; }
    selectStudent(student);
  };

  const confirmCheckIn = () => {
    if (!selectedStudent || !mealChoice) { setNotice('Choose a lunch option to finish check-in.'); return; }
    const time = formatMinute(new Date());
    setAttendance((current) => ({ ...current, [selectedStudent.id]: { status: 'Present', time } }));
    const previousMeal = meals[selectedStudent.id];
    if (previousMeal !== mealChoice) {
      setMealAdjustments((current) => ({
        ...current,
        ...(previousMeal ? { [previousMeal]: current[previousMeal] - 1 } : {}),
        [mealChoice]: current[mealChoice] + 1,
      }));
    }
    setMeals((current) => ({ ...current, [selectedStudent.id]: mealChoice }));
    setNotice(`${selectedStudent.name} checked in Present at ${time}. Lunch choice sent to the local cafeteria preview.`);
    setSelectedStudent(null);
    setMealChoice(null);
  };

  const markTardy = (student: Student) => {
    const time = formatMinute(new Date());
    setAttendance((current) => ({ ...current, [student.id]: { status: tardyChoice, time } }));
    setNotice(`${student.name} marked ${tardyChoice.toLowerCase()} at ${time}.`);
  };

  const queueGuardianNotice = (student: Student) => {
    setGuardianAlerts((current) => current.includes(student.id) ? current : [...current, student.id]);
    setNotice(`Guardian text preview queued for ${student.name}. No SMS was sent.`);
  };

  const tabs: ViewTab[] = ['Door kiosk', 'Cafeteria prep', 'Office attendance'];
  const modes: IdentifyMode[] = ['Photo / name', 'Personal icon', 'QR badge', '4-digit PIN'];
  const iconOptions = [
    { name: 'Star', icon: Star, studentId: 's-03' },
    { name: 'Smile', icon: Smile, studentId: 's-04' },
    { name: 'Music', icon: Music, studentId: 's-02' },
    { name: 'Sun', icon: Sun, studentId: 's-01' },
  ];

  return (
    <View style={styles.workspace}>
      <View style={styles.workspaceHeader}>
        <View style={styles.headerIcon}><Clock3 size={17} color={colors.forest} /></View>
        <View style={{ flex: 1 }}><Text style={styles.workspaceTitle}>Morning operations</Text><Text style={styles.workspaceSubtitle}>Evergreen Elementary · Monday, October 19</Text></View>
        <View style={styles.livePill}><View style={styles.livePillDot} /><Text style={styles.livePillText}>SAMPLE DATA</Text></View>
      </View>

      {routeTab ? null : <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewTabs}>
        {tabs.map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => { setTab(item); setNotice(''); }} style={[styles.viewTab, tab === item && styles.viewTabSelected]}><Text style={[styles.viewTabText, tab === item && styles.viewTabTextSelected]}>{item}</Text></Pressable>)}
      </ScrollView></>}

      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      {tab === 'Door kiosk' ? <View style={[styles.doorLayout, narrow && styles.doorLayoutNarrow]}>
        <View style={styles.doorMain}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Classroom door check-in</Text><Text style={styles.panelSubtitle}>Room 12 · Choose an identification method</Text></View><View style={styles.secureBadge}><ShieldAlert size={13} color={colors.forest} /><Text style={styles.secureBadgeText}>KIOSK</Text></View></View>
            <View style={styles.ageNotice}><Text style={styles.ageNoticeText}>K–2: use a photo, icon, or badge · Grades 3–12: photo/name or 4-digit PIN</Text></View>
            <View style={styles.modeTabs}>{modes.map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: mode === item }} onPress={() => { setMode(item); setNotice(''); }} style={[styles.modeTab, mode === item && styles.modeTabSelected]}><Text style={[styles.modeTabText, mode === item && styles.modeTabTextSelected]}>{item}</Text></Pressable>)}</View>

            {mode === 'Photo / name' ? <>
              <View style={styles.searchBox}><Search size={14} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Find a student" placeholderTextColor="#929c94" style={styles.searchInput} /></View>
              <View style={styles.studentGrid}>{filteredStudents.map((student) => {
                const status = attendance[student.id];
                return <Pressable key={student.id} onPress={() => selectStudent(student)} style={[styles.studentTile, selectedStudent?.id === student.id && styles.studentTileSelected]}>
                  <View style={[styles.studentAvatar, student.grade === 'K' || student.grade === '1' || student.grade === '2' ? styles.youngAvatar : null]}><Text style={styles.studentInitials}>{student.initials}</Text></View>
                  <Text numberOfLines={1} style={styles.studentTileName}>{student.name}</Text><Text style={styles.studentTileMeta}>Grade {student.grade}</Text>
                  {status?.status === 'Present' ? <View style={styles.presentChip}><Check size={9} color={colors.forest} /><Text style={styles.presentChipText}>{status.time}</Text></View> : null}
                  {student.allergy ? <View style={styles.allergyMark}><ShieldAlert size={9} color={colors.orange} /><Text style={styles.allergyMarkText}>ALERT</Text></View> : null}
                </Pressable>;
              })}</View>
            </> : mode === 'Personal icon' ? <View style={styles.identifyForm}><Text style={styles.scanTitle}>Choose your classroom icon</Text><Text style={styles.scanCopy}>K–2 students can check in with their familiar personal icon.</Text><View style={styles.personalIconGrid}>{iconOptions.map(({ name, icon: Icon, studentId }) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${name} icon`} onPress={() => { const student = students.find((item) => item.id === studentId); if (student) selectStudent(student); }} style={styles.personalIconButton}><View style={styles.personalIconCircle}><Icon size={21} color={colors.forest} /></View><Text style={styles.personalIconLabel}>{name}</Text></Pressable>)}</View></View>
              : mode === 'QR badge' ? <View style={styles.identifyForm}><View style={styles.scanIcon}><CheckCircle2 size={22} color={colors.forest} /></View><Text style={styles.scanTitle}>Scan or enter student badge</Text><Text style={styles.scanCopy}>Camera scanning is not connected in this demo. Enter a sample badge code from the roster.</Text><TextInput value={badgeCode} onChangeText={setBadgeCode} autoCapitalize="characters" placeholder="Example: EV-K003" style={styles.identifyInput} /><Pressable onPress={identifyByBadge} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Find student</Text><ArrowRight size={14} color="#fff" /></Pressable></View>
              : <View style={styles.identifyForm}><View style={styles.scanIcon}><Text style={styles.pinSymbol}>••••</Text></View><Text style={styles.scanTitle}>Enter your 4-digit PIN</Text><Text style={styles.scanCopy}>For students in grades 3–12. Ask your teacher if you need help.</Text><TextInput value={pin} onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="4-digit PIN" style={styles.pinInput} /><Pressable onPress={identifyByPin} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Continue</Text><ArrowRight size={14} color="#fff" /></Pressable></View>}
          </View>

          {selectedStudent ? <View style={styles.checkInTile}>
            <View style={styles.checkInHeader}><View><Text style={styles.panelTitle}>Good morning, {selectedStudent.name.split(' ')[0]}!</Text><Text style={styles.panelSubtitle}>Grade {selectedStudent.grade} · Room {selectedStudent.room}</Text></View><Pressable onPress={() => { setSelectedStudent(null); setMealChoice(null); }} style={styles.cancelButton}><Text style={styles.cancelText}>Change</Text></Pressable></View>
            {selectedStudent.allergy ? <View style={styles.allergyAlert}><ShieldAlert size={14} color="#a84b36" /><View style={{ flex: 1 }}><Text style={styles.allergyTitle}>Dietary alert</Text><Text style={styles.allergyCopy}>{selectedStudent.allergy}. Cafeteria staff should confirm ingredients before serving.</Text></View></View> : null}
            <Text style={styles.lunchHeading}>Choose lunch for today</Text>
            <View style={styles.lunchGrid}>{([
              { label: 'Hot lunch', detail: 'Pizza', icon: Pizza, tone: styles.hotLunch },
              { label: 'Cold lunch', detail: 'Salad', icon: Leaf, tone: styles.coldLunch },
              { label: 'From home', detail: 'Brought from home', icon: Backpack, tone: styles.homeLunch },
            ] as const).map(({ label, detail, icon: Icon, tone }) => <Pressable key={label} accessibilityRole="radio" accessibilityState={{ selected: mealChoice === label }} onPress={() => setMealChoice(label)} style={[styles.lunchOption, tone, mealChoice === label && styles.lunchOptionSelected]}><Icon size={19} color={colors.forest} /><Text style={styles.lunchOptionTitle}>{label}</Text><Text style={styles.lunchOptionDetail}>{detail}</Text></Pressable>)}</View>
            <Pressable onPress={confirmCheckIn} style={[styles.confirmButton, !mealChoice && styles.confirmButtonDisabled]}><CheckCircle2 size={15} color="#fff" /><Text style={styles.confirmButtonText}>Confirm attendance & lunch</Text></Pressable>
          </View> : null}
        </View>

        <View style={[styles.doorRail, narrow && styles.doorRailNarrow]}>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Room 12 roster</Text><Text style={styles.panelSubtitle}>Presence updates locally</Text></View><Users size={15} color={colors.forest} /></View>
            {students.filter((student) => student.room === '12').map((student) => <View key={student.id} style={styles.rosterRow}><View style={[styles.rosterDot, attendance[student.id]?.status === 'Present' && styles.rosterDotPresent, attendance[student.id]?.status.includes('Tardy') && styles.rosterDotTardy]} /><Text style={styles.rosterName}>{student.name}</Text><Text style={styles.rosterStatus}>{attendance[student.id]?.status === 'Present' ? attendance[student.id]?.time : attendance[student.id]?.status === 'Absent · unaccounted' ? 'Not checked in' : attendance[student.id]?.status}</Text></View>)}
            <View style={styles.dispatchNote}><Text style={styles.dispatchNoteTitle}>Teacher seating chart</Text><Text style={styles.dispatchNoteCopy}>Checked-in students appear present in this sample roster. Live seating-chart dispatch is not connected.</Text></View>
          </View>
          <View style={styles.localNote}><Text style={styles.localNoteText}>Demo only · No student record, meal order, or attendance event is sent to a school system.</Text></View>
        </View>
      </View> : null}

      {tab === 'Cafeteria prep' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Cafeteria prep counts</Text><Text style={styles.panelSubtitle}>Evergreen Elementary · Meal selections today</Text></View><View style={styles.prepDeadline}><Clock3 size={12} color={colors.forest} /><Text style={styles.prepDeadlineText}>Cutoff · 8:45 AM</Text></View></View>
        <View style={[styles.mealTotals, narrow && styles.mealTotalsNarrow]}>
          {([
            { meal: 'Hot lunch' as Meal, detail: 'Pizza', count: lunchCounts['Hot lunch'], icon: Pizza, tone: styles.hotLunch },
            { meal: 'Cold lunch' as Meal, detail: 'Salad', count: lunchCounts['Cold lunch'], icon: Leaf, tone: styles.coldLunch },
            { meal: 'From home' as Meal, detail: 'Brought from home', count: lunchCounts['From home'], icon: Backpack, tone: styles.homeLunch },
          ]).map(({ meal, detail, count, icon: Icon, tone }) => <View key={meal} style={[styles.mealTotalCard, tone]}><Icon size={19} color={colors.forest} /><Text style={styles.mealTotalCount}>{count}</Text><Text style={styles.mealTotalName}>{meal}</Text><Text style={styles.mealTotalDetail}>{detail}</Text></View>)}
        </View>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Dietary alerts · register line</Text><Text style={styles.panelSubtitle}>Review before serving meals</Text></View><View style={styles.alertCounter}><Text style={styles.alertCounterText}>{students.filter((student) => student.allergy).length}</Text></View></View>
        {students.filter((student) => student.allergy).map((student) => <View key={student.id} style={styles.dietaryRow}><View style={styles.allergyIcon}><ShieldAlert size={14} color={colors.orange} /></View><View style={{ flex: 1 }}><Text style={styles.dietaryStudent}>{student.name} · Grade {student.grade}</Text><Text style={styles.dietaryDetail}>{student.allergy}</Text></View><Text style={styles.reviewTag}>VERIFY</Text></View>)}
        <Text style={styles.localNoteText}>Building counts are illustrative sample numbers. Live cafeteria POS, meal orders, and dietary records are not connected.</Text>
      </View> : null}

      {tab === 'Office attendance' ? <View style={[styles.officeLayout, narrow && styles.officeLayoutNarrow]}>
        <View style={styles.officeMain}><View style={styles.panel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Secretary attendance console</Text><Text style={styles.panelSubtitle}>Today · Evergreen Elementary</Text></View><View style={styles.officeDeadline}><Clock3 size={12} color={colors.forest} /><Text style={styles.officeDeadlineText}>Reconcile by 9:00 AM</Text></View></View>
          <View style={styles.tardyChoices}>{(['Tardy · excused', 'Tardy · unexcused'] as const).map((status) => <Pressable key={status} onPress={() => setTardyChoice(status)} style={[styles.tardyChoice, tardyChoice === status && styles.tardyChoiceSelected]}><Text style={[styles.tardyChoiceText, tardyChoice === status && styles.tardyChoiceTextSelected]}>{status}</Text></Pressable>)}</View>
          {students.map((student) => { const record = attendance[student.id]; return <View key={student.id} style={styles.officeStudentRow}><View style={{ flex: 1 }}><Text style={styles.officeStudentName}>{student.name}</Text><Text style={styles.officeStudentMeta}>Grade {student.grade} · Room {student.room}{student.allergy ? ' · Dietary alert' : ''}</Text></View><Text style={[styles.officeStatus, record.status.includes('Absent') && styles.officeStatusAbsent, record.status.includes('Tardy') && styles.officeStatusTardy]}>{record.status}{record.time ? ` · ${record.time}` : ''}</Text>{record.status.includes('Absent') ? <Pressable onPress={() => markTardy(student)} style={styles.smallAction}><Text style={styles.smallActionText}>Check in</Text></Pressable> : null}</View>; })}
        </View></View>
        <View style={[styles.officeRail, narrow && styles.officeRailNarrow]}>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Unaccounted students</Text><Text style={styles.panelSubtitle}>Guardian contact preview</Text></View><View style={styles.alertCounter}><Text style={styles.alertCounterText}>{absentStudents.length}</Text></View></View>
            {absentStudents.map((student) => <View key={student.id} style={styles.absentCard}><View style={{ flex: 1 }}><Text style={styles.officeStudentName}>{student.name}</Text><Text style={styles.officeStudentMeta}>Grade {student.grade} · Room {student.room}</Text></View><Pressable onPress={() => queueGuardianNotice(student)} style={styles.smsButton}><Bell size={12} color={colors.forest} /><Text style={styles.smsButtonText}>{guardianAlerts.includes(student.id) ? 'Queued' : 'Preview SMS'}</Text></Pressable></View>)}
            <Text style={styles.disclaimer}>Guardian notification is a preview; no Twilio SMS is sent. Confirm attendance and emergency procedures with the school office.</Text>
          </View>
        </View>
      </View> : null}

      <Text style={styles.footerText}>SAMPLE OPERATIONS · LOCAL STATE ONLY · NO LIVE ATTENDANCE, MEAL, POS, OR GUARDIAN DISPATCH</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 10 },
  workspaceHeader: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9 },
  headerIcon: { width: 30, height: 30, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.limeSoft },
  workspaceTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  workspaceSubtitle: { color: colors.muted, fontSize: 8, marginTop: 3 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0f2ee', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 5 },
  livePillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.yellow },
  livePillText: { color: '#777f78', fontSize: 6, fontWeight: '700' },
  viewTabs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewTab: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 4, backgroundColor: '#e9ede7' },
  viewTabSelected: { backgroundColor: colors.forest },
  viewTabText: { color: '#637067', fontSize: 8, fontWeight: '600' },
  viewTabTextSelected: { color: '#fff' },
  notice: { padding: 8, backgroundColor: colors.limeSoft, borderRadius: 4 },
  noticeText: { color: colors.forest, fontSize: 8, lineHeight: 12 },
  doorLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  doorLayoutNarrow: { flexDirection: 'column' },
  doorMain: { flex: 1, minWidth: 0 },
  doorRail: { width: 230, gap: 9 },
  doorRailNarrow: { width: '100%' },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 12, marginBottom: 9 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 },
  panelTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  panelSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, backgroundColor: colors.limeSoft, paddingHorizontal: 6, paddingVertical: 4 },
  secureBadgeText: { color: colors.forest, fontSize: 6, fontWeight: '700' },
  ageNotice: { padding: 7, borderRadius: 3, backgroundColor: colors.blueSoft, marginBottom: 8 },
  ageNoticeText: { color: '#526e82', fontSize: 7, lineHeight: 11 },
  modeTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 9 },
  modeTab: { minHeight: 27, justifyContent: 'center', paddingHorizontal: 7, borderRadius: 3, backgroundColor: '#f0f2ee' },
  modeTabSelected: { backgroundColor: '#e8f0e2' },
  modeTabText: { color: '#707b73', fontSize: 7 },
  modeTabTextSelected: { color: colors.forest, fontWeight: '700' },
  searchBox: { height: 31, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 7, marginBottom: 8 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 8 },
  studentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  studentTile: { width: 105, minHeight: 95, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 7, backgroundColor: '#fff' },
  studentTileSelected: { borderColor: colors.forest, backgroundColor: '#f5f8f2' },
  studentAvatar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.blueSoft },
  youngAvatar: { backgroundColor: colors.yellowSoft },
  studentInitials: { color: colors.forest, fontSize: 9, fontWeight: '700' },
  studentTileName: { color: colors.ink, fontSize: 7, fontWeight: '600', marginTop: 5 },
  studentTileMeta: { color: colors.muted, fontSize: 6, marginTop: 2 },
  presentChip: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  presentChipText: { color: colors.forest, fontSize: 6 },
  allergyMark: { position: 'absolute', top: 4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 2 },
  allergyMarkText: { color: colors.orange, fontSize: 5, fontWeight: '700' },
  identifyForm: { alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12 },
  scanIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { color: colors.ink, fontSize: 10, fontWeight: '700', marginTop: 9 },
  scanCopy: { maxWidth: 280, color: colors.muted, fontSize: 7, lineHeight: 11, textAlign: 'center', marginTop: 5 },
  identifyInput: { width: '100%', maxWidth: 260, minHeight: 32, marginTop: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 8, fontSize: 8 },
  primaryButton: { minHeight: 32, minWidth: 125, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingHorizontal: 10, borderRadius: 4, backgroundColor: colors.forest },
  primaryButtonText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  pinSymbol: { color: colors.forest, fontSize: 11, letterSpacing: 2 },
  pinInput: { width: 140, height: 39, marginTop: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 4, textAlign: 'center', letterSpacing: 4, fontSize: 15 },
  personalIconGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 },
  personalIconButton: { width: 72, minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: '#fff' },
  personalIconCircle: { width: 37, height: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.limeSoft },
  personalIconLabel: { color: colors.muted, fontSize: 6 },
  checkInTile: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cfddc5', borderRadius: 5, padding: 12, marginTop: 1 },
  checkInHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cancelButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 4 },
  cancelText: { color: colors.muted, fontSize: 7 },
  allergyAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: colors.orangeSoft, borderRadius: 4, padding: 8, marginTop: 9 },
  allergyTitle: { color: '#9f513b', fontSize: 7, fontWeight: '700' },
  allergyCopy: { color: '#915d49', fontSize: 7, lineHeight: 11, marginTop: 3 },
  lunchHeading: { color: colors.ink, fontSize: 9, fontWeight: '700', marginTop: 11, marginBottom: 7 },
  lunchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lunchOption: { flexGrow: 1, flexBasis: '30%', minWidth: 105, minHeight: 74, alignItems: 'flex-start', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 8 },
  hotLunch: { backgroundColor: '#fff4ea' },
  coldLunch: { backgroundColor: '#eef5ec' },
  homeLunch: { backgroundColor: '#edf3f7' },
  lunchOptionSelected: { borderColor: colors.forest, borderWidth: 2 },
  lunchOptionTitle: { color: colors.ink, fontSize: 7, fontWeight: '700', marginTop: 4 },
  lunchOptionDetail: { color: colors.muted, fontSize: 6, marginTop: 2 },
  confirmButton: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 9, borderRadius: 4, backgroundColor: colors.forest },
  confirmButtonDisabled: { opacity: 0.55 },
  confirmButtonText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  rosterRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  rosterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d9dfd8' },
  rosterDotPresent: { backgroundColor: '#82a86b' },
  rosterDotTardy: { backgroundColor: colors.yellow },
  rosterName: { color: colors.ink, fontSize: 7, flex: 1 },
  rosterStatus: { color: colors.muted, fontSize: 6 },
  dispatchNote: { backgroundColor: '#f2f6ee', padding: 8, borderRadius: 4, marginTop: 8 },
  dispatchNoteTitle: { color: colors.forest, fontSize: 7, fontWeight: '700' },
  dispatchNoteCopy: { color: '#748077', fontSize: 6, lineHeight: 10, marginTop: 3 },
  localNote: { padding: 8, backgroundColor: '#f0f2ee', borderRadius: 4 },
  localNoteText: { color: '#7c867e', fontSize: 7, lineHeight: 11 },
  prepDeadline: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.limeSoft, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4 },
  prepDeadlineText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  mealTotals: { flexDirection: 'row', gap: 7, marginBottom: 15 },
  mealTotalsNarrow: { flexDirection: 'column' },
  mealTotalCard: { flex: 1, minHeight: 110, alignItems: 'flex-start', justifyContent: 'center', borderRadius: 5, padding: 11 },
  mealTotalCount: { color: colors.ink, fontSize: 22, fontWeight: '700', marginTop: 7 },
  mealTotalName: { color: colors.ink, fontSize: 8, fontWeight: '700', marginTop: 2 },
  mealTotalDetail: { color: colors.muted, fontSize: 7, marginTop: 3 },
  alertCounter: { minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.orangeSoft },
  alertCounterText: { color: colors.orange, fontSize: 8, fontWeight: '700' },
  dietaryRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  allergyIcon: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.orangeSoft },
  dietaryStudent: { color: colors.ink, fontSize: 8, fontWeight: '600' },
  dietaryDetail: { color: '#9a5944', fontSize: 7, marginTop: 3 },
  reviewTag: { color: '#9a5944', fontSize: 6, fontWeight: '700', backgroundColor: colors.orangeSoft, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3 },
  officeLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  officeLayoutNarrow: { flexDirection: 'column' },
  officeMain: { flex: 1, minWidth: 0 },
  officeRail: { width: 245 },
  officeRailNarrow: { width: '100%' },
  officeDeadline: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.yellowSoft, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4 },
  officeDeadlineText: { color: '#8b702e', fontSize: 6, fontWeight: '600' },
  tardyChoices: { flexDirection: 'row', gap: 5, marginBottom: 7 },
  tardyChoice: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 7, borderRadius: 3, backgroundColor: '#f0f2ee' },
  tardyChoiceSelected: { backgroundColor: colors.yellowSoft },
  tardyChoiceText: { color: colors.muted, fontSize: 7 },
  tardyChoiceTextSelected: { color: '#8b702e', fontWeight: '700' },
  officeStudentRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  officeStudentName: { color: colors.ink, fontSize: 7, fontWeight: '600' },
  officeStudentMeta: { color: colors.muted, fontSize: 6, marginTop: 3 },
  officeStatus: { color: colors.forest, fontSize: 6, maxWidth: 105 },
  officeStatusAbsent: { color: colors.orange },
  officeStatusTardy: { color: '#8b702e' },
  smallAction: { minHeight: 25, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 3, backgroundColor: colors.forest },
  smallActionText: { color: '#fff', fontSize: 6, fontWeight: '600' },
  absentCard: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  smsButton: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 5, borderRadius: 3, backgroundColor: colors.limeSoft },
  smsButtonText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  disclaimer: { color: '#89938b', fontSize: 7, lineHeight: 11, marginTop: 9 },
  footerText: { color: '#99a198', fontSize: 6, fontWeight: '700', textAlign: 'center', marginTop: 2, letterSpacing: 0.4 },
});