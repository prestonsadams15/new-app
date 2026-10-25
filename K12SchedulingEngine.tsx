import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Users,
} from 'lucide-react-native';

type Tier = 'elementary' | 'middle' | 'high';
export type SchedulingTier = Tier;
type Track = 1 | 2 | 3;
type Pupil = { id: string; name: string; grade: string; reading: Track; math: Track; behavior: Track; gender: string; iep: boolean; plan504: boolean; el: boolean; gt: boolean; avoid?: string[] };
type Course = { id: string; title: string; credits: number; subject: string; periods: number[]; required: boolean };

const colors = { ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', lime: '#c5e889', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6', orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df' };

const demoPupils: Pupil[] = [
  { id: 'e0', name: 'Mia Patel', grade: 'K', reading: 2, math: 2, behavior: 3, gender: 'F', iep: false, plan504: false, el: false, gt: false },
  { id: 'e9', name: 'Eli Rivera', grade: '1', reading: 1, math: 2, behavior: 2, gender: 'M', iep: true, plan504: false, el: false, gt: false },
  { id: 'e10', name: 'Chloe Wilson', grade: '2', reading: 3, math: 3, behavior: 2, gender: 'F', iep: false, plan504: false, el: false, gt: true },
  { id: 'e11', name: 'Leo Ahmed', grade: '3', reading: 2, math: 1, behavior: 1, gender: 'M', iep: false, plan504: true, el: false, gt: false },
  { id: 'e12', name: 'Ivy Morgan', grade: '4', reading: 1, math: 3, behavior: 2, gender: 'F', iep: false, plan504: false, el: true, gt: false },
  { id: 'e1', name: 'Maya Thompson', grade: '5', reading: 1, math: 2, behavior: 2, gender: 'F', iep: true, plan504: false, el: true, gt: false, avoid: ['e2'] },
  { id: 'e2', name: 'Ethan Chen', grade: '5', reading: 3, math: 3, behavior: 3, gender: 'M', iep: false, plan504: false, el: false, gt: true, avoid: ['e1'] },
  { id: 'e3', name: 'Ava Johnson', grade: '5', reading: 2, math: 1, behavior: 2, gender: 'F', iep: false, plan504: true, el: false, gt: false },
  { id: 'e4', name: 'Owen Brooks', grade: '5', reading: 1, math: 2, behavior: 1, gender: 'M', iep: true, plan504: false, el: false, gt: false },
  { id: 'e5', name: 'Lucy Garcia', grade: '5', reading: 3, math: 2, behavior: 2, gender: 'F', iep: false, plan504: false, el: true, gt: false },
  { id: 'e6', name: 'Amir Patel', grade: '5', reading: 2, math: 3, behavior: 3, gender: 'M', iep: false, plan504: false, el: false, gt: true },
  { id: 'e7', name: 'Nina Rivera', grade: '5', reading: 1, math: 1, behavior: 2, gender: 'F', iep: false, plan504: true, el: false, gt: false },
  { id: 'e8', name: 'Leo Kim', grade: '5', reading: 3, math: 2, behavior: 1, gender: 'M', iep: false, plan504: false, el: false, gt: false },
  { id: 'm0', name: 'Aiden Carter', grade: '6', reading: 1, math: 2, behavior: 2, gender: 'M', iep: false, plan504: false, el: true, gt: false },
  { id: 'm1', name: 'Sofia Martinez', grade: '7', reading: 2, math: 2, behavior: 2, gender: 'F', iep: true, plan504: false, el: false, gt: false },
  { id: 'm2', name: 'Noah Williams', grade: '7', reading: 3, math: 2, behavior: 3, gender: 'M', iep: false, plan504: true, el: false, gt: false },
  { id: 'm3', name: 'Elena Garcia', grade: '7', reading: 1, math: 3, behavior: 2, gender: 'F', iep: false, plan504: false, el: true, gt: false },
  { id: 'm4', name: 'Kai Brooks', grade: '7', reading: 2, math: 1, behavior: 1, gender: 'M', iep: true, plan504: false, el: false, gt: true },
  { id: 'm5', name: 'Mila Thompson', grade: '8', reading: 3, math: 2, behavior: 3, gender: 'F', iep: false, plan504: false, el: false, gt: true },
  { id: 'h1', name: 'Jordan Lee', grade: '9', reading: 3, math: 3, behavior: 3, gender: 'F', iep: false, plan504: false, el: false, gt: true },
  { id: 'h2', name: 'Mateo Cruz', grade: '9', reading: 2, math: 2, behavior: 2, gender: 'M', iep: true, plan504: false, el: false, gt: false },
  { id: 'h3', name: 'Zoe Wilson', grade: '9', reading: 1, math: 2, behavior: 3, gender: 'F', iep: false, plan504: true, el: false, gt: false },
  { id: 'h4', name: 'Isaac Chen', grade: '9', reading: 2, math: 1, behavior: 2, gender: 'M', iep: false, plan504: false, el: true, gt: false },
  { id: 'h5', name: 'Nora Brooks', grade: '10', reading: 2, math: 3, behavior: 2, gender: 'F', iep: false, plan504: true, el: false, gt: false },
  { id: 'h6', name: 'Mateo Patel', grade: '11', reading: 3, math: 1, behavior: 3, gender: 'M', iep: false, plan504: false, el: false, gt: false },
  { id: 'h7', name: 'Zara Ahmed', grade: '12', reading: 2, math: 2, behavior: 1, gender: 'F', iep: false, plan504: false, el: true, gt: false },
];

const highSchoolCourses: Course[] = [
  { id: 'eng-9', title: 'English 9', credits: 1, subject: 'English', periods: [1, 2], required: true },
  { id: 'alg-1', title: 'Algebra I', credits: 1, subject: 'Math', periods: [1, 3], required: true },
  { id: 'bio', title: 'Biology', credits: 1, subject: 'Science', periods: [2, 4], required: true },
  { id: 'world', title: 'World Geography', credits: 0.5, subject: 'Social studies', periods: [3, 5], required: true },
  { id: 'art', title: 'Visual Arts', credits: 0.5, subject: 'Elective', periods: [4, 6], required: false },
  { id: 'coding', title: 'Intro to Coding', credits: 0.5, subject: 'Elective', periods: [2, 6], required: false },
];

const gradeOptions = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const specialists = ['PE', 'Art', 'Music', 'Library', 'STEAM'];
const corePeriods = [1, 2, 3, 4, 5, 6];

function tierForGrade(grade: string): Tier {
  if (grade === 'K' || Number(grade) <= 5) return 'elementary';
  if (Number(grade) <= 8) return 'middle';
  return 'high';
}

function levelLabel(tier: Tier) {
  return tier === 'elementary' ? 'Elementary · K–5' : tier === 'middle' ? 'Middle school · 6–8' : 'High school · 9–12';
}

export function K12SchedulingEngine({ narrow, tier: routeTab }: { narrow: boolean; tier?: SchedulingTier }) {
  const [grade, setGrade] = useState(routeTab === 'middle' ? '7' : routeTab === 'high' ? '9' : '5');
  const [targetClassSize, setTargetClassSize] = useState('24');
  const [maxIepPercent, setMaxIepPercent] = useState('20');
  const [sectionCount, setSectionCount] = useState('3');
  const [homerooms, setHomerooms] = useState<Record<string, Record<string, string[]>>>({});
  const [placementNotes, setPlacementNotes] = useState('');
  const [pairingRule, setPairingRule] = useState(true);
  const [rotationName, setRotationName] = useState('5th Grade Specials Wheel');
  const [rotation, setRotation] = useState<Record<string, string[]>>({});
  const [flexSubject, setFlexSubject] = useState<'Reading' | 'Math'>('Reading');
  const [flexGroups, setFlexGroups] = useState<Record<string, string[]>>({});
  const [podAssignments, setPodAssignments] = useState<Record<string, string>>({});
  const [exploratoryCycle, setExploratoryCycle] = useState(['Art', 'Technology', 'Drama', 'Health']);
  const [selectedHighStudent, setSelectedHighStudent] = useState('h1');
  const [selectedRequests, setSelectedRequests] = useState<string[]>(['eng-9', 'alg-1', 'bio', 'world']);
  const [highSchedules, setHighSchedules] = useState<Record<string, { courseId: string; period: number }[]>>({});
  const [arenaSelections, setArenaSelections] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState('');

  const tier = tierForGrade(grade);
  const cohort = demoPupils.filter((pupil) => pupil.grade === grade);
  const middleCohort = demoPupils.filter((pupil) => ['6', '7', '8'].includes(pupil.grade));
  const highCohort = demoPupils.filter((pupil) => Number(pupil.grade) >= 9);
  const selectedHighPupil = highCohort.find((pupil) => pupil.id === selectedHighStudent) ?? highCohort[0];
  const assignedHighCourses = highSchedules[selectedHighStudent] ?? [];
  const earnedCreditsByStudent: Record<string, number> = { h1: 8, h2: 6, h3: 8, h4: 7, h5: 12, h6: 16, h7: 20 };
  const earnedCredits = earnedCreditsByStudent[selectedHighPupil.id] ?? 0;
  const requestedCourses = highSchoolCourses.filter((course) => selectedRequests.includes(course.id));
  const allocatedCredits = assignedHighCourses.reduce((total, item) => total + (highSchoolCourses.find((course) => course.id === item.courseId)?.credits ?? 0), 0);

  const balanceHomerooms = () => {
    const count = Math.max(1, Math.min(Number(sectionCount) || 1, Math.ceil(cohort.length / 2)));
    const target = Math.max(1, Number(targetClassSize) || 24);
    const cap = Math.min(target, Number(maxIepPercent) || 20);
    const buckets = Array.from({ length: count }, (_, index) => ({ name: `Homeroom ${String.fromCharCode(65 + index)}`, students: [] as Pupil[], reading: 0, math: 0, iep: 0, gender: { F: 0, M: 0 } }));
    const sorted = [...cohort].sort((a, b) => Number(b.iep || b.plan504 || b.el) - Number(a.iep || a.plan504 || a.el) || a.id.localeCompare(b.id));
    for (const pupil of sorted) {
      const eligible = buckets.filter((bucket) => bucket.students.length < target && (pupil.iep ? bucket.iep < Math.max(1, Math.floor(target * cap / 100)) : true) && !(pairingRule && pupil.avoid?.some((avoidId) => bucket.students.some((member) => member.id === avoidId))));
      const choices = eligible.length ? eligible : buckets.filter((bucket) => bucket.students.length < target);
      const destination = [...choices].sort((a, b) => {
        const score = (bucket: typeof a) => bucket.students.length * 4 + Math.abs(bucket.reading / Math.max(1, bucket.students.length) - pupil.reading) * 2 + Math.abs(bucket.math / Math.max(1, bucket.students.length) - pupil.math) * 2 + (pupil.gender === 'F' ? bucket.gender.F : bucket.gender.M);
        return score(a) - score(b);
      })[0];
      if (!destination) continue;
      destination.students.push(pupil); destination.reading += pupil.reading; destination.math += pupil.math;
      destination.iep += Number(pupil.iep || pupil.plan504); destination.gender[pupil.gender as 'F' | 'M'] += 1;
    }
    const result: Record<string, string[]> = {};
    buckets.forEach((bucket) => { result[bucket.name] = bucket.students.map((pupil) => pupil.id); });
    setHomerooms((current) => ({ ...current, [grade]: result }));
    setNotice(`${cohort.length} Grade ${grade} students balanced across ${count} homerooms. Review all placements before publishing.`);
  };

  const generateRotation = () => {
    const roomNames = Object.keys(homerooms[grade] ?? {}).length ? Object.keys(homerooms[grade]) : ['Homeroom A', 'Homeroom B', 'Homeroom C'];
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
    const next: Record<string, string[]> = {};
    roomNames.forEach((room, roomIndex) => {
      next[room] = days.map((_, dayIndex) => specialists[(dayIndex + roomIndex) % specialists.length]);
    });
    setRotation(next);
    setNotice(`${rotationName} generated for ${roomNames.length} homerooms over ${days.length} days. Check specialist capacity before publishing.`);
  };

  const generateFlexGroups = () => {
    const groups: Record<string, string[]> = { 'Tier 1 · Intensive': [], 'Tier 2 · Targeted': [], 'Tier 3 · Extension': [] };
    cohort.forEach((pupil) => {
      const tierValue = flexSubject === 'Reading' ? pupil.reading : pupil.math;
      groups[`Tier ${tierValue} · ${tierValue === 1 ? 'Intensive' : tierValue === 2 ? 'Targeted' : 'Extension'}`].push(pupil.id);
    });
    setFlexGroups(groups);
    setNotice(`${flexSubject} flex groups created for ${cohort.length} Grade ${grade} students. Confirm with the intervention team.`);
  };

  const assignPods = () => {
    const pods = ['Team Apex', 'Team Summit', 'Team Horizon'];
    const next: Record<string, string> = {};
    [...middleCohort].sort((a, b) => Number(b.iep || b.plan504) - Number(a.iep || a.plan504) || a.id.localeCompare(b.id)).forEach((pupil, index) => { next[pupil.id] = pods[index % pods.length]; });
    setPodAssignments(next);
    setNotice(`${middleCohort.length} middle-school students assigned across interdisciplinary pods. Review team capacity before publishing.`);
  };

  const generateHighSchedule = () => {
    const courseById = new Map(requestedCourses.map((course) => [course.id, course]));
    const periodOwners = new Map<number, string>();
    const sortedRequests = [...requestedCourses].sort((a, b) => Number(b.required) - Number(a.required)
      || selectedRequests.indexOf(a.id) - selectedRequests.indexOf(b.id)
      || a.periods.length - b.periods.length);
    let scheduledCreditTotal = 0;
    const assignPeriod = (course: Course, visited: Set<number>): boolean => {
      for (const period of course.periods) {
        if (visited.has(period)) continue;
        visited.add(period);
        const ownerId = periodOwners.get(period);
        const owner = ownerId ? courseById.get(ownerId) : undefined;
        if (!owner || assignPeriod(owner, visited)) {
          periodOwners.set(period, course.id);
          return true;
        }
      }
      return false;
    };
    sortedRequests.forEach((course) => {
      if (earnedCredits + scheduledCreditTotal + course.credits > 24) return;
      if (assignPeriod(course, new Set<number>())) scheduledCreditTotal += course.credits;
    });
    const schedule = [...periodOwners.entries()].map(([period, courseId]) => ({ courseId, period }));
    setHighSchedules((current) => ({ ...current, [selectedHighStudent]: schedule.sort((a, b) => a.period - b.period) }));
    setNotice(`${schedule.length} of ${requestedCourses.length} requested courses placed without period conflicts.`);
  };

  const toggleRequest = (courseId: string) => setSelectedRequests((current) => current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]);

  const reserveArenaCourse = (courseId: string) => {
    const course = highSchoolCourses.find((item) => item.id === courseId);
    if (!course) return;
    const existing = arenaSelections[selectedHighStudent] ?? [];
    if (existing.includes(courseId)) { setNotice(`${course.title} is already selected in the arena preview.`); return; }
    const currentSchedule = highSchedules[selectedHighStudent] ?? [];
    if (currentSchedule.some((assignment) => assignment.courseId === courseId)) { setNotice(`${course.title} is already on ${selectedHighPupil.name}'s schedule.`); return; }
    const period = course.periods.find((candidate) => !currentSchedule.some((item) => item.period === candidate));
    if (!period) { setNotice(`No conflict-free section remains for ${course.title}.`); return; }
    setArenaSelections((current) => ({ ...current, [selectedHighStudent]: [...(current[selectedHighStudent] ?? []), courseId] }));
    setHighSchedules((current) => ({ ...current, [selectedHighStudent]: [...(current[selectedHighStudent] ?? []), { courseId, period }].sort((a, b) => a.period - b.period) }));
    setNotice(`${course.title} reserved for Period ${period} in this local arena preview.`);
  };

  const tabs: { label: string; value: Tier }[] = [{ label: 'Elementary · K–5', value: 'elementary' }, { label: 'Middle · 6–8', value: 'middle' }, { label: 'High school · 9–12', value: 'high' }];
  const gradePicker = (values: string[]) => <View style={styles.gradePicker}>{values.map((item) => <Pressable key={item} onPress={() => { setGrade(item); setNotice(''); }} style={[styles.gradeChip, grade === item && styles.gradeChipSelected]}><Text style={[styles.gradeChipText, grade === item && styles.gradeChipTextSelected]}>{item}</Text></Pressable>)}</View>;

  return (
    <View style={styles.workspace}>
      <View style={styles.header}><View style={styles.headerIcon}><GraduationCap size={16} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>K–12 scheduling engine</Text><Text style={styles.headerSubtitle}>Tier-aware roster and schedule planning · Preview mode</Text></View><View style={styles.modelBadge}><Text style={styles.modelBadgeText}>{levelLabel(tier).toUpperCase()}</Text></View></View>
      {routeTab ? null : <View style={styles.tierTabs}>{tabs.map((item) => <Pressable key={item.value} onPress={() => { const nextGrade = item.value === 'elementary' ? '5' : item.value === 'middle' ? '7' : '9'; setGrade(nextGrade); setNotice(''); }} style={[styles.tierTab, tier === item.value && styles.tierTabSelected]}><Text style={[styles.tierTabText, tier === item.value && styles.tierTabTextSelected]}>{item.label}</Text></Pressable>)}</View>}
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      {tier === 'elementary' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Elementary cohort planner</Text><Text style={styles.panelSubtitle}>Balanced homerooms · specialist rotations · RTI flex grouping</Text></View><Users size={15} color={colors.forest} /></View>
        <Text style={styles.fieldLabel}>GRADE LEVEL</Text>{gradePicker(['K', '1', '2', '3', '4', '5'])}
        <View style={[styles.elementaryGrid, narrow && styles.elementaryGridNarrow]}>
          <View style={styles.engineCard}><Text style={styles.engineTitle}>Balanced homeroom builder</Text><Text style={styles.engineCopy}>Greedy cohort balancer spreads reading/math tiers, IEP/504/EL/GT service load, gender, and peer-separation flags. Review the result before committing.</Text>
            <View style={styles.configRow}><View style={styles.configField}><Text style={styles.fieldLabel}>HOMEROOMS</Text><TextInput value={sectionCount} onChangeText={setSectionCount} keyboardType="numeric" style={styles.configInput} /></View><View style={styles.configField}><Text style={styles.fieldLabel}>TARGET SIZE</Text><TextInput value={targetClassSize} onChangeText={setTargetClassSize} keyboardType="numeric" style={styles.configInput} /></View><View style={styles.configField}><Text style={styles.fieldLabel}>MAX IEP / 504 %</Text><TextInput value={maxIepPercent} onChangeText={setMaxIepPercent} keyboardType="numeric" style={styles.configInput} /></View></View>
            <Pressable onPress={() => setPairingRule(!pairingRule)} style={styles.ruleToggle}><View style={[styles.checkbox, pairingRule && styles.checkboxOn]}>{pairingRule ? <Check size={9} color="#fff" /> : null}</View><Text style={styles.ruleText}>Respect recorded separate / preferred peer relationships</Text></Pressable>
            <Pressable onPress={balanceHomerooms} style={styles.primaryButton}><Users size={12} color="#fff" /><Text style={styles.primaryButtonText}>Balance Grade {grade} cohort</Text><ArrowRight size={11} color="#fff" /></Pressable>
            {homerooms[grade] ? <View style={styles.resultsGrid}>{Object.entries(homerooms[grade]).map(([room, ids]) => { const members = demoPupils.filter((pupil) => ids.includes(pupil.id)); return <View key={room} style={styles.resultCard}><Text style={styles.resultTitle}>{room} · {members.length} students</Text>{members.map((pupil) => <Text key={pupil.id} style={styles.resultStudent}>{pupil.name} · R{pupil.reading}/M{pupil.math}{pupil.iep || pupil.plan504 ? ' · support' : ''}</Text>)}</View>; })}</View> : null}
            <View style={styles.transitionCard}><Text style={styles.engineTitle}>Teacher transition cards</Text><TextInput value={placementNotes} onChangeText={setPlacementNotes} placeholder="Add placement notes or peer relationship flags for next year" multiline style={styles.notesInput} /><Text style={styles.engineCopy}>Transition cards include sensitive notes; no notes are saved in this preview.</Text></View>
          </View>
          <View style={styles.engineCard}><Text style={styles.engineTitle}>Specialist rotation wheel</Text><TextInput value={rotationName} onChangeText={setRotationName} style={styles.configInput} /><Text style={styles.engineCopy}>Five-day cycle · PE, Art, Music, Library, STEAM</Text><Pressable onPress={generateRotation} style={styles.secondaryButton}><RotateCcw size={11} color={colors.forest} /><Text style={styles.secondaryButtonText}>Generate rotation</Text></Pressable>{Object.entries(rotation).map(([room, subjects]) => <View key={room} style={styles.rotationRow}><Text style={styles.rotationRoom}>{room}</Text><View style={styles.rotationDays}>{subjects.map((subject, index) => <View key={`${room}-${index}`} style={styles.rotationCell}><Text style={styles.rotationDay}>D{index + 1}</Text><Text style={styles.rotationSubject}>{subject}</Text></View>)}</View></View>)}<View style={styles.engineDivider} /><Text style={styles.engineTitle}>RTI / intervention flex groups</Text><View style={styles.modeRow}>{(['Reading', 'Math'] as const).map((subject) => <Pressable key={subject} onPress={() => setFlexSubject(subject)} style={[styles.modeChip, flexSubject === subject && styles.modeChipActive]}><Text style={[styles.modeChipText, flexSubject === subject && styles.modeChipTextActive]}>{subject}</Text></Pressable>)}</View><Pressable onPress={generateFlexGroups} style={styles.secondaryButton}><Users size={11} color={colors.forest} /><Text style={styles.secondaryButtonText}>Open 45-minute flex groups</Text></Pressable>{Object.entries(flexGroups).map(([name, ids]) => <View key={name} style={styles.flexGroup}><Text style={styles.flexGroupName}>{name}</Text><Text style={styles.flexGroupStudents}>{ids.map((id) => demoPupils.find((pupil) => pupil.id === id)?.name).join(' · ') || 'No students'}</Text></View>)}</View>
        </View>
      </View> : null}

      {tier === 'middle' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Middle school pod & rotation planner</Text><Text style={styles.panelSubtitle}>Core interdisciplinary teams · Exploratory loops · Advisory / WIN</Text></View><Layers size={15} color={colors.forest} /></View>
        <Text style={styles.fieldLabel}>GRADE LEVEL</Text>{gradePicker(['6', '7', '8'])}
        <View style={[styles.middleGrid, narrow && styles.elementaryGridNarrow]}>
          <View style={styles.engineCard}><Text style={styles.engineTitle}>Interdisciplinary pods</Text><Text style={styles.engineCopy}>Balance a grade cohort across core teams; check service-support load before final assignment.</Text><Pressable onPress={assignPods} style={styles.primaryButton}><Users size={12} color="#fff" /><Text style={styles.primaryButtonText}>Assign Grade 6–8 pods</Text></Pressable>{['Team Apex', 'Team Summit', 'Team Horizon'].map((pod) => { const members = middleCohort.filter((pupil) => podAssignments[pupil.id] === pod); return <View key={pod} style={styles.podRow}><View style={styles.podHeading}><Text style={styles.podName}>{pod}</Text><Text style={styles.podCount}>{members.length} students</Text></View>{members.map((member) => <Text key={member.id} style={styles.resultStudent}>{member.name} · Grade {member.grade}</Text>)}</View>; })}</View>
          <View style={styles.engineCard}><Text style={styles.engineTitle}>Exploratory rotation loop</Text><Text style={styles.engineCopy}>Quarter / trimester sequence for each cohort. Edit the loop by tapping a course chip.</Text><View style={styles.exploratoryLoop}>{exploratoryCycle.map((item, index) => <React.Fragment key={`${item}-${index}`}><Pressable onPress={() => setExploratoryCycle((current) => { const next = [...current]; next[index] = current[(index + 1) % current.length]; return next; })} style={styles.exploratoryChip}><Text style={styles.exploratoryTerm}>TERM {index + 1}</Text><Text style={styles.exploratoryName}>{item}</Text></Pressable>{index < exploratoryCycle.length - 1 ? <ArrowRight size={11} color={colors.muted} /> : null}</React.Fragment>)}</View><View style={styles.engineDivider} /><Text style={styles.engineTitle}>Advisory & WIN block</Text><View style={styles.winRow}><Text style={styles.winLabel}>Daily flexible block</Text><Text style={styles.winValue}>10:40–11:25 · 45 min</Text></View><Text style={styles.engineCopy}>Assign targeted intervention or enrichment groups after reviewing progress data.</Text><Pressable onPress={() => setNotice('WIN group preview opened. Student support placements are not committed.')} style={styles.secondaryButton}><Users size={11} color={colors.forest} /><Text style={styles.secondaryButtonText}>Preview WIN groups</Text></Pressable></View>
        </View>
      </View> : null}

      {tier === 'high' ? <View style={[styles.highGrid, narrow && styles.highGridNarrow]}>
        <View style={styles.highMain}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>High school master schedule</Text><Text style={styles.panelSubtitle}>Course requests · period conflict solver · graduation audit</Text></View><GraduationCap size={15} color={colors.forest} /></View>
          <Text style={styles.fieldLabel}>STUDENT</Text><View style={styles.gradePicker}>{highCohort.map((pupil) => <Pressable key={pupil.id} onPress={() => setSelectedHighStudent(pupil.id)} style={[styles.gradeChip, selectedHighStudent === pupil.id && styles.gradeChipSelected]}><Text style={[styles.gradeChipText, selectedHighStudent === pupil.id && styles.gradeChipTextSelected]}>{pupil.name}</Text></Pressable>)}</View>
          <View style={styles.creditAudit}><View><Text style={styles.creditLabel}>GRADUATION CREDIT AUDIT</Text><Text style={styles.creditValue}>{earnedCredits.toFixed(1)} <Text style={styles.creditTarget}>earned · {allocatedCredits.toFixed(1)} scheduled · {Math.max(0, 24 - earnedCredits - allocatedCredits).toFixed(1)} remaining of 24</Text></Text></View><View style={styles.creditTrack}><View style={[styles.creditFill, { width: `${Math.min(100, (earnedCredits + allocatedCredits) / 24 * 100)}%` }]} /></View></View>
          <Text style={styles.fieldLabel}>COURSE REQUESTS</Text>{highSchoolCourses.map((course) => <Pressable key={course.id} onPress={() => toggleRequest(course.id)} style={styles.courseRequest}><View style={[styles.checkbox, selectedRequests.includes(course.id) && styles.checkboxOn]}>{selectedRequests.includes(course.id) ? <Check size={9} color="#fff" /> : null}</View><View style={{ flex: 1 }}><Text style={styles.requestName}>{course.title}</Text><Text style={styles.requestMeta}>{course.subject} · {course.credits} credit · periods {course.periods.join(' / ')}{course.required ? ' · required' : ''}</Text></View></Pressable>)}
          <Pressable onPress={generateHighSchedule} style={styles.primaryButton}><CheckCircle2 size={12} color="#fff" /><Text style={styles.primaryButtonText}>Optimize requested schedule</Text></Pressable>
          <View style={styles.engineDivider} /><Text style={styles.engineTitle}>Conflict-free placement</Text>{assignedHighCourses.map((assignment) => { const course = highSchoolCourses.find((item) => item.id === assignment.courseId); return <View key={assignment.courseId} style={styles.scheduleAssignment}><Text style={styles.assignmentPeriod}>P{assignment.period}</Text><Text style={styles.assignmentCourse}>{course?.title}</Text><Text style={styles.assignmentCredits}>{course?.credits} cr</Text></View>; })}{assignedHighCourses.length === 0 ? <Text style={styles.engineCopy}>Generate a schedule to place requested courses into open periods.</Text> : null}
        </View></View>
        <View style={[styles.highRail, narrow && styles.highRailNarrow]}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Arena scheduling</Text><Text style={styles.panelSubtitle}>Student section-selection preview</Text></View><CalendarDays size={14} color={colors.forest} /></View><Text style={styles.engineCopy}>Select an open course request. The preview checks period conflicts before reserving a section.</Text>{highSchoolCourses.filter((course) => !course.required).map((course) => <View key={course.id} style={styles.arenaCourse}><View style={{ flex: 1 }}><Text style={styles.requestName}>{course.title}</Text><Text style={styles.requestMeta}>{course.credits} credit · periods {course.periods.join(' / ')}</Text></View><Pressable onPress={() => reserveArenaCourse(course.id)} style={styles.arenaButton}><Plus size={10} color={colors.forest} /><Text style={styles.arenaButtonText}>Select</Text></Pressable></View>)}<Text style={styles.engineDisclaimer}>Arena reservations are local previews; official enrollment and transcript credits require server validation.</Text></View></View>
      </View> : null}

      <Text style={styles.footerText}>K–12 SCHEDULING PREVIEW · SAMPLE COHORTS · ASSIGNMENTS ARE NOT PERSISTED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 8 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: '#fff' },
  headerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft },
  headerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 },
  modelBadge: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 3, backgroundColor: '#f0f2ee' }, modelBadgeText: { color: colors.muted, fontSize: 5, fontWeight: '700' },
  tierTabs: { flexDirection: 'row', gap: 4 }, tierTab: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 3, backgroundColor: '#e9ede7' }, tierTabSelected: { backgroundColor: colors.forest }, tierTabText: { color: '#657168', fontSize: 6 }, tierTabTextSelected: { color: '#fff', fontWeight: '700' },
  notice: { padding: 7, borderRadius: 3, backgroundColor: colors.limeSoft }, noticeText: { color: colors.forest, fontSize: 6, lineHeight: 10 },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9, marginBottom: 7 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 7 }, panelTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 },
  fieldLabel: { color: '#778279', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, marginTop: 6, marginBottom: 3 }, gradePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 }, gradeChip: { minWidth: 22, minHeight: 21, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderRadius: 3, backgroundColor: '#f0f2ee' }, gradeChipSelected: { backgroundColor: colors.forest }, gradeChipText: { color: colors.muted, fontSize: 5 }, gradeChipTextSelected: { color: '#fff', fontWeight: '700' },
  elementaryGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, elementaryGridNarrow: { flexDirection: 'column' }, engineCard: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 8, marginTop: 7 }, engineTitle: { color: colors.ink, fontSize: 7, fontWeight: '700' }, engineCopy: { color: colors.muted, fontSize: 6, lineHeight: 10, marginTop: 4 }, configRow: { flexDirection: 'row', gap: 5, marginTop: 7 }, configField: { flex: 1 }, configInput: { minHeight: 26, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5, fontSize: 6 },
  ruleToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }, checkbox: { width: 12, height: 12, borderWidth: 1, borderColor: '#bbc6bc', borderRadius: 2, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: colors.forest, borderColor: colors.forest }, ruleText: { color: '#67736a', fontSize: 5, flex: 1 },
  primaryButton: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 3, paddingHorizontal: 7, marginTop: 7, backgroundColor: colors.forest }, primaryButtonText: { color: '#fff', fontSize: 6, fontWeight: '600' },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }, resultCard: { flexGrow: 1, flexBasis: '30%', minWidth: 100, padding: 6, borderRadius: 3, backgroundColor: '#f4f7f1' }, resultTitle: { color: colors.forest, fontSize: 6, fontWeight: '700' }, resultStudent: { color: '#5f6a62', fontSize: 5, marginTop: 4 }, transitionCard: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 9, paddingTop: 7 }, notesInput: { minHeight: 45, borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 5, fontSize: 6, marginTop: 5 },
  secondaryButton: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 7, marginTop: 6, borderRadius: 3, backgroundColor: colors.limeSoft }, secondaryButtonText: { color: colors.forest, fontSize: 5, fontWeight: '600' }, rotationRow: { marginTop: 6 }, rotationRoom: { color: colors.ink, fontSize: 6, fontWeight: '600', marginBottom: 3 }, rotationDays: { flexDirection: 'row', gap: 3 }, rotationCell: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 3, backgroundColor: colors.blueSoft }, rotationDay: { color: '#71869a', fontSize: 4, fontWeight: '700' }, rotationSubject: { color: '#46677e', fontSize: 5, marginTop: 2 }, engineDivider: { height: 1, backgroundColor: colors.line, marginVertical: 9 }, modeRow: { flexDirection: 'row', gap: 4, marginTop: 5 }, modeChip: { minHeight: 23, justifyContent: 'center', paddingHorizontal: 7, borderRadius: 3, backgroundColor: '#f0f2ee' }, modeChipActive: { backgroundColor: colors.blueSoft }, modeChipText: { color: colors.muted, fontSize: 5 }, modeChipTextActive: { color: '#46677e', fontWeight: '700' }, flexGroup: { borderTopWidth: 1, borderTopColor: '#edf0eb', paddingVertical: 5 }, flexGroupName: { color: colors.forest, fontSize: 6, fontWeight: '700' }, flexGroupStudents: { color: colors.muted, fontSize: 5, lineHeight: 9, marginTop: 3 },
  middleGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, podRow: { borderTopWidth: 1, borderTopColor: '#edf0eb', paddingVertical: 6, marginTop: 4 }, podHeading: { flexDirection: 'row', justifyContent: 'space-between' }, podName: { color: colors.forest, fontSize: 6, fontWeight: '700' }, podCount: { color: colors.muted, fontSize: 5 }, exploratoryLoop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 7 }, exploratoryChip: { minWidth: 57, padding: 5, borderRadius: 3, backgroundColor: colors.blueSoft }, exploratoryTerm: { color: '#71869a', fontSize: 4, fontWeight: '700' }, exploratoryName: { color: '#46677e', fontSize: 5, fontWeight: '600', marginTop: 3 }, winRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, winLabel: { color: colors.ink, fontSize: 6, fontWeight: '600' }, winValue: { color: colors.forest, fontSize: 5 },
  highGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, highGridNarrow: { flexDirection: 'column' }, highMain: { flex: 1, minWidth: 0 }, highRail: { width: 220 }, highRailNarrow: { width: '100%' }, creditAudit: { padding: 8, marginVertical: 8, backgroundColor: '#f1f5ed', borderRadius: 4 }, creditLabel: { color: colors.muted, fontSize: 5, fontWeight: '700' }, creditValue: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 3 }, creditTarget: { color: colors.muted, fontSize: 6, fontWeight: '400' }, creditTrack: { height: 3, backgroundColor: '#e1e8dd', marginTop: 6, borderRadius: 2 }, creditFill: { height: 3, borderRadius: 2, backgroundColor: colors.forest },
  courseRequest: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, requestName: { color: colors.ink, fontSize: 6, fontWeight: '600' }, requestMeta: { color: colors.muted, fontSize: 5, marginTop: 2 }, scheduleAssignment: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb' }, assignmentPeriod: { width: 20, color: colors.forest, fontSize: 6, fontWeight: '700' }, assignmentCourse: { color: colors.ink, fontSize: 6, flex: 1 }, assignmentCredits: { color: colors.muted, fontSize: 5 }, arenaCourse: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, arenaButton: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 4, borderRadius: 3, backgroundColor: colors.limeSoft }, arenaButtonText: { color: colors.forest, fontSize: 5, fontWeight: '600' }, engineDisclaimer: { color: colors.muted, fontSize: 5, lineHeight: 9, marginTop: 7 },
  footerText: { color: '#99a198', fontSize: 5, fontWeight: '700', textAlign: 'center', marginTop: 1 },
});