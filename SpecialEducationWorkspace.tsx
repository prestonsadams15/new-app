import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Accessibility,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Headphones,
  HeartPulse,
  PenLine,
  Plus,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react-native';

type Section = 'IEP & timeline' | 'SMART goals' | 'Accommodations' | 'Service log' | 'Parent consent';
type Goal = { id: number; timeframe: string; behavior: string; condition: string; criterion: string; data: number[] };
type ServiceEntry = { id: number; service: string; minutes: number; provider: string; date: string };

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f',
  lime: '#c5e889', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6',
  orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df',
};

const checklistItems = [
  'Present levels of academic achievement and functional performance',
  'Measurable annual goals with progress measures',
  'Special education and related services with frequency',
  'Least restrictive environment justification',
  'Parent participation and consent documented',
];

const initialGoals: Goal[] = [{
  id: 1,
  timeframe: 'By the end of the IEP year',
  behavior: 'read a grade-level passage aloud with improved fluency',
  condition: 'Given a familiar grade-level passage and one preview',
  criterion: '110 correct words per minute across 3 consecutive probes',
  data: [42, 48, 51, 56, 61, 66, 72, 78],
}];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

function WorkspaceLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function SpecialEducationWorkspace({ narrow }: { narrow: boolean }) {
  const [section, setSection] = useState<Section>('IEP & timeline');
  const [stateTemplate, setStateTemplate] = useState<'Utah · USBE' | 'District template'>('Utah · USBE');
  const [timeframeIndex, setTimeframeIndex] = useState(0);
  const timeframeOptions = ['By the end of the IEP year', 'Within 36 instructional weeks', 'By the annual review date'];
  const [checks, setChecks] = useState([true, true, false, false, false]);
  const [notice, setNotice] = useState('');
  const [goals, setGoals] = useState(initialGoals);
  const [behavior, setBehavior] = useState('');
  const [condition, setCondition] = useState('');
  const [criterion, setCriterion] = useState('');
  const [progressValue, setProgressValue] = useState('');
  const [accommodations, setAccommodations] = useState([
    { name: 'Audio read-aloud', detail: 'Text and directions', icon: Headphones, active: true },
    { name: 'Preferential seating', detail: 'Front row · teacher view', icon: Accessibility, active: true },
    { name: 'Extended time', detail: '1.5× on assessments', icon: Timer, active: true },
    { name: 'Movement breaks', detail: 'As needed · quiet signal', icon: HeartPulse, active: false },
  ]);
  const [serviceType, setServiceType] = useState('Speech-language');
  const [serviceMinutes, setServiceMinutes] = useState('30');
  const [services, setServices] = useState<ServiceEntry[]>([
    { id: 1, service: 'Speech-language', minutes: 30, provider: 'Renee Cole, SLP', date: 'Today · 9:00 AM' },
  ]);
  const [claimPreview, setClaimPreview] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentPrepared, setConsentPrepared] = useState(false);

  const sections: Section[] = ['IEP & timeline', 'SMART goals', 'Accommodations', 'Service log', 'Parent consent'];
  const completedChecks = checks.filter(Boolean).length;

  const toggleCheck = (index: number) => setChecks((current) => current.map((checked, item) => item === index ? !checked : checked));
  const toggleAccommodation = (index: number) => setAccommodations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, active: !item.active } : item));

  const addGoal = () => {
    if (!behavior.trim() || !condition.trim() || !criterion.trim()) {
      setNotice('Complete the condition, target behavior, and measurable criterion to save this goal.');
      return;
    }
    setGoals((current) => [{ id: Date.now(), timeframe: timeframeOptions[timeframeIndex], behavior: behavior.trim(), condition: condition.trim(), criterion: criterion.trim(), data: [] }, ...current]);
    setBehavior(''); setCondition(''); setCriterion(''); setNotice('SMART goal added to the local draft.');
  };

  const logProgress = (goalId: number) => {
    const value = Number(progressValue);
    if (!Number.isFinite(value) || value < 0 || value > 200) {
      setNotice('Enter a valid progress measure from 0 to 200.');
      return;
    }
    setGoals((current) => current.map((goal) => goal.id === goalId ? { ...goal, data: [...goal.data, value] } : goal));
    setProgressValue(''); setNotice('Progress point added to this local goal preview.');
  };

  const logService = () => {
    const minutes = Number(serviceMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) {
      setNotice('Enter service minutes between 1 and 480.');
      return;
    }
    setServices((current) => [{ id: Date.now(), service: serviceType, minutes, provider: 'Jordan Davis', date: 'Today · Just now' }, ...current]);
    setClaimPreview(false); setNotice('Service entry added locally. This does not create a billable Medicaid claim.');
  };

  const prepareConsent = () => {
    if (!guardianName.trim() || !consentChecked) {
      setNotice('Enter the guardian name and confirm the consent statement to prepare this preview.');
      return;
    }
    setConsentPrepared(true); setNotice('Consent preview prepared. No signature or student record was stored.');
  };

  return (
    <View style={styles.workspace}>
      <View style={styles.studentHeader}>
        <View style={styles.studentMark}><Text style={styles.studentMarkText}>MT</Text></View>
        <View style={styles.studentHeaderCopy}>
          <Eyebrow>SPECIAL EDUCATION · PRIVATE STUDENT WORKSPACE</Eyebrow>
          <Text style={styles.studentName}>Maya Thompson</Text>
          <Text style={styles.studentMeta}>Grade 4 · Evergreen Elementary · IEP annual review</Text>
        </View>
        <View style={styles.draftStatus}><View style={styles.draftDot} /><Text style={styles.draftStatusText}>DRAFT</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
        {sections.map((item) => {
          const selected = section === item;
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => { setSection(item); setNotice(''); }} style={[styles.sectionTab, selected && styles.sectionTabSelected]}>
            <Text style={[styles.sectionTabText, selected && styles.sectionTabTextSelected]}>{item}</Text>
          </Pressable>;
        })}
      </ScrollView>

      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      {section === 'IEP & timeline' ? <View style={[styles.mainGrid, narrow && styles.mainGridNarrow]}>
        <View style={styles.mainColumn}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Annual review draft</Text><Text style={styles.panelSubtitle}>Collaborative document · 4 invited team members</Text></View><View style={styles.collaborators}><View style={styles.collaboratorAvatar}><Text style={styles.collaboratorInitial}>AB</Text></View><View style={[styles.collaboratorAvatar, styles.collaboratorSecond]}><Text style={styles.collaboratorInitial}>RC</Text></View><View style={[styles.collaboratorAvatar, styles.collaboratorThird]}><Text style={styles.collaboratorInitial}>SP</Text></View><Text style={styles.collaboratorCount}>+1</Text></View></View>
            <View style={styles.collaborationNotice}><View style={styles.liveDot} /><Text style={styles.collaborationText}>Shared draft preview · Changes are local to this device</Text></View>
            <View style={styles.formField}><WorkspaceLabel>STRENGTHS & FAMILY INPUT</WorkspaceLabel><TextInput multiline defaultValue="Maya is a curious reader who enjoys partner projects and shares thoughtful ideas in small groups." style={styles.textArea} textAlignVertical="top" /></View>
            <View style={styles.formField}><WorkspaceLabel>PRESENT LEVELS & NEEDS</WorkspaceLabel><TextInput multiline defaultValue="Reading fluency is improving. Maya benefits from an audio-supported preview and clear visual directions." style={styles.textArea} textAlignVertical="top" /></View>
            <Pressable onPress={() => setNotice('Autosave preview only. Collaborative synchronization is not connected.')} style={styles.saveDraft}><CheckCircle2 size={15} color={colors.forest} /><Text style={styles.saveDraftText}>Saved locally · Just now</Text></Pressable>
          </View>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>State compliance review</Text><Text style={styles.panelSubtitle}>Template: {stateTemplate}</Text></View><ChevronDown size={16} color={colors.muted} /></View>
            <View style={styles.templateSwitch}>{(['Utah · USBE', 'District template'] as const).map((item) => <Pressable key={item} onPress={() => setStateTemplate(item)} style={[styles.templateOption, stateTemplate === item && styles.templateOptionActive]}><Text style={[styles.templateOptionText, stateTemplate === item && styles.templateOptionTextActive]}>{item}</Text></Pressable>)}</View>
            <View style={styles.complianceSummary}><ShieldCheck size={16} color={completedChecks === checklistItems.length ? colors.forest : colors.yellow} /><Text style={styles.complianceSummaryText}>{completedChecks} of {checklistItems.length} checks complete</Text><View style={styles.complianceTrack}><View style={[styles.complianceFill, { width: `${completedChecks / checklistItems.length * 100}%` }]} /></View></View>
            {checklistItems.map((item, index) => <Pressable key={item} onPress={() => toggleCheck(index)} style={styles.checkRow}><View style={[styles.checkbox, checks[index] && styles.checkboxActive]}>{checks[index] ? <Check size={11} color="#fff" /> : null}</View><Text style={styles.checkText}>{item}</Text><Text style={[styles.checkState, checks[index] && styles.checkStateComplete]}>{checks[index] ? 'Complete' : 'Required'}</Text></Pressable>)}
            <Text style={styles.disclaimer}>Template checklist preview only. Confirm all Utah State Board of Education requirements with your district compliance lead.</Text>
          </View>
        </View>

        <View style={[styles.timelineColumn, narrow && styles.timelineColumnNarrow]}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Timeline alerts</Text><Text style={styles.panelSubtitle}>Upcoming reviews & renewals</Text></View><CalendarDays size={17} color={colors.forest} /></View>
            {[{ title: 'Annual IEP review', date: 'Apr 21, 2027', tag: 'Due in 184 days', tone: 'yellow' }, { title: '3-year reevaluation', date: 'Feb 06, 2028', tag: 'Due in 475 days', tone: 'blue' }, { title: '504 plan renewal', date: 'Nov 12, 2026', tag: 'Due in 24 days', tone: 'orange' }].map((item) => <View key={item.title} style={styles.timelineItem}><View style={[styles.timelineMarker, item.tone === 'orange' && styles.timelineMarkerOrange, item.tone === 'yellow' && styles.timelineMarkerYellow]} /><View style={styles.timelineCopy}><Text style={styles.timelineTitle}>{item.title}</Text><Text style={styles.timelineDate}>{item.date}</Text></View><Text style={[styles.timelineTag, item.tone === 'orange' && styles.timelineTagOrange, item.tone === 'yellow' && styles.timelineTagYellow]}>{item.tag}</Text></View>)}
            <Pressable onPress={() => setNotice('Reminder preview queued locally. Email and push notifications are not connected.')} style={styles.reminderButton}><Clock3 size={14} color={colors.forest} /><Text style={styles.reminderButtonText}>Preview reminder settings</Text></Pressable>
          </View>
          <View style={styles.teamPanel}><Users size={16} color={colors.forest} /><View style={{ flex: 1 }}><Text style={styles.teamTitle}>IEP team</Text><Text style={styles.teamCopy}>Avery Brooks · Renee Cole, SPED · Sam Patel, Counselor · Pat Thompson, guardian</Text></View><ArrowRight size={14} color={colors.forest} /></View>
        </View>
      </View> : null}

      {section === 'SMART goals' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>SMART goal builder</Text><Text style={styles.panelSubtitle}>Specific · measurable · attainable · relevant · time-bound</Text></View><BookOpen size={17} color={colors.forest} /></View>
        <Text style={styles.goalPrompt}>By when, under what conditions, will the student do what, and how will progress be measured?</Text>
        <WorkspaceLabel>TIMEFRAME</WorkspaceLabel><Pressable accessibilityRole="button" accessibilityLabel="Change goal timeframe" onPress={() => setTimeframeIndex((current) => (current + 1) % timeframeOptions.length)} style={styles.selectField}><Text style={styles.selectText}>{timeframeOptions[timeframeIndex]}</Text><ChevronDown size={14} color={colors.muted} /></Pressable>
        <WorkspaceLabel>CONDITION</WorkspaceLabel><TextInput value={condition} onChangeText={setCondition} placeholder="Given the materials, setting, or support..." style={styles.singleLineInput} />
        <WorkspaceLabel>TARGET BEHAVIOR</WorkspaceLabel><TextInput value={behavior} onChangeText={setBehavior} placeholder="The observable skill the student will demonstrate..." style={styles.singleLineInput} />
        <WorkspaceLabel>MEASURABLE CRITERION</WorkspaceLabel><TextInput value={criterion} onChangeText={setCriterion} placeholder="How often, how accurately, or to what level..." style={styles.singleLineInput} />
        <Pressable onPress={addGoal} style={styles.primaryAction}><Plus size={15} color="#fff" /><Text style={styles.primaryActionText}>Add goal to draft</Text></Pressable>
        <View style={styles.sectionDivider} />
        {goals.map((goal) => <View key={goal.id} style={styles.goalCard}>
          <View style={styles.goalHeader}><View style={{ flex: 1 }}><Text style={styles.goalTitle}>Annual reading fluency</Text><Text style={styles.goalStatement}>{goal.condition}, Maya will {goal.behavior}, with {goal.criterion.toLowerCase()}.</Text></View><View style={styles.activeGoalTag}><Text style={styles.activeGoalText}>ACTIVE</Text></View></View>
          <Text style={styles.chartLabel}>PROGRESS PROBES · CORRECT WORDS PER MINUTE</Text>
          <View style={styles.chart}>{goal.data.map((value, index) => <View key={`${goal.id}-${index}`} style={styles.chartColumn}><View style={[styles.chartBar, { height: Math.max(8, Math.min(value, 110) * 0.72) }]} /><Text style={styles.chartAxis}>{index + 1}</Text></View>)}</View>
          <View style={styles.progressEntry}><TextInput value={progressValue} onChangeText={setProgressValue} keyboardType="numeric" placeholder="Log a data point" style={styles.progressInput} /><Pressable onPress={() => logProgress(goal.id)} style={styles.smallAction}><Plus size={13} color="#fff" /><Text style={styles.smallActionText}>Log progress</Text></Pressable></View>
        </View>)}
        <Text style={styles.disclaimer}>Goal data is sample content and stays in local screen state; gradebook integration is not connected.</Text>
      </View> : null}

      {section === 'Accommodations' ? <View style={[styles.mainGrid, narrow && styles.mainGridNarrow]}>
        <View style={styles.mainColumn}><View style={styles.panel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Active accommodations</Text><Text style={styles.panelSubtitle}>Maya Thompson · Classroom plan</Text></View><Accessibility size={17} color={colors.forest} /></View>
          {accommodations.map((item, index) => { const Icon = item.icon; return <Pressable key={item.name} onPress={() => toggleAccommodation(index)} style={styles.accommodationRow}><View style={[styles.accommodationIcon, item.active && styles.accommodationIconActive]}><Icon size={16} color={item.active ? colors.forest : colors.muted} /></View><View style={{ flex: 1 }}><Text style={styles.accommodationName}>{item.name}</Text><Text style={styles.accommodationDetail}>{item.detail}</Text></View><View style={[styles.toggleTrack, item.active && styles.toggleTrackActive]}><View style={[styles.toggleThumb, item.active && styles.toggleThumbActive]} /></View></Pressable>; })}
          <Text style={styles.disclaimer}>In a connected system, active plan accommodations flow to authorized seating charts and assignment views. This preview does not transmit student information.</Text>
        </View></View>
        <View style={[styles.timelineColumn, narrow && styles.timelineColumnNarrow]}><View style={styles.seatingPanel}><Eyebrow>SEATING CHART · ROOM 12</Eyebrow><Text style={styles.seatingTitle}>Accommodation badges</Text><View style={styles.seatGrid}><View style={styles.seat}><Text style={styles.seatName}>Owen</Text></View><View style={[styles.seat, styles.seatStudent]}><Text style={styles.seatName}>Maya</Text><View style={styles.badgeRow}>{accommodations.filter((item) => item.active).map((item) => <View key={item.name} style={styles.seatBadge}><Text style={styles.seatBadgeText}>{item.name === 'Audio read-aloud' ? 'AUD' : item.name === 'Preferential seating' ? 'FRONT' : item.name === 'Extended time' ? '1.5×' : 'BREAK'}</Text></View>)}</View></View><View style={styles.seat}><Text style={styles.seatName}>Amir</Text></View><View style={styles.seat}><Text style={styles.seatName}>Leah</Text></View></View><View style={styles.teacherDesk}><Text style={styles.teacherDeskText}>TEACHER</Text></View></View></View>
      </View> : null}

      {section === 'Service log' ? <View style={[styles.mainGrid, narrow && styles.mainGridNarrow]}>
        <View style={styles.mainColumn}><View style={styles.panel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Related service log</Text><Text style={styles.panelSubtitle}>Link delivered services to an IEP goal</Text></View><HeartPulse size={17} color={colors.forest} /></View>
          <WorkspaceLabel>SERVICE TYPE</WorkspaceLabel><View style={styles.serviceChoices}>{['Speech-language', 'Occupational therapy', 'Physical therapy', 'Paraprofessional'].map((type) => <Pressable key={type} onPress={() => setServiceType(type)} style={[styles.serviceChoice, serviceType === type && styles.serviceChoiceActive]}><Text style={[styles.serviceChoiceText, serviceType === type && styles.serviceChoiceTextActive]}>{type}</Text></Pressable>)}</View>
          <WorkspaceLabel>LINKED GOAL</WorkspaceLabel><View style={styles.selectField}><Text style={styles.selectText}>Reading fluency · Annual goal 1</Text><ChevronDown size={14} color={colors.muted} /></View>
          <WorkspaceLabel>SERVICE MINUTES</WorkspaceLabel><TextInput value={serviceMinutes} onChangeText={setServiceMinutes} keyboardType="numeric" style={styles.singleLineInput} />
          <Pressable onPress={logService} style={styles.primaryAction}><Plus size={15} color="#fff" /><Text style={styles.primaryActionText}>Log service session</Text></Pressable>
          <View style={styles.claimPreview}><ShieldCheck size={15} color={colors.forest} /><View style={{ flex: 1 }}><Text style={styles.claimTitle}>Medicaid documentation preview</Text><Text style={styles.claimBody}>Service, minutes, provider, and linked goal are displayed for review. No claim is submitted.</Text></View></View>
          <Pressable onPress={() => setClaimPreview(!claimPreview)} style={styles.exportButton}><Download size={14} color={colors.forest} /><Text style={styles.exportButtonText}>{claimPreview ? 'Hide export preview' : 'Preview reimbursement export'}</Text></Pressable>
          {claimPreview ? <View style={styles.exportPreview}><Text style={styles.exportPreviewTitle}>CLAIM EXPORT · SAMPLE ONLY</Text><Text style={styles.exportPreviewBody}>{services.length} service entries · {services.reduce((total, service) => total + service.minutes, 0)} total minutes · Student identifiers omitted from this preview</Text></View> : null}
        </View></View>
        <View style={[styles.timelineColumn, narrow && styles.timelineColumnNarrow]}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Recent sessions</Text><Text style={styles.panelSubtitle}>{services.length} local entries</Text></View><FileText size={16} color={colors.forest} /></View>{services.map((service) => <View key={service.id} style={styles.serviceRecord}><View style={styles.serviceRecordIcon}><Clock3 size={14} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.serviceRecordTitle}>{service.service}</Text><Text style={styles.serviceRecordMeta}>{service.provider} · {service.date}</Text></View><Text style={styles.serviceMinutes}>{service.minutes} min</Text></View>)}<Text style={styles.disclaimer}>Provider credentials, units, consent, and state billing rules must be verified before reimbursement use.</Text></View></View>
      </View> : null}

      {section === 'Parent consent' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Parent consent</Text><Text style={styles.panelSubtitle}>Annual IEP meeting · Maya Thompson</Text></View><PenLine size={17} color={colors.forest} /></View>
        <View style={styles.consentDocument}><Eyebrow>CONSENT FORM · PREVIEW</Eyebrow><Text style={styles.consentTitle}>Review and provide consent</Text><Text style={styles.consentBody}>I acknowledge that I participated in reviewing this proposed plan and received a copy of the procedural safeguards. Please contact the school team with any questions about the services or accommodations described.</Text><Text style={styles.consentMeta}>Student: Maya Thompson · School: Evergreen Elementary · Plan date: October 19, 2026</Text></View>
        <WorkspaceLabel>GUARDIAN FULL NAME</WorkspaceLabel><TextInput value={guardianName} onChangeText={(value) => { setGuardianName(value); setConsentPrepared(false); }} placeholder="Enter the participating guardian's name" style={styles.singleLineInput} />
        <Pressable onPress={() => { setConsentChecked(!consentChecked); setConsentPrepared(false); }} style={styles.consentCheckRow}><View style={[styles.checkbox, consentChecked && styles.checkboxActive]}>{consentChecked ? <Check size={11} color="#fff" /> : null}</View><Text style={styles.checkText}>I confirm this guardian reviewed the consent statement above.</Text></Pressable>
        <Pressable onPress={prepareConsent} style={[styles.primaryAction, styles.signatureAction]}><PenLine size={14} color="#fff" /><Text style={styles.primaryActionText}>Prepare signature preview</Text></Pressable>
        {consentPrepared ? <View style={styles.signaturePreview}><Text style={styles.signatureLabel}>SIGNATURE PREVIEW</Text><Text style={styles.signatureName}>{guardianName}</Text><Text style={styles.signatureHint}>Not signed · No signature image, consent record, or encrypted document has been stored.</Text></View> : null}
        <Text style={styles.disclaimer}>Production e-signatures require authenticated guardian identity, a tamper-evident consent record, encryption at rest, retention rules, and a verified signature capture flow.</Text>
      </View> : null}

      <View style={styles.workspaceFooter}><Text style={styles.footerText}>SPECIAL EDUCATION DEMO · SAMPLE DATA · NOT A COMPLIANCE DETERMINATION</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 12 },
  studentHeader: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 11 },
  studentMark: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2e6d5' },
  studentMarkText: { color: '#684d35', fontSize: 10, fontWeight: '700' },
  studentHeaderCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.forest, fontSize: 7, fontWeight: '700', letterSpacing: 0.7 },
  studentName: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  studentMeta: { color: colors.muted, fontSize: 8, marginTop: 3 },
  draftStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.yellowSoft, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 3 },
  draftDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.yellow },
  draftStatusText: { color: '#8b702e', fontSize: 7, fontWeight: '700' },
  sectionTabs: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 1 },
  sectionTab: { minHeight: 31, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 4, backgroundColor: '#e9ede7' },
  sectionTabSelected: { backgroundColor: colors.forest },
  sectionTabText: { color: '#637067', fontSize: 8, fontWeight: '600' },
  sectionTabTextSelected: { color: '#fff' },
  notice: { borderRadius: 4, backgroundColor: colors.limeSoft, padding: 8 },
  noticeText: { color: colors.forest, fontSize: 8, lineHeight: 12 },
  mainGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mainGridNarrow: { flexDirection: 'column' },
  mainColumn: { flex: 1, minWidth: 0, gap: 10 },
  timelineColumn: { width: 250, gap: 10 },
  timelineColumnNarrow: { width: '100%' },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 13, marginBottom: 9 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  panelTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  panelSubtitle: { color: colors.muted, fontSize: 8, marginTop: 4 },
  collaborators: { flexDirection: 'row', alignItems: 'center' },
  collaboratorAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7efdf', borderWidth: 1, borderColor: '#fff' },
  collaboratorSecond: { marginLeft: -5, backgroundColor: '#e5edf3' },
  collaboratorThird: { marginLeft: -5, backgroundColor: '#f2e6d5' },
  collaboratorInitial: { color: colors.forest, fontSize: 6, fontWeight: '700' },
  collaboratorCount: { color: colors.muted, fontSize: 7, marginLeft: 4 },
  collaborationNotice: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f2f6ee', paddingHorizontal: 8, borderRadius: 3, marginBottom: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#86a86d' },
  collaborationText: { color: '#65745f', fontSize: 7 },
  formField: { marginBottom: 9 },
  label: { color: '#6d7970', fontSize: 7, fontWeight: '700', letterSpacing: 0.5, marginTop: 7, marginBottom: 5 },
  textArea: { minHeight: 58, borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 8, color: '#506056', fontSize: 8, lineHeight: 13 },
  saveDraft: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 3 },
  saveDraftText: { color: colors.forest, fontSize: 7, fontWeight: '600' },
  templateSwitch: { flexDirection: 'row', gap: 5, marginBottom: 11 },
  templateOption: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 3, backgroundColor: '#f0f2ee' },
  templateOptionActive: { backgroundColor: '#e8f0e2' },
  templateOptionText: { color: '#758078', fontSize: 7 },
  templateOptionTextActive: { color: colors.forest, fontWeight: '700' },
  complianceSummary: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  complianceSummaryText: { color: colors.ink, fontSize: 8, fontWeight: '600' },
  complianceTrack: { height: 4, flex: 1, borderRadius: 3, backgroundColor: '#edf0eb', overflow: 'hidden' },
  complianceFill: { height: 4, backgroundColor: colors.forest },
  checkRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  checkbox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: '#c8d1c8', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  checkText: { color: '#556158', fontSize: 7, flex: 1, lineHeight: 11 },
  checkState: { color: '#a26b47', fontSize: 6 },
  checkStateComplete: { color: '#64834d' },
  disclaimer: { color: '#89938b', fontSize: 7, lineHeight: 11, marginTop: 9 },
  timelineItem: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  timelineMarker: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.blue },
  timelineMarkerOrange: { backgroundColor: colors.orange },
  timelineMarkerYellow: { backgroundColor: colors.yellow },
  timelineCopy: { flex: 1 },
  timelineTitle: { color: colors.ink, fontSize: 8, fontWeight: '600' },
  timelineDate: { color: colors.muted, fontSize: 7, marginTop: 3 },
  timelineTag: { color: '#607e95', backgroundColor: colors.blueSoft, paddingHorizontal: 5, paddingVertical: 4, borderRadius: 3, fontSize: 6 },
  timelineTagOrange: { color: '#a1533b', backgroundColor: colors.orangeSoft },
  timelineTagYellow: { color: '#8b702e', backgroundColor: colors.yellowSoft },
  reminderButton: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb', marginTop: 4 },
  reminderButtonText: { color: colors.forest, fontSize: 7, fontWeight: '600' },
  teamPanel: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eaf0e8', borderRadius: 5, padding: 10 },
  teamTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' },
  teamCopy: { color: '#6e7a71', fontSize: 7, lineHeight: 11, marginTop: 3 },
  goalPrompt: { color: '#657168', fontSize: 8, lineHeight: 12, marginBottom: 8 },
  selectField: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 8 },
  selectText: { color: '#56635a', fontSize: 8 },
  singleLineInput: { minHeight: 33, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 8, color: colors.ink, fontSize: 8 },
  primaryAction: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.forest, borderRadius: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 9 },
  primaryActionText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  sectionDivider: { height: 1, backgroundColor: '#edf0eb', marginVertical: 13 },
  goalCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 11, marginBottom: 9 },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goalTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  goalStatement: { color: '#69756c', fontSize: 8, lineHeight: 13, marginTop: 5 },
  activeGoalTag: { backgroundColor: colors.limeSoft, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3 },
  activeGoalText: { color: colors.forest, fontSize: 6, fontWeight: '700' },
  chartLabel: { color: '#7a857d', fontSize: 6, fontWeight: '700', letterSpacing: 0.4, marginTop: 12 },
  chart: { height: 93, flexDirection: 'row', alignItems: 'flex-end', gap: 9, borderBottomWidth: 1, borderBottomColor: '#dfe5dc', paddingHorizontal: 4, paddingTop: 10 },
  chartColumn: { flex: 1, height: 82, justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  chartBar: { width: '100%', maxWidth: 20, backgroundColor: '#93b47c', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartAxis: { color: '#89938b', fontSize: 6 },
  progressEntry: { flexDirection: 'row', gap: 6, marginTop: 9 },
  progressInput: { width: 116, height: 29, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 7, fontSize: 8 },
  smallAction: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.forest, borderRadius: 4, paddingHorizontal: 8 },
  smallActionText: { color: '#fff', fontSize: 7, fontWeight: '600' },
  accommodationRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  accommodationIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#f0f2ee' },
  accommodationIconActive: { backgroundColor: colors.limeSoft },
  accommodationName: { color: colors.ink, fontSize: 8, fontWeight: '600' },
  accommodationDetail: { color: colors.muted, fontSize: 7, marginTop: 3 },
  toggleTrack: { width: 27, height: 16, borderRadius: 8, padding: 2, justifyContent: 'center', backgroundColor: '#d8dfd7' },
  toggleTrackActive: { backgroundColor: colors.forest },
  toggleThumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  seatingPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 13 },
  seatingTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 5 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 14 },
  seat: { width: 74, minHeight: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#e4e9e1', backgroundColor: '#f5f6f2', padding: 5 },
  seatStudent: { backgroundColor: '#eef5e8', borderColor: '#aec39b' },
  seatName: { color: '#506056', fontSize: 7, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 4 },
  seatBadge: { backgroundColor: colors.forest, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
  seatBadgeText: { color: '#fff', fontSize: 5, fontWeight: '700' },
  teacherDesk: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 3, backgroundColor: '#e9ede7' },
  teacherDeskText: { color: '#758078', fontSize: 6, fontWeight: '700' },
  serviceChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 4 },
  serviceChoice: { minHeight: 25, justifyContent: 'center', borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 7 },
  serviceChoiceActive: { backgroundColor: '#e6efe0' },
  serviceChoiceText: { color: '#69756c', fontSize: 7 },
  serviceChoiceTextActive: { color: colors.forest, fontWeight: '700' },
  claimPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 9, borderRadius: 4, backgroundColor: '#f2f6ee', marginTop: 12 },
  claimTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' },
  claimBody: { color: '#758078', fontSize: 7, lineHeight: 11, marginTop: 3 },
  exportButton: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  exportButtonText: { color: colors.forest, fontSize: 7, fontWeight: '600' },
  exportPreview: { padding: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 4 },
  exportPreviewTitle: { color: colors.forest, fontSize: 6, fontWeight: '700', letterSpacing: 0.4 },
  exportPreviewBody: { color: '#69756c', fontSize: 7, lineHeight: 11, marginTop: 4 },
  serviceRecord: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb' },
  serviceRecordIcon: { width: 25, height: 25, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  serviceRecordTitle: { color: colors.ink, fontSize: 7, fontWeight: '600' },
  serviceRecordMeta: { color: colors.muted, fontSize: 6, marginTop: 3 },
  serviceMinutes: { color: colors.forest, fontSize: 7, fontWeight: '700' },
  consentDocument: { borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: '#fbfcfa', padding: 13, marginBottom: 11 },
  consentTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 8 },
  consentBody: { color: '#5e6b61', fontSize: 8, lineHeight: 14, marginTop: 7 },
  consentMeta: { color: '#89938b', fontSize: 7, marginTop: 10 },
  consentCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  signatureAction: { marginTop: 10 },
  signaturePreview: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#afbbb0', borderRadius: 4, padding: 11, marginTop: 10, backgroundColor: '#f7f9f5' },
  signatureLabel: { color: '#7d887f', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 },
  signatureName: { color: colors.forest, fontSize: 17, fontStyle: 'italic', marginTop: 6 },
  signatureHint: { color: '#89938b', fontSize: 7, lineHeight: 11, marginTop: 5 },
  workspaceFooter: { alignItems: 'center', paddingTop: 2 },
  footerText: { color: '#97a097', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 },
});