import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  FileText,
  MoveRight,
  Plus,
  Search,
  Share2,
} from 'lucide-react-native';

type ViewMode = 'Week' | 'Day' | 'Month' | 'Class';
type ScheduleRule = 'Fixed' | 'A/B block' | 'Rotating';
type Lesson = {
  id: string;
  day: number;
  period: number;
  className: string;
  title: string;
  objective: string;
  warmUp: string;
  instruction: string;
  practice: string;
  accommodations: string;
  homework: string;
  standard: string;
  standardDescription: string;
  stage: 'Taught' | 'Practiced' | 'Assessed';
  span: number;
  visibleToSubstitute: boolean;
};

const colors = { ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', lime: '#c5e889', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6', yellow: '#d4a944', yellowSoft: '#fbf4df', orange: '#d8774d' };
const weekdays = ['Mon · Oct 19', 'Tue · Oct 20', 'Wed · Oct 21', 'Thu · Oct 22', 'Fri · Oct 23'];
const periods = [1, 2, 3, 4, 5];
const classes = ['Math · Grade 5', 'Science · Grade 5', 'Advisory', 'Reading · Grade 5'];
const standards = [
  { code: 'USBE.MATH.5.NBT.1', description: 'Recognize that in a multi-digit number, a digit in one place represents 10 times as much as in the place to its right.', subject: 'Mathematics' },
  { code: 'CCSS.MATH.5.NBT.5', description: 'Fluently multiply multi-digit whole numbers using the standard algorithm.', subject: 'Mathematics' },
  { code: 'USBE.SCI.5.1', description: 'Develop a model to describe that matter is made of particles too small to be seen.', subject: 'Science' },
  { code: 'NGSS.5-PS1-1', description: 'Develop a model to describe that matter is made of particles too small to be seen.', subject: 'Science' },
  { code: 'CCSS.ELA-LITERACY.RI.5.2', description: 'Determine two or more main ideas of a text and explain how they are supported by key details.', subject: 'English language arts' },
];

const initialLessons: Lesson[] = [
  { id: 'l-1', day: 0, period: 1, className: 'Math · Grade 5', title: 'Place value patterns', objective: 'I can explain how a digit changes value when it moves one place.', warmUp: 'Number talk: 0.4 × 10', instruction: 'Model place-value shifts with a visual chart.', practice: 'Partner card sort and exit ticket.', accommodations: 'Audio directions · extended time · front-row seating', homework: 'Practice set 4B, questions 1–6', standard: 'USBE.MATH.5.NBT.1', standardDescription: standards[0].description, stage: 'Practiced', span: 1, visibleToSubstitute: true },
  { id: 'l-2', day: 0, period: 3, className: 'Science · Grade 5', title: 'Particle model lab', objective: 'I can model matter using observable evidence.', warmUp: 'Sketch a sealed container before and after heating.', instruction: 'Review particle motion and model limitations.', practice: 'Groups compare model predictions.', accommodations: 'Visual checklist · lab partner roles', homework: 'Write one model question', standard: 'USBE.SCI.5.1', standardDescription: standards[2].description, stage: 'Taught', span: 1, visibleToSubstitute: true },
  { id: 'l-3', day: 1, period: 1, className: 'Math · Grade 5', title: 'Multiply by powers of ten', objective: 'I can predict and verify a product using place value.', warmUp: 'Estimate 24 × 100', instruction: 'Connect base-ten patterns to written notation.', practice: 'Whiteboard practice, then partner check.', accommodations: 'Worked example · extended time', homework: 'Practice set 4B, questions 7–12', standard: 'CCSS.MATH.5.NBT.5', standardDescription: standards[1].description, stage: 'Taught', span: 1, visibleToSubstitute: true },
  { id: 'l-4', day: 2, period: 2, className: 'Reading · Grade 5', title: 'Find the central idea', objective: 'I can support a central idea with details from a text.', warmUp: 'Preview headings and captions.', instruction: 'Think aloud while annotating a short article.', practice: 'Highlight two key details and discuss.', accommodations: 'Audio read-aloud · chunked text', homework: 'Bring one discussion question', standard: 'CCSS.ELA-LITERACY.RI.5.2', standardDescription: standards[4].description, stage: 'Assessed', span: 1, visibleToSubstitute: true },
  { id: 'l-5', day: 3, period: 1, className: 'Math · Grade 5', title: 'Multi-digit multiplication', objective: 'I can multiply multi-digit whole numbers accurately.', warmUp: 'Estimate before calculating.', instruction: 'Use area model, then connect to standard algorithm.', practice: 'Small-group stations.', accommodations: 'Manipulatives · audio directions', homework: 'Reflection: which strategy helped?', standard: 'CCSS.MATH.5.NBT.5', standardDescription: standards[1].description, stage: 'Practiced', span: 2, visibleToSubstitute: true },
];

function LessonLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function LessonPlannerWorkspace({ narrow }: { narrow: boolean }) {
  const [view, setView] = useState<ViewMode>('Week');
  const [scheduleRule, setScheduleRule] = useState<ScheduleRule>('Fixed');
  const [override, setOverride] = useState('Normal day');
  const [lessons, setLessons] = useState(initialLessons);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [notice, setNotice] = useState('');
  const [standardQuery, setStandardQuery] = useState('');
  const [standardPickerOpen, setStandardPickerOpen] = useState(false);
  const [packetOpen, setPacketOpen] = useState(false);
  const [packetFrom, setPacketFrom] = useState('Oct 19');
  const [packetTo, setPacketTo] = useState('Oct 23');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const matchingStandards = standards.filter((standard) => `${standard.code} ${standard.description} ${standard.subject}`.toLowerCase().includes(standardQuery.toLowerCase()));
  const coverage = useMemo(() => standards.map((standard) => ({
    ...standard,
    stages: lessons.filter((lesson) => lesson.standard === standard.code).map((lesson) => lesson.stage),
  })), [lessons]);
  const visibleLessons = lessons.filter((lesson) => view === 'Class' ? lesson.className === selectedClass : view === 'Day' ? lesson.day === selectedDay : true);

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => setLessons((current) => current.map((lesson) => lesson.id === lessonId ? { ...lesson, ...updates } : lesson));

  const moveLessonTo = (day: number, period: number) => {
    if (!selectedLessonId) return;
    const collision = lessons.some((lesson) => lesson.id !== selectedLessonId && lesson.day === day && lesson.period === period);
    if (collision) { setNotice('That period already has a lesson. Choose another destination.'); return; }
    updateLesson(selectedLessonId, { day, period });
    setSelectedDay(day);
    setMoveMode(false);
    setNotice(`Lesson moved to ${weekdays[day] ?? 'next week'}, Period ${period}.`);
  };

  const bumpRemaining = () => {
    const cutoff = selectedDay;
    setLessons((current) => current.map((lesson) => lesson.day >= cutoff ? { ...lesson, day: lesson.day + 1 } : lesson));
    setNotice(`Remaining lessons from ${weekdays[cutoff] ?? 'the selected day'} shifted forward one day. Review the resulting calendar.`);
  };

  const extendLesson = () => {
    if (!selectedLesson) { setNotice('Select a lesson block first.'); return; }
    if (selectedLesson.span >= 3) { setNotice('Lesson blocks can span up to three periods in this planner.'); return; }
    const occupied = lessons.some((lesson) => lesson.id !== selectedLesson.id && lesson.day === selectedLesson.day && lesson.period > selectedLesson.period && lesson.period <= selectedLesson.period + selectedLesson.span);
    if (occupied) { setNotice('Another lesson occupies the next period. Move it before extending this block.'); return; }
    updateLesson(selectedLesson.id, { span: selectedLesson.span + 1 });
    setNotice(`“${selectedLesson.title}” now spans ${selectedLesson.span + 1} periods.`);
  };

  const copyLesson = () => {
    if (!selectedLesson) { setNotice('Select a lesson block to copy.'); return; }
    const nextPeriod = selectedLesson.period + selectedLesson.span;
    if (nextPeriod > 6) { setNotice('There is no open period after this lesson to copy into.'); return; }
    const copy = { ...selectedLesson, id: `lesson-${Date.now()}`, period: nextPeriod, title: `${selectedLesson.title} · Copy`, span: 1 };
    setLessons((current) => [...current, copy]);
    setSelectedLessonId(copy.id);
    setNotice('Lesson block copied to the next period.');
  };

  const createPacket = async () => {
    const packetLessons = lessons.filter((lesson) => lesson.visibleToSubstitute !== false);
    const packetText = [
      `SUBSTITUTE PLAN PACKET · ${packetFrom}–${packetTo}`,
      'Evergreen Elementary · Teacher: Avery Brooks',
      'Bell schedule: Period 1 8:10 · Period 2 9:00 · Period 3 10:00 · Period 4 12:30 · Period 5 1:20',
      'Emergency: Follow the classroom evacuation map and office instructions. Attendance/accountability procedures are available in the safety binder.',
      'Seating/accommodation note: Share only the minimum necessary accommodation guidance with authorized substitutes.',
      ...packetLessons.map((lesson) => `\n${weekdays[lesson.day] ?? `Day ${lesson.day + 1}`} · Period ${lesson.period} · ${lesson.className}\n${lesson.title}\nObjective: ${lesson.objective}\nWarm-up: ${lesson.warmUp}\nInstruction: ${lesson.instruction}\nPractice: ${lesson.practice}\nAccommodations: ${lesson.accommodations}\nHomework: ${lesson.homework}\nStandard: ${lesson.standard}`),
    ].join('\n');
    setPacketOpen(true);
    setNotice(`${packetLessons.length} substitute lesson plans included. Packet preview generated locally.`);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([packetText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `sub-plan-${packetFrom}-${packetTo}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({ title: 'Substitute plan packet preview', message: packetText });
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = { id: `lesson-${Date.now()}`, day: selectedDay, period: 1, className: selectedClass, title: 'New lesson', objective: '', warmUp: '', instruction: '', practice: '', accommodations: '', homework: '', standard: '', standardDescription: '', stage: 'Taught', span: 1, visibleToSubstitute: true };
    setLessons((current) => [...current, newLesson]);
    setSelectedLessonId(newLesson.id);
    setEditingLesson(newLesson);
    setNotice('New lesson block created. Fill in its template sections.');
  };

  const saveLessonEdits = () => {
    if (!editingLesson) return;
    updateLesson(editingLesson.id, editingLesson);
    setEditingLesson(null);
    setNotice('Lesson template saved locally.');
  };

  const modes: ViewMode[] = ['Week', 'Day', 'Month', 'Class'];
  const rules: ScheduleRule[] = ['Fixed', 'A/B block', 'Rotating'];
  const dayOverrides = ['Normal day', 'Holiday / no school', 'Late start', 'Assembly schedule'];

  return (
    <View style={styles.workspace}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><CalendarDays size={16} color={colors.forest} /></View>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Lesson planner</Text><Text style={styles.headerSubtitle}>Avery Brooks · Evergreen Elementary · Term 1</Text></View>
        <Pressable onPress={() => setPacketOpen(!packetOpen)} style={styles.subPacketButton}><FileText size={12} color={colors.forest} /><Text style={styles.subPacketText}>Sub packet</Text></Pressable>
      </View>

      <View style={[styles.toolbar, narrow && styles.toolbarNarrow]}>
        <View style={styles.viewTabs}>{modes.map((mode) => <Pressable key={mode} onPress={() => setView(mode)} style={[styles.viewTab, view === mode && styles.viewTabActive]}><Text style={[styles.viewTabText, view === mode && styles.viewTabTextActive]}>{mode}</Text></Pressable>)}</View>
        <View style={styles.ruleTabs}>{rules.map((rule) => <Pressable key={rule} onPress={() => setScheduleRule(rule)} style={[styles.ruleTab, scheduleRule === rule && styles.ruleTabActive]}><Text style={[styles.ruleText, scheduleRule === rule && styles.ruleTextActive]}>{rule}</Text></Pressable>)}</View>
      </View>

      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}
      <View style={[styles.scheduleBanner, override !== 'Normal day' && styles.scheduleBannerOverride]}><Clock3 size={13} color={override === 'Normal day' ? colors.forest : colors.orange} /><Text style={styles.scheduleBannerText}>{scheduleRule} schedule · {weekdays[selectedDay] ?? 'Beyond this week'} · Override:</Text><Pressable onPress={() => setOverride(dayOverrides[(dayOverrides.indexOf(override) + 1) % dayOverrides.length])} style={styles.overrideButton}><Text style={styles.overrideButtonText}>{override}</Text><ChevronDown size={11} color={colors.forest} /></Pressable></View>

      {view === 'Month' ? <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>October 2026</Text><Text style={styles.panelSubtitle}>Select a date to inspect or plan lessons</Text></View><CalendarDays size={15} color={colors.forest} /></View><View style={styles.monthWeek}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.monthDayLabel}>{day}</Text>)}</View><View style={styles.monthGrid}>{Array.from({ length: 35 }, (_, index) => { const date = index - 2; const selected = date === 19; const planCount = lessons.filter((lesson) => lesson.day === (date - 19)).length; return <Pressable key={index} onPress={() => { if (date >= 19 && date <= 23) setSelectedDay(date - 19); setView('Day'); }} style={[styles.monthCell, selected && styles.monthCellSelected, date < 1 || date > 31 ? styles.monthCellEmpty : null]}><Text style={[styles.monthDate, selected && styles.monthDateSelected]}>{date < 1 || date > 31 ? '' : date}</Text>{planCount > 0 ? <View style={styles.monthLessonDot} /> : null}</Pressable>; })}</View></View> : null}

      {view === 'Class' ? <View style={styles.classSelector}>{classes.map((item) => <Pressable key={item} onPress={() => setSelectedClass(item)} style={[styles.classChip, selectedClass === item && styles.classChipActive]}><Text style={[styles.classChipText, selectedClass === item && styles.classChipTextActive]}>{item}</Text></Pressable>)}</View> : null}

      {(view === 'Week' || view === 'Day' || view === 'Class') ? <View style={[styles.schedulePanel, narrow && styles.schedulePanelNarrow]}>
        <View style={styles.scheduleToolbar}><View><Text style={styles.panelTitle}>{view === 'Week' ? 'Weekly grid' : view === 'Day' ? weekdays[selectedDay] : selectedClass}</Text><Text style={styles.panelSubtitle}>{view === 'Week' ? 'Days across · class periods down' : 'Lesson blocks and standards'}</Text></View><View style={styles.planActions}><Pressable onPress={bumpRemaining} style={styles.smallAction}><ArrowRight size={10} color={colors.forest} /><Text style={styles.smallActionText}>Bump day</Text></Pressable><Pressable onPress={addLesson} style={styles.smallAction}><Plus size={10} color={colors.forest} /><Text style={styles.smallActionText}>Add lesson</Text></Pressable></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.gridScroll}>
          <View>
            <View style={styles.gridHeader}><View style={styles.periodHeader}><Text style={styles.gridHeaderText}>PERIOD</Text></View>{(view === 'Day' ? [selectedDay] : [0, 1, 2, 3, 4]).map((day) => <Pressable key={day} onPress={() => setSelectedDay(day)} style={[styles.dayHeader, selectedDay === day && styles.dayHeaderSelected]}><Text style={styles.gridHeaderText}>{weekdays[day] ?? 'Mon · Oct 26'}</Text><Text style={styles.gridHeaderSub}>{day === 2 && override === 'Assembly schedule' ? 'Assembly' : day === 4 && override === 'Holiday / no school' ? 'Holiday' : 'Classes & plans'}</Text></Pressable>)}</View>
            {[1, 2, 3, 4, 5].map((period) => <View key={period} style={styles.gridRow}><View style={styles.periodCell}><Text style={styles.periodNumber}>P{period}</Text><Text style={styles.periodTime}>{['8:10', '9:00', '10:00', '12:30', '1:20'][period - 1]}</Text></View>{(view === 'Day' ? [selectedDay] : [0, 1, 2, 3, 4]).map((day) => {
              const lesson = lessons.find((item) => item.day === day && item.period === period && (view !== 'Class' || item.className === selectedClass));
              const isSelected = lesson?.id === selectedLessonId;
              return <Pressable key={`${day}-${period}`} onPress={() => { if (moveMode && selectedLessonId) { moveLessonTo(day, period); return; } setSelectedDay(day); setSelectedLessonId(lesson?.id ?? null); setEditingLesson(lesson ?? null); }} onLongPress={() => { if (lesson) { setSelectedLessonId(lesson.id); setMoveMode(true); setNotice('Move mode: tap an empty period to place the selected lesson.'); } }} style={[styles.gridCell, isSelected && styles.gridCellSelected, moveMode && !lesson && styles.gridCellDrop]}>
                {lesson ? <View style={[styles.lessonBlock, lesson.className.startsWith('Math') ? styles.lessonMath : lesson.className.startsWith('Science') ? styles.lessonScience : styles.lessonReading]}><Text numberOfLines={1} style={styles.lessonTitle}>{lesson.title}</Text><Text numberOfLines={1} style={styles.lessonClass}>{lesson.className}</Text><Text style={styles.lessonStandard}>{lesson.standard}</Text>{lesson.span > 1 ? <Text style={styles.spanBadge}>Spans {lesson.span} periods</Text> : null}</View> : moveMode ? <MoveRight size={12} color={colors.forest} /> : null}
              </Pressable>;
            })}</View>)}
          </View>
        </ScrollView>
        {moveMode ? <View style={styles.moveNotice}><Text style={styles.moveNoticeText}>Move mode is on. Tap an open day/period cell to move “{selectedLesson?.title}”.</Text><Pressable onPress={() => setMoveMode(false)}><Text style={styles.cancelMove}>Cancel</Text></Pressable></View> : null}
      </View> : null}

      {selectedLesson && editingLesson ? <View style={styles.lessonEditor}>
        <View style={styles.editorHeader}><View style={{ flex: 1 }}><Text style={styles.editorTitle}>{editingLesson.title}</Text><Text style={styles.panelSubtitle}>{weekdays[editingLesson.day] ?? 'Next week'} · Period {editingLesson.period} · {editingLesson.className}</Text></View><Pressable onPress={() => { setEditingLesson(null); setSelectedLessonId(null); }} style={styles.smallAction}><Text style={styles.smallActionText}>Close</Text></Pressable></View>
        <View style={[styles.templateFields, narrow && styles.templateFieldsNarrow]}>
          {([
            ['Objectives', 'objective'], ['Warm-Up', 'warmUp'], ['Direct Instruction', 'instruction'], ['Guided Practice', 'practice'], ['Accommodations', 'accommodations'], ['Homework', 'homework'],
          ] as const).map(([label, key]) => <View key={key} style={styles.templateField}><LessonLabel>{label.toUpperCase()}</LessonLabel><TextInput value={editingLesson[key]} onChangeText={(value) => setEditingLesson((current) => current ? { ...current, [key]: value } : current)} multiline style={styles.templateInput} /></View>)}
        </View>
        <View style={styles.editorActions}><Pressable onPress={() => setStandardPickerOpen(!standardPickerOpen)} style={styles.smallAction}><Search size={10} color={colors.forest} /><Text style={styles.smallActionText}>{editingLesson.standard || 'Link a standard'}</Text></Pressable><Pressable onPress={() => setEditingLesson((current) => current ? { ...current, stage: current.stage === 'Taught' ? 'Practiced' : current.stage === 'Practiced' ? 'Assessed' : 'Taught' } : current)} style={styles.stageButton}><Text style={styles.stageButtonText}>{editingLesson.stage} · change</Text><ChevronDown size={10} color={colors.forest} /></Pressable><Pressable onPress={copyLesson} style={styles.smallAction}><Copy size={10} color={colors.forest} /><Text style={styles.smallActionText}>Copy to next period</Text></Pressable><Pressable onPress={extendLesson} style={styles.smallAction}><Plus size={10} color={colors.forest} /><Text style={styles.smallActionText}>Extend</Text></Pressable><Pressable onPress={saveLessonEdits} style={styles.saveButton}><Check size={11} color="#fff" /><Text style={styles.saveButtonText}>Save</Text></Pressable></View>
        {standardPickerOpen ? <View style={styles.standardPicker}><View style={styles.standardSearch}><Search size={12} color={colors.muted} /><TextInput value={standardQuery} onChangeText={setStandardQuery} placeholder="Search USBE, Common Core, NGSS" style={styles.standardSearchInput} /></View>{matchingStandards.map((standard) => <Pressable key={standard.code} onPress={() => { setEditingLesson((current) => current ? { ...current, standard: standard.code, standardDescription: standard.description } : current); setStandardPickerOpen(false); setStandardQuery(''); }} style={styles.standardResult}><View style={{ flex: 1 }}><Text style={styles.standardCode}>{standard.code}</Text><Text style={styles.standardDescription}>{standard.description}</Text></View><ArrowRight size={11} color={colors.forest} /></Pressable>)}</View> : null}
      </View> : null}

      <View style={[styles.bottomGrid, narrow && styles.bottomGridNarrow]}>
        <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Standards coverage</Text><Text style={styles.panelSubtitle}>Taught · Practiced · Assessed</Text></View><Text style={styles.coverageCount}>{coverage.filter((standard) => standard.stages.length > 0).length}/{coverage.length} linked</Text></View>{coverage.map((standard) => <View key={standard.code} style={styles.coverageRow}><View style={{ flex: 1 }}><Text style={styles.standardCode}>{standard.code}</Text><Text numberOfLines={1} style={styles.standardDescription}>{standard.description}</Text></View><View style={styles.coverageStages}>{(['Taught', 'Practiced', 'Assessed'] as const).map((stage) => <View key={stage} style={[styles.coverageDot, standard.stages.includes(stage) && styles.coverageDotActive]} />)}</View></View>)}</View>
        <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Substitute packet</Text><Text style={styles.panelSubtitle}>Generate an emergency-ready digital view</Text></View><FileText size={14} color={colors.forest} /></View><View style={styles.packetRange}><TextInput value={packetFrom} onChangeText={setPacketFrom} style={styles.packetInput} /><Text style={styles.packetTo}>to</Text><TextInput value={packetTo} onChangeText={setPacketTo} style={styles.packetInput} /></View><View style={styles.packetEnclosures}><Text style={styles.packetEnclosure}>✓ Lesson plans</Text><Text style={styles.packetEnclosure}>✓ Bell schedule</Text><Text style={styles.packetEnclosure}>✓ Emergency procedure</Text><Text style={styles.packetEnclosure}>✓ Authorized accommodation notes</Text></View><Pressable onPress={createPacket} style={styles.packetButton}><Download size={12} color="#fff" /><Text style={styles.packetButtonText}>Generate sub packet</Text></Pressable>{packetOpen ? <Text style={styles.packetReady}>Digital packet preview generated for {packetFrom}–{packetTo}. Temporary sub-portal delivery is not connected.</Text> : null}</View>
      </View>
      <Text style={styles.footerText}>LESSON PLANNER DEMO · SAMPLE STANDARDS · LOCAL PLANS · NO SUBSTITUTE PORTAL SYNC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 9 },
  header: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5 },
  headerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.limeSoft, borderRadius: 4 },
  headerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  subPacketButton: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, backgroundColor: colors.limeSoft, paddingHorizontal: 6 }, subPacketText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }, toolbarNarrow: { flexDirection: 'column', alignItems: 'flex-start' }, viewTabs: { flexDirection: 'row', gap: 3 }, viewTab: { minHeight: 25, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 3, backgroundColor: '#e9ede7' }, viewTabActive: { backgroundColor: colors.forest }, viewTabText: { color: '#647067', fontSize: 6 }, viewTabTextActive: { color: '#fff', fontWeight: '700' },
  ruleTabs: { flexDirection: 'row', gap: 3 }, ruleTab: { minHeight: 23, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 3, backgroundColor: '#f0f2ee' }, ruleTabActive: { backgroundColor: colors.blueSoft }, ruleText: { color: '#7a857d', fontSize: 6 }, ruleTextActive: { color: '#4f7188', fontWeight: '700' },
  notice: { padding: 7, borderRadius: 3, backgroundColor: colors.limeSoft }, noticeText: { color: colors.forest, fontSize: 7, lineHeight: 11 },
  scheduleBanner: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#f0f4ed' }, scheduleBannerOverride: { backgroundColor: colors.yellowSoft }, scheduleBannerText: { color: '#69756c', fontSize: 6, flex: 1 }, overrideButton: { minHeight: 22, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, borderRadius: 3, backgroundColor: '#fff' }, overrideButtonText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  schedulePanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 8 }, schedulePanelNarrow: { width: '100%' }, scheduleToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 5 },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9, marginBottom: 8 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginBottom: 7 }, panelTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 },
  gridScroll: { paddingBottom: 3 }, gridHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line }, periodHeader: { width: 55, minHeight: 30, justifyContent: 'center', paddingLeft: 5 }, gridHeaderText: { color: '#6f7a71', fontSize: 6, fontWeight: '700' }, gridHeaderSub: { color: '#9aa39b', fontSize: 5, marginTop: 2 }, dayHeader: { width: 126, minHeight: 30, justifyContent: 'center', paddingLeft: 6 }, dayHeaderSelected: { backgroundColor: '#f1f6ec' }, gridRow: { flexDirection: 'row', minHeight: 65, borderBottomWidth: 1, borderBottomColor: '#edf0eb' }, periodCell: { width: 55, justifyContent: 'center', paddingLeft: 5 }, periodNumber: { color: colors.ink, fontSize: 7, fontWeight: '700' }, periodTime: { color: colors.muted, fontSize: 5, marginTop: 3 }, gridCell: { width: 126, minHeight: 64, padding: 3, borderLeftWidth: 1, borderLeftColor: '#edf0eb', alignItems: 'stretch', justifyContent: 'center' }, gridCellSelected: { backgroundColor: '#f4f7f1' }, gridCellDrop: { backgroundColor: '#f0f5ec' },
  lessonBlock: { minHeight: 48, borderRadius: 3, padding: 5 }, lessonMath: { backgroundColor: '#eaf1f6' }, lessonScience: { backgroundColor: '#eef5e8' }, lessonReading: { backgroundColor: '#fbf3e5' }, lessonTitle: { color: colors.ink, fontSize: 6, fontWeight: '700' }, lessonClass: { color: '#66736a', fontSize: 5, marginTop: 3 }, lessonStandard: { color: colors.forest, fontSize: 5, marginTop: 4 }, spanBadge: { color: '#5d7b90', fontSize: 5, marginTop: 3 },
  planActions: { flexDirection: 'row', gap: 4 }, smallAction: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5 }, smallActionText: { color: colors.forest, fontSize: 6 }, moveNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginTop: 6, padding: 6, borderRadius: 3, backgroundColor: colors.limeSoft }, moveNoticeText: { color: colors.forest, fontSize: 6, flex: 1 }, cancelMove: { color: colors.orange, fontSize: 6, fontWeight: '700' },
  monthWeek: { flexDirection: 'row', justifyContent: 'space-around' }, monthDayLabel: { width: '14.28%', color: colors.muted, fontSize: 6, fontWeight: '700', textAlign: 'center', paddingVertical: 4 }, monthGrid: { flexDirection: 'row', flexWrap: 'wrap' }, monthCell: { width: '14.28%', height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#edf0eb' }, monthCellSelected: { backgroundColor: colors.forest }, monthCellEmpty: { backgroundColor: '#f8f9f7' }, monthDate: { color: colors.ink, fontSize: 7 }, monthDateSelected: { color: '#fff', fontWeight: '700' }, monthLessonDot: { position: 'absolute', bottom: 4, width: 3, height: 3, borderRadius: 2, backgroundColor: colors.lime },
  classSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, classChip: { minHeight: 23, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 3, backgroundColor: '#f0f2ee' }, classChipActive: { backgroundColor: colors.blueSoft }, classChipText: { color: colors.muted, fontSize: 6 }, classChipTextActive: { color: '#4f7188', fontWeight: '700' },
  lessonEditor: { borderWidth: 1, borderColor: '#cfdcc7', backgroundColor: '#fff', borderRadius: 5, padding: 9 }, editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, editorTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' }, templateFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, templateFieldsNarrow: { flexDirection: 'column' }, templateField: { flexGrow: 1, flexBasis: '30%', minWidth: 130 }, fieldLabel: { color: '#78837a', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, marginTop: 6, marginBottom: 3 }, templateInput: { minHeight: 40, borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 5, color: colors.ink, fontSize: 6, lineHeight: 9 }, editorActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 7 }, stageButton: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, borderRadius: 3, backgroundColor: colors.blueSoft }, stageButtonText: { color: '#4f7188', fontSize: 6 }, saveButton: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, borderRadius: 3, backgroundColor: colors.forest }, saveButtonText: { color: '#fff', fontSize: 6 },
  standardPicker: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 7, paddingTop: 6 }, standardSearch: { height: 26, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5 }, standardSearchInput: { flex: 1, fontSize: 6 }, standardResult: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: '#edf0eb', paddingVertical: 4 }, standardCode: { color: colors.forest, fontSize: 6, fontWeight: '700' }, standardDescription: { color: colors.muted, fontSize: 5, lineHeight: 8, marginTop: 2 },
  bottomGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, bottomGridNarrow: { flexDirection: 'column' }, coverageCount: { color: colors.forest, fontSize: 6, fontWeight: '700' }, coverageRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, coverageStages: { flexDirection: 'row', gap: 3 }, coverageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e7ebe5' }, coverageDotActive: { backgroundColor: '#84a66d' }, packetRange: { flexDirection: 'row', alignItems: 'center', gap: 4 }, packetInput: { width: 58, height: 25, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 4, fontSize: 6 }, packetTo: { color: colors.muted, fontSize: 6 }, packetEnclosures: { marginTop: 7, gap: 4 }, packetEnclosure: { color: '#66736a', fontSize: 6 }, packetButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 3, backgroundColor: colors.forest, marginTop: 8 }, packetButtonText: { color: '#fff', fontSize: 6, fontWeight: '600' }, packetReady: { color: colors.forest, fontSize: 6, lineHeight: 9, marginTop: 6 }, footerText: { color: '#98a198', fontSize: 5, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
});