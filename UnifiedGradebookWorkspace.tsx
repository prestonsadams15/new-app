import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle as SvgCircle, Path, Rect } from 'react-native-svg';
import { BookOpen, Camera, Check, CheckCircle2, Circle, FileText, Mic, Pause, Play, Plus, Send, Sparkles, Square, Upload, Volume2, X } from 'lucide-react-native';

type Role = 'teacher' | 'student' | 'parent';
export type ViewId = 'gradebook' | 'queue' | 'canvas';
type CaptureMode = 'photo' | 'record' | 'draw' | 'file';
type MediaArtifact = { name: string; url: string; kind: 'image' | 'audio' | 'video' | 'file' };
type Student = { id: string; name: string; initials: string };
type Assignment = { id: string; title: string; due: string; standard: string };
type Submission = {
  studentId: string;
  assignmentId: string;
  predicted: number;
  validated: number | null;
  percentage: number | null;
  reflection: string;
  media: MediaArtifact[];
  status: 'Submitted' | 'Reviewed' | 'Revision requested';
  feedback: string;
};
type Stroke = { path: string; color: string; width: number };
type ShapeAnnotation = { type: 'rectangle' | 'circle'; x: number; y: number; color: string };

const colors = { ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f', lime: '#c5e889', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6', orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df', paper: '#fff' };
const mastery = [
  { level: 1, name: 'Emerging', color: '#a95441', background: '#fff0e9' },
  { level: 2, name: 'Approaching', color: '#8a6d21', background: '#fbf4df' },
  { level: 3, name: 'Proficient', color: '#527840', background: '#eef6e3' },
  { level: 4, name: 'Exceeding', color: '#4f7188', background: '#eaf1f6' },
];
const students: Student[] = [
  { id: 'maya', name: 'Maya Thompson', initials: 'MT' },
  { id: 'ethan', name: 'Ethan Chen', initials: 'EC' },
  { id: 'sofia', name: 'Sofia Martinez', initials: 'SM' },
  { id: 'noah', name: 'Noah Williams', initials: 'NW' },
];
const assignments: Assignment[] = [
  { id: 'place-value', title: 'Place value model', due: 'Oct 20', standard: '5.NBT.1' },
  { id: 'matter-model', title: 'Particle model', due: 'Oct 21', standard: '5.PS1.1' },
  { id: 'central-idea', title: 'Central idea response', due: 'Oct 22', standard: 'RI.5.2' },
];
const initialSubmissions: Submission[] = [
  { studentId: 'maya', assignmentId: 'place-value', predicted: 3, validated: 3, percentage: 88, reflection: 'I can explain why the 4 changes value when it moves. I want to check my model labels.', media: [{ name: 'Place value drawing', url: '', kind: 'image' }], status: 'Reviewed', feedback: 'Clear model. Label the tenths place next time.' },
  { studentId: 'ethan', assignmentId: 'place-value', predicted: 4, validated: 2, percentage: 68, reflection: 'I think I got it because I finished quickly.', media: [{ name: 'Place value explanation', url: '', kind: 'audio' }], status: 'Submitted', feedback: '' },
  { studentId: 'sofia', assignmentId: 'place-value', predicted: 2, validated: 3, percentage: 82, reflection: 'I was unsure about the last step, but my diagram matches the example.', media: [{ name: 'Notebook photo', url: '', kind: 'image' }], status: 'Submitted', feedback: '' },
  { studentId: 'noah', assignmentId: 'place-value', predicted: 1, validated: null, percentage: null, reflection: 'I need help with moving the decimal.', media: [], status: 'Submitted', feedback: '' },
  { studentId: 'maya', assignmentId: 'matter-model', predicted: 3, validated: 3, percentage: 91, reflection: 'My particle model shows more movement when heated.', media: [], status: 'Reviewed', feedback: 'Good evidence and explanation.' },
  { studentId: 'sofia', assignmentId: 'central-idea', predicted: 2, validated: null, percentage: null, reflection: 'I have the main idea but I want to find stronger details.', media: [], status: 'Submitted', feedback: '' },
];

function MasteryTag({ level, percent }: { level: number; percent?: number | null }) {
  const value = mastery[level - 1] ?? mastery[0];
  return <View style={[styles.masteryTag, { backgroundColor: value.background }]}><Text style={[styles.masteryTagLevel, { color: value.color }]}>{level}</Text>{percent !== undefined && percent !== null ? <Text style={styles.masteryPercent}>{percent}%</Text> : null}</View>;
}

function HeaderLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.headerLabel}>{children}</Text>;
}

export function UnifiedGradebookWorkspace({ narrow, role, initialView }: { narrow: boolean; role: Role; initialView: ViewId }) {
  const [view, setView] = useState<ViewId>(role === 'student' ? 'canvas' : role === 'parent' ? 'queue' : initialView);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignments[0].id);
  const [selectedStudentId, setSelectedStudentId] = useState(role === 'teacher' ? 'ethan' : 'maya');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [artifacts, setArtifacts] = useState<MediaArtifact[]>([]);
  const [predictedLevel, setPredictedLevel] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectionAudio, setReflectionAudio] = useState<MediaArtifact | null>(null);
  const [reflectionSeconds, setReflectionSeconds] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingKind, setRecordingKind] = useState<'audio' | 'screen' | 'reflection' | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<ShapeAnnotation[]>([]);
  const [shapeTool, setShapeTool] = useState<'pen' | 'rectangle' | 'circle'>('pen');
  const [penColor, setPenColor] = useState('#284b3c');
  const [highlighter, setHighlighter] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [textAnnotations, setTextAnnotations] = useState<string[]>([]);
  const [cropFit, setCropFit] = useState(true);
  const [enhanceContrast, setEnhanceContrast] = useState(false);
  const [validatedLevel, setValidatedLevel] = useState(3);
  const [percentage, setPercentage] = useState('82');
  const [feedback, setFeedback] = useState('');
  const [scoreTrackWidth, setScoreTrackWidth] = useState(0);
  const [notice, setNotice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<'Needs review' | 'All'>(role === 'parent' ? 'All' : 'Needs review');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0];
  const selectedSubmission = submissions.find((submission) => submission.studentId === selectedStudentId && submission.assignmentId === selectedAssignmentId);
  const queue = submissions.filter((submission) => filter === 'All' || submission.status === 'Submitted');
  const currentStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const hasReflection = reflection.trim().length > 0 || Boolean(reflectionAudio && reflectionSeconds >= 15);
  const canTurnIn = predictedLevel !== null && hasReflection && artifacts.length > 0;
  const currentAssignmentSubmissions = submissions.filter((submission) => submission.assignmentId === selectedAssignmentId);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    setView(role === 'student' ? 'canvas' : role === 'parent' ? 'queue' : initialView);
  }, [initialView, role]);

  const updateSubmission = (studentId: string, assignmentId: string, updates: Partial<Submission>) => setSubmissions((current) => current.map((submission) => submission.studentId === studentId && submission.assignmentId === assignmentId ? { ...submission, ...updates } : submission));

  const selectAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setSubmitted(false);
    setArtifacts([]);
    setStrokes([]);
    setShapes([]);
    setTextAnnotations([]);
    setPredictedLevel(null);
    setReflection('');
    setReflectionAudio(null);
  };

  const addArtifact = (artifact: MediaArtifact) => {
    setArtifacts((current) => [...current, artifact]);
    setNotice(`${artifact.name} attached locally. It has not been uploaded.`);
  };

  const pickFile = (kind: 'photo' | 'file') => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setNotice('Camera and file capture require a native picker integration on this device.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'photo' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,application/pdf';
    if (kind === 'photo') (input as HTMLInputElement & { capture?: string }).capture = 'environment';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      addArtifact({ name: file.name, url, kind: file.type.startsWith('image/') ? 'image' : 'file' });
    };
    input.click();
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const startRecording = async (kind: 'audio' | 'screen' | 'reflection') => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || typeof MediaRecorder === 'undefined') {
      setNotice('Recording is unavailable on this device preview. Use the text reflection or attach a recording file.');
      return;
    }
    try {
      const devices = navigator.mediaDevices as MediaDevices & { getDisplayMedia?: (constraints?: MediaStreamConstraints) => Promise<MediaStream> };
      const stream = kind === 'screen'
        ? devices.getDisplayMedia ? await devices.getDisplayMedia({ video: true, audio: true }) : null
        : await devices.getUserMedia({ audio: true });
      if (!stream) { setNotice('Screen recording is not supported by this browser.'); return; }
      streamRef.current = stream;
      chunksRef.current = [];
      recordingSecondsRef.current = 0;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      setRecordingKind(kind);
      setRecordingSeconds(0);
      setRecording(true);
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const seconds = recordingSecondsRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const artifact = { name: `${kind === 'reflection' ? 'Student reflection' : kind === 'screen' ? 'Screen annotation' : 'Voice explanation'}.webm`, url: URL.createObjectURL(blob), kind: kind === 'screen' ? 'video' as const : 'audio' as const };
        if (kind === 'reflection') { setReflectionAudio(artifact); setReflectionSeconds(seconds); }
        else addArtifact(artifact);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        setRecordingKind(null);
        setNotice(kind === 'reflection' && seconds < 15 ? 'Reflection audio must be at least 15 seconds. Record again or enter a text reflection.' : `${artifact.name} saved in this local draft.`);
      };
      recorder.start();
      timerRef.current = setInterval(() => {
        setRecordingSeconds((current) => {
          const next = current + 1;
          recordingSecondsRef.current = next;
          if (next >= 300) stopRecording();
          return next;
        });
      }, 1000);
      setNotice(kind === 'reflection' ? 'Record at least 15 seconds to complete the Hattie reflection gate.' : 'Recording started. Maximum length: 5 minutes.');
    } catch {
      setNotice('Microphone or screen permission was not granted. Check browser access and try again.');
      setRecording(false);
      setRecordingKind(null);
    }
  };

  const recordingSecondsRef = useRef(0);

  const turnIn = () => {
    if (!canTurnIn) {
      setNotice(!artifacts.length ? 'Add an artifact before turning in.' : predictedLevel === null ? 'Predict your proficiency level first.' : 'Add a text reflection or record at least 15 seconds of audio.');
      return;
    }
    const studentId = currentStudent.id;
    const submission: Submission = {
      studentId,
      assignmentId: selectedAssignmentId,
      predicted: predictedLevel as number,
      validated: null,
      percentage: null,
      reflection: reflection.trim(),
      media: [...artifacts, ...(reflectionAudio ? [reflectionAudio] : [])],
      status: 'Submitted',
      feedback: '',
    };
    setSubmissions((current) => [submission, ...current.filter((item) => !(item.studentId === studentId && item.assignmentId === selectedAssignmentId))]);
    setSubmitted(true);
    setNotice('Turned in locally. Your teacher will review this draft when the gradebook service is connected.');
  };

  const validateSubmission = () => {
    if (!selectedSubmission) return;
    const score = Number(percentage);
    if (!Number.isFinite(score) || score < 0 || score > 100) { setNotice('Enter a percentage from 0 to 100.'); return; }
    updateSubmission(selectedStudentId, selectedAssignmentId, { validated: validatedLevel, percentage: score, feedback, status: 'Reviewed' });
    setNotice(`Reviewed ${currentStudent.name}'s submission. Mastery level ${validatedLevel} recorded locally.`);
  };

  const addTextAnnotation = () => {
    if (!annotationText.trim()) return;
    setTextAnnotations((current) => [...current, annotationText.trim()]);
    setNotice(`Text annotation “${annotationText.trim()}” added to the local canvas.`);
    setAnnotationText('');
  };

  const attachDrawing = () => {
    if (!strokes.length && !shapes.length && !textAnnotations.length) { setNotice('Draw, add text, or place a shape before attaching it.'); return; }
    const pathMarkup = strokes.map((stroke) => `<path d="${stroke.path}" stroke="${stroke.color}" stroke-width="${stroke.width}" stroke-opacity="${stroke.width > 5 ? 0.35 : 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const shapeMarkup = shapes.map((shape) => shape.type === 'rectangle'
      ? `<rect x="${shape.x - 32}" y="${shape.y - 22}" width="64" height="44" stroke="${shape.color}" fill="none" stroke-width="3"/>`
      : `<circle cx="${shape.x}" cy="${shape.y}" r="24" stroke="${shape.color}" fill="none" stroke-width="3"/>`).join('');
    const escapeXml = (value: string) => value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
    const textMarkup = textAnnotations.map((text, index) => `<text x="24" y="${32 + index * 24}" fill="${penColor}" font-size="18">${escapeXml(text)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">${pathMarkup}${shapeMarkup}${textMarkup}</svg>`;
    const url = Platform.OS === 'web' && typeof URL !== 'undefined' ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })) : `data:image/svg+xml,${encodeURIComponent(svg)}`;
    addArtifact({ name: 'Drawing canvas.svg', url, kind: 'image' });
    setNotice('Drawing attached to this local submission draft.');
  };

  const onDrawStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    if (shapeTool !== 'pen') {
      setShapes((current) => [...current, { type: shapeTool, x: locationX, y: locationY, color: penColor }]);
      return;
    }
    setStrokes((current) => [...current, { path: `M ${locationX} ${locationY}`, color: penColor, width: highlighter ? 12 : 3 }]);
  };
  const onDrawMove = (event: any) => {
    if (shapeTool !== 'pen') return;
    const { locationX, locationY } = event.nativeEvent;
    setStrokes((current) => current.map((stroke, index) => index === current.length - 1 ? { ...stroke, path: `${stroke.path} L ${locationX} ${locationY}` } : stroke));
  };

  const updateScoreFromTrack = (event: any) => {
    if (scoreTrackWidth <= 0) return;
    const point = Math.max(0, Math.min(scoreTrackWidth, event.nativeEvent.locationX));
    setPercentage(String(Math.round(point / scoreTrackWidth * 100)));
  };

  const views: { id: ViewId; label: string }[] = role === 'teacher'
    ? [{ id: 'gradebook', label: 'Gradebook grid' }, { id: 'queue', label: 'Portfolio review' }]
    : role === 'parent' ? [{ id: 'queue', label: 'Portfolio' }] : [{ id: 'canvas', label: 'My assignment' }];

  return (
    <View style={styles.workspace}>
      <View style={[styles.header, narrow && styles.headerNarrow]}>
        <View style={styles.headerIcon}><BookOpen size={16} color={colors.forest} /></View>
        <View style={{ flex: 1, minWidth: 135 }}><Text style={styles.headerTitle}>Unified gradebook</Text><Text style={styles.headerSubtitle}>Grade 5 Math · Evergreen Elementary · Term 1</Text></View>
        <View style={styles.headerActions}><Text style={styles.standardBadge}>5.NBT.1</Text><Text style={styles.sampleBadge}>LOCAL PREVIEW</Text></View>
      </View>
      <View style={styles.viewTabs}>{views.map((item) => <Pressable key={item.id} onPress={() => { setView(item.id); setNotice(''); }} style={[styles.viewTab, view === item.id && styles.viewTabActive]}><Text style={[styles.viewTabText, view === item.id && styles.viewTabTextActive]}>{item.label}</Text></Pressable>)}</View>
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text><Pressable onPress={() => setNotice('')}><X size={12} color={colors.forest} /></Pressable></View> : null}

      {role === 'teacher' && view === 'gradebook' ? <View style={styles.panel}>
        <View style={styles.panelHeader}><View><HeaderLabel>STANDARDS-ALIGNED MASTERY</HeaderLabel><Text style={styles.panelTitle}>Gradebook · Grade 5 Math</Text><Text style={styles.panelSubtitle}>Select an assignment to open its portfolio review queue.</Text></View><View style={styles.legendRow}>{mastery.map((item) => <View key={item.level} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: item.background }]} /><Text style={styles.legendText}>{item.level} {item.name}</Text></View>)}</View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.matrixScroll}><View>
          <View style={styles.matrixRow}><View style={[styles.matrixStudentCell, styles.matrixHead]}><Text style={styles.tableHead}>STUDENT</Text></View>{assignments.map((assignment) => <Pressable key={assignment.id} onPress={() => { setSelectedAssignmentId(assignment.id); setView('queue'); }} style={[styles.matrixAssignmentCell, styles.matrixHead]}><Text numberOfLines={2} style={styles.assignmentHead}>{assignment.title}</Text><Text style={styles.standardText}>{assignment.standard} · due {assignment.due}</Text></Pressable>)}</View>
          {students.map((student) => <View key={student.id} style={styles.matrixRow}><View style={styles.matrixStudentCell}><View style={styles.studentAvatar}><Text style={styles.studentInitials}>{student.initials}</Text></View><Text style={styles.studentName}>{student.name}</Text></View>{assignments.map((assignment) => {
            const submission = submissions.find((item) => item.studentId === student.id && item.assignmentId === assignment.id);
            return <Pressable key={assignment.id} onPress={() => { setSelectedStudentId(student.id); setSelectedAssignmentId(assignment.id); setView('queue'); }} style={styles.matrixAssignmentCell}>{submission ? <MasteryTag level={submission.validated ?? submission.predicted} percent={submission.percentage} /> : <View style={styles.missingCell}><Text style={styles.missingText}>Not submitted</Text></View>}</Pressable>;
          })}</View>)}
        </View></ScrollView>
        <View style={styles.gapNote}><Sparkles size={12} color={colors.blue} /><Text style={styles.gapNoteText}>Perception gap flags a difference of 2+ mastery levels between student prediction and teacher validation.</Text></View>
      </View> : null}

      {(role === 'teacher' && view === 'queue') || role === 'parent' ? <View style={[styles.reviewLayout, narrow && styles.reviewLayoutNarrow]}>
        <View style={[styles.queuePanel, narrow && styles.queuePanelNarrow]}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>{role === 'parent' ? 'Family portfolio' : 'Portfolio approval queue'}</Text><Text style={styles.panelSubtitle}>{role === 'parent' ? 'Recent student artifacts' : 'Review student work and predicted mastery'}</Text></View><View style={styles.filterTabs}>{(['Needs review', 'All'] as const).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterButton, filter === item && styles.filterButtonActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View></View>
          {queue.map((item, index) => {
            const student = students.find((entry) => entry.id === item.studentId) ?? students[0];
            const assignment = assignments.find((entry) => entry.id === item.assignmentId) ?? assignments[0];
            const gap = item.validated !== null && Math.abs(item.predicted - item.validated) >= 2;
            return <Pressable key={`${item.studentId}-${item.assignmentId}-${index}`} onPress={() => { setSelectedStudentId(item.studentId); setSelectedAssignmentId(item.assignmentId); setValidatedLevel(item.validated ?? item.predicted); setPercentage(String(item.percentage ?? Math.round((item.validated ?? item.predicted) * 25))); setFeedback(item.feedback); }} style={[styles.queueRow, item.studentId === selectedStudentId && item.assignmentId === selectedAssignmentId && styles.queueRowSelected]}>
              <View style={styles.studentAvatar}><Text style={styles.studentInitials}>{student.initials}</Text></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.queueTitle}>{student.name} · {assignment.title}</Text><Text numberOfLines={1} style={styles.queueReflection}>{item.reflection || 'No reflection provided'}</Text></View><MasteryTag level={item.predicted} />{gap ? <Text style={styles.gapFlag}>GAP</Text> : null}
            </Pressable>;
          })}
          {queue.length === 0 ? <Text style={styles.emptyText}>No submissions in this queue.</Text> : null}
        </View>
        <View style={styles.reviewPanel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>{currentStudent.name}</Text><Text style={styles.panelSubtitle}>{selectedAssignment.title} · {selectedSubmission?.status ?? 'No submission'}</Text></View><Text style={styles.statusBadge}>{selectedSubmission?.status ?? 'Missing'}</Text></View>
          {selectedSubmission ? <>
            <View style={styles.predictionRow}><Text style={styles.fieldLabel}>STUDENT PREDICTION</Text><MasteryTag level={selectedSubmission.predicted} /></View>
            <View style={styles.mediaPreview}>{selectedSubmission.media.length ? selectedSubmission.media.map((media, index) => <View key={`${media.name}-${index}`} style={styles.mediaItem}>{media.kind === 'image' && media.url ? <Image source={{ uri: media.url }} resizeMode={cropFit ? 'cover' : 'contain'} style={[styles.mediaImage, enhanceContrast && ({ filter: 'contrast(1.2) saturate(1.1)' } as any)]} /> : media.kind === 'audio' ? <View style={styles.audioPreview}><Volume2 size={18} color={colors.forest} /><Text numberOfLines={1} style={styles.mediaName}>{media.name}</Text>{media.url && Platform.OS === 'web' ? React.createElement('audio' as any, { src: media.url, controls: true, style: { width: 95 } }) : <Pressable onPress={() => setNotice('Audio playback requires a native media player integration on this device.')}><Play size={14} color={colors.forest} /></Pressable>}</View> : <View style={styles.filePreview}><FileText size={17} color={colors.blue} /><Text numberOfLines={1} style={styles.mediaName}>{media.name}</Text></View>}</View>) : <Text style={styles.emptyText}>No media attached to this submission.</Text>}</View>
            <View style={styles.reflectionBox}><HeaderLabel>STUDENT REFLECTION</HeaderLabel><Text style={styles.reflectionText}>{selectedSubmission.reflection || 'No reflection provided.'}</Text></View>
            {selectedSubmission.predicted !== null && selectedSubmission.validated !== null && Math.abs(selectedSubmission.predicted - selectedSubmission.validated) >= 2 ? <View style={styles.perceptionGap}><Sparkles size={13} color={colors.orange} /><Text style={styles.perceptionGapText}>Perception gap: student prediction differs from validated mastery by {Math.abs(selectedSubmission.predicted - selectedSubmission.validated)} levels. Consider a confidence or understanding check-in.</Text></View> : null}
            {role === 'teacher' ? <>
              <Text style={styles.fieldLabel}>VALIDATED MASTERY LEVEL</Text><View style={styles.masterySelector}>{mastery.map((item) => <Pressable key={item.level} onPress={() => { setValidatedLevel(item.level); setPercentage(String(Math.round(item.level * 25))); }} style={[styles.masteryChoice, validatedLevel === item.level && { borderColor: item.color, backgroundColor: item.background }]}><Text style={[styles.masteryChoiceLevel, { color: item.color }]}>{item.level}</Text><Text style={styles.masteryChoiceName}>{item.name}</Text></Pressable>)}</View>
              <Text style={styles.fieldLabel}>TRADITIONAL SCORE · 0–100%</Text><View style={styles.percentInputRow}><TextInput value={percentage} onChangeText={(value) => setPercentage(value.replace(/[^0-9]/g, '').slice(0, 3))} keyboardType="numeric" maxLength={3} style={styles.percentInput} /><Text style={styles.percentSign}>%</Text></View><View accessibilityRole="adjustable" accessibilityLabel="Validated score percentage" accessibilityValue={{ min: 0, max: 100, now: Number(percentage) || 0 }} onLayout={(event) => setScoreTrackWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={updateScoreFromTrack} onResponderMove={updateScoreFromTrack} style={styles.scoreSlider}><View style={[styles.scoreSliderFill, { width: `${Math.max(0, Math.min(100, Number(percentage) || 0))}%` }]} /><View style={[styles.scoreSliderThumb, { left: `${Math.max(0, Math.min(100, Number(percentage) || 0))}%` }]} /></View>
              <Text style={styles.fieldLabel}>TEACHER FEEDBACK</Text><TextInput value={feedback} onChangeText={setFeedback} placeholder="Add a comment or next step" multiline style={styles.feedbackInput} />
              <Pressable onPress={validateSubmission} style={styles.reviewButton}><CheckCircle2 size={13} color="#fff" /><Text style={styles.reviewButtonText}>Save validated score</Text></Pressable>
            </> : <Text style={styles.familyReadOnly}>Teacher review is visible after your school shares the validated score.</Text>}
          </> : <Text style={styles.emptyText}>Choose a submitted portfolio item to review.</Text>}
        </View>
      </View> : null}

      {role === 'student' && view === 'canvas' ? <View style={[styles.canvasLayout, narrow && styles.canvasLayoutNarrow]}>
        <View style={styles.assignmentPanel}>
          <View style={styles.panelHeader}><View><HeaderLabel>YOUR WORK</HeaderLabel><Text style={styles.panelTitle}>Assignments</Text></View><Text style={styles.dueBadge}>3 OPEN</Text></View>
          {assignments.map((assignment) => <Pressable key={assignment.id} onPress={() => selectAssignment(assignment.id)} style={[styles.assignmentRow, selectedAssignmentId === assignment.id && styles.assignmentRowSelected]}><View style={{ flex: 1 }}><Text style={styles.assignmentTitle}>{assignment.title}</Text><Text style={styles.assignmentMeta}>{assignment.standard} · Due {assignment.due}</Text></View><CheckCircle2 size={13} color={submissions.some((submission) => submission.studentId === currentStudent.id && submission.assignmentId === assignment.id) ? colors.forest : colors.line} /></Pressable>)}
        </View>
        <View style={styles.canvasPanel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>{selectedAssignment.title}</Text><Text style={styles.panelSubtitle}>{selectedAssignment.standard} · Submit your learning evidence</Text></View><Text style={styles.dueBadge}>DUE {selectedAssignment.due.toUpperCase()}</Text></View>
          <View style={styles.captureModes}>{([
            ['photo', 'Photo'], ['record', 'Voice / screen'], ['draw', 'Draw'], ['file', 'File / PDF'],
          ] as [CaptureMode, string][]).map(([id, label]) => <Pressable key={id} onPress={() => setCaptureMode(id)} style={[styles.captureMode, captureMode === id && styles.captureModeActive]}>{id === 'photo' ? <Camera size={13} color={captureMode === id ? colors.forest : colors.muted} /> : id === 'record' ? <Mic size={13} color={captureMode === id ? colors.forest : colors.muted} /> : id === 'draw' ? <Sparkles size={13} color={captureMode === id ? colors.forest : colors.muted} /> : <Upload size={13} color={captureMode === id ? colors.forest : colors.muted} />}<Text style={[styles.captureModeText, captureMode === id && styles.captureModeTextActive]}>{label}</Text></Pressable>)}</View>
          {captureMode === 'photo' || captureMode === 'file' ? <View style={styles.capturePanel}><View style={styles.captureDescription}><Text style={styles.captureTitle}>{captureMode === 'photo' ? 'Photo / document capture' : 'Attach a file or PDF'}</Text><Text style={styles.captureCopy}>{captureMode === 'photo' ? 'Take a photo with your camera or choose an image. Preview framing and contrast before attaching.' : 'Choose a worksheet, PDF, or image. Files stay in this browser preview.'}</Text></View><Pressable onPress={() => pickFile(captureMode)} style={styles.captureButton}>{captureMode === 'photo' ? <Camera size={13} color="#fff" /> : <Upload size={13} color="#fff" />}<Text style={styles.captureButtonText}>{captureMode === 'photo' ? 'Open camera / photos' : 'Choose file'}</Text></Pressable>
            {artifacts.filter((artifact) => artifact.kind === 'image').map((artifact, index) => <View key={`draft-image-${artifact.name}-${index}`} style={styles.mediaItem}><Image source={{ uri: artifact.url }} resizeMode={cropFit ? 'cover' : 'contain'} style={[styles.mediaImage, enhanceContrast && ({ filter: 'contrast(1.2) saturate(1.1)' } as any)]} /><Text numberOfLines={1} style={styles.mediaName}>{artifact.name}</Text></View>)}
            {artifacts.filter((artifact) => artifact.kind === 'image').length ? <View style={styles.imageOptions}><Pressable onPress={() => setCropFit(!cropFit)} style={[styles.optionChip, cropFit && styles.optionChipSelected]}><Text style={styles.optionText}>{cropFit ? 'Crop fit on' : 'Original framing'}</Text></Pressable><Pressable onPress={() => setEnhanceContrast(!enhanceContrast)} style={[styles.optionChip, enhanceContrast && styles.optionChipSelected]}><Text style={styles.optionText}>{enhanceContrast ? 'Contrast enhanced' : 'Enhance contrast'}</Text></Pressable></View> : null}
          </View> : null}
          {captureMode === 'record' ? <View style={styles.capturePanel}><View style={styles.captureDescription}><Text style={styles.captureTitle}>Voice and screen recording</Text><Text style={styles.captureCopy}>Record up to 5 minutes while explaining, drawing, or highlighting your work. Screen capture may require browser permission.</Text></View><View style={styles.recordActions}><Pressable onPress={() => { void startRecording('audio'); }} style={styles.captureButton}><Mic size={13} color="#fff" /><Text style={styles.captureButtonText}>Record voice</Text></Pressable><Pressable onPress={() => { void startRecording('screen'); }} style={styles.secondaryCaptureButton}><Play size={12} color={colors.forest} /><Text style={styles.secondaryCaptureText}>Record screen</Text></Pressable></View>{recording && recordingKind !== 'reflection' ? <View style={styles.recordingStatus}><View style={styles.recordingDot} /><Text style={styles.recordingText}>Recording · 00:{String(recordingSeconds).padStart(2, '0')} / 05:00</Text><Pressable onPress={stopRecording}><Pause size={13} color={colors.orange} /></Pressable></View> : null}</View> : null}
          {captureMode === 'draw' ? <View style={styles.drawPanel}><View style={styles.drawToolbar}><Text style={styles.captureTitle}>Drawing and annotation canvas</Text><View style={styles.penColors}>{['#284b3c', '#6e94b1', '#d8774d', '#d4a944'].map((color) => <Pressable key={color} accessibilityLabel={`Choose pen color ${color}`} onPress={() => { setPenColor(color); setHighlighter(false); }} style={[styles.penColor, { backgroundColor: color }, penColor === color && !highlighter && styles.penColorSelected]} />)}<Pressable onPress={() => { setShapeTool('pen'); setHighlighter(!highlighter); }} style={[styles.highlighterButton, highlighter && styles.highlighterActive]}><Text style={styles.highlighterText}>Highlight</Text></Pressable><Pressable accessibilityLabel="Rectangle tool" onPress={() => setShapeTool(shapeTool === 'rectangle' ? 'pen' : 'rectangle')} style={[styles.shapeToolButton, shapeTool === 'rectangle' && styles.shapeToolActive]}><Square size={11} color={colors.forest} /></Pressable><Pressable accessibilityLabel="Circle tool" onPress={() => setShapeTool(shapeTool === 'circle' ? 'pen' : 'circle')} style={[styles.shapeToolButton, shapeTool === 'circle' && styles.shapeToolActive]}><Circle size={11} color={colors.forest} /></Pressable><Pressable onPress={() => { setStrokes([]); setShapes([]); setTextAnnotations([]); }} style={styles.clearCanvas}><X size={12} color={colors.muted} /></Pressable></View></View><View onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={onDrawStart} onResponderMove={onDrawMove} style={styles.drawingSurface}><Svg pointerEvents="none" width="100%" height="100%">{strokes.map((stroke, index) => <Path key={`path-${index}`} d={stroke.path} stroke={stroke.color} strokeWidth={stroke.width} strokeOpacity={stroke.width > 5 ? 0.35 : 1} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}{shapes.map((shape, index) => shape.type === 'rectangle' ? <Rect key={`shape-${index}`} x={shape.x - 32} y={shape.y - 22} width={64} height={44} stroke={shape.color} fill="none" strokeWidth={3} /> : <SvgCircle key={`shape-${index}`} cx={shape.x} cy={shape.y} r={24} stroke={shape.color} fill="none" strokeWidth={3} />)}</Svg>{textAnnotations.map((text, index) => <Text key={`annotation-${index}`} style={[styles.annotationOverlay, { top: 20 + index * 18 }]}>{text}</Text>)}{annotationText ? <Text style={styles.annotationOverlay}>{annotationText}</Text> : null}</View><View style={styles.textAnnotationRow}><TextInput value={annotationText} onChangeText={setAnnotationText} placeholder="Add a text box annotation" style={styles.annotationInput} /><Pressable onPress={addTextAnnotation} style={styles.smallAction}><Plus size={11} color={colors.forest} /><Text style={styles.smallActionText}>Add text</Text></Pressable><Pressable onPress={attachDrawing} style={styles.smallAction}><Check size={11} color={colors.forest} /><Text style={styles.smallActionText}>Attach drawing</Text></Pressable></View></View> : null}
          {artifacts.length ? <View style={styles.attachmentList}><Text style={styles.fieldLabel}>ATTACHED TO THIS SUBMISSION</Text>{artifacts.map((artifact, index) => <View key={`${artifact.name}-${index}`} style={styles.attachmentRow}>{artifact.kind === 'image' ? <Camera size={12} color={colors.blue} /> : artifact.kind === 'audio' ? <Volume2 size={12} color={colors.forest} /> : <FileText size={12} color={colors.blue} />}<Text numberOfLines={1} style={styles.attachmentName}>{artifact.name}</Text><Pressable onPress={() => setArtifacts((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={12} color={colors.muted} /></Pressable></View>)}</View> : null}
          <View style={styles.hattieGate}><View style={styles.hattieHeader}><View><HeaderLabel>HATTIE SELF-REPORTED GRADING</HeaderLabel><Text style={styles.captureTitle}>Predict your learning before you turn it in</Text></View><Text style={styles.effectSize}>d = 1.33</Text></View><View style={styles.predictionOptions}>{mastery.map((item) => <Pressable key={item.level} onPress={() => setPredictedLevel(item.level)} style={[styles.predictionOption, { backgroundColor: predictedLevel === item.level ? item.background : '#fff', borderColor: predictedLevel === item.level ? item.color : colors.line }]}><Text style={[styles.predictionLevel, { color: item.color }]}>Level {item.level}</Text><Text style={styles.predictionName}>{item.name}</Text><Text style={styles.predictionCallout}>{['Need help', 'Practicing', 'Got it!', 'Super star!'][item.level - 1]}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>WHY DID YOU CHOOSE THIS LEVEL?</Text><TextInput value={reflection} onChangeText={setReflection} multiline maxLength={500} placeholder="I predict this because…" style={styles.reflectionInput} /><View style={styles.reflectionAudioRow}><Pressable onPress={() => { if (recording && recordingKind === 'reflection') stopRecording(); else void startRecording('reflection'); }} style={styles.secondaryCaptureButton}>{recording && recordingKind === 'reflection' ? <Pause size={12} color={colors.orange} /> : <Mic size={12} color={colors.forest} />}<Text style={styles.secondaryCaptureText}>{recording && recordingKind === 'reflection' ? `Stop reflection · ${recordingSeconds}s` : 'Record 15-second reflection'}</Text></Pressable>{reflectionAudio ? <Text style={styles.audioComplete}><Check size={11} color={colors.forest} /> {reflectionSeconds}s recorded</Text> : null}</View><Text style={styles.gateHint}>{predictedLevel === null ? 'Select a level' : 'Level selected'} · {hasReflection ? 'Reflection complete' : 'Add a written reflection or 15 seconds of audio'}</Text></View>
          <Pressable disabled={!canTurnIn} onPress={turnIn} style={[styles.turnInButton, !canTurnIn && styles.turnInDisabled]}><Send size={13} color="#fff" /><Text style={styles.turnInText}>{submitted ? 'Update submission' : 'Turn in assignment'}</Text></Pressable>
        </View>
      </View> : null}
      <Text style={styles.footerText}>UNIFIED GRADEBOOK DEMO · LOCAL ARTIFACTS · NO GRADE OR PORTFOLIO DATA SYNC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 8, minWidth: 0 }, header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 8 }, headerNarrow: { flexWrap: 'wrap' }, headerIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft }, headerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 }, headerActions: { flexDirection: 'row', gap: 5, alignItems: 'center' }, standardBadge: { color: '#4f7188', fontSize: 6, fontWeight: '700', padding: 5, borderRadius: 3, backgroundColor: colors.blueSoft }, sampleBadge: { color: '#6d776e', fontSize: 6, fontWeight: '700', padding: 5, borderRadius: 3, backgroundColor: '#f0f2ee' },
  viewTabs: { flexDirection: 'row', gap: 4 }, viewTab: { minHeight: 27, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 3, backgroundColor: '#e9ede7' }, viewTabActive: { backgroundColor: colors.forest }, viewTabText: { color: colors.muted, fontSize: 7 }, viewTabTextActive: { color: '#fff', fontWeight: '700' }, notice: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderRadius: 3, paddingHorizontal: 7, backgroundColor: colors.limeSoft }, noticeText: { flex: 1, color: colors.forest, fontSize: 7, lineHeight: 11 },
  panel: { minWidth: 0, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.paper, padding: 10 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }, panelTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 }, headerLabel: { color: '#89938b', fontSize: 6, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 }, legendDot: { width: 7, height: 7, borderRadius: 2 }, legendText: { color: colors.muted, fontSize: 5 }, matrixScroll: { paddingBottom: 4 }, matrixRow: { flexDirection: 'row', minHeight: 43, borderTopWidth: 1, borderTopColor: '#edf0eb' }, matrixHead: { minHeight: 45, backgroundColor: '#f7f8f5', borderTopWidth: 0 }, matrixStudentCell: { width: 155, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 7, borderRightWidth: 1, borderRightColor: colors.line }, matrixAssignmentCell: { width: 145, alignItems: 'center', justifyContent: 'center', gap: 3, padding: 5, borderRightWidth: 1, borderRightColor: '#edf0eb' }, tableHead: { color: colors.muted, fontSize: 6, fontWeight: '700' }, assignmentHead: { color: colors.ink, fontSize: 7, fontWeight: '700', textAlign: 'center' }, standardText: { color: colors.muted, fontSize: 5 }, studentAvatar: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blueSoft }, studentInitials: { color: colors.forest, fontSize: 6, fontWeight: '700' }, studentName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, masteryTag: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, paddingHorizontal: 5 }, masteryTagLevel: { fontSize: 7, fontWeight: '800' }, masteryPercent: { color: colors.ink, fontSize: 6 }, missingCell: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 3, backgroundColor: '#f3f4f1' }, missingText: { color: colors.muted, fontSize: 5 }, gapNote: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, marginTop: 6 }, gapNoteText: { color: colors.muted, flex: 1, fontSize: 6 },
  reviewLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, reviewLayoutNarrow: { flexDirection: 'column', alignItems: 'stretch' }, queuePanel: { width: 310, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.paper, padding: 9 }, queuePanelNarrow: { width: '100%' }, filterTabs: { flexDirection: 'row', gap: 3 }, filterButton: { minHeight: 21, justifyContent: 'center', borderRadius: 3, paddingHorizontal: 5, backgroundColor: '#f0f2ee' }, filterButtonActive: { backgroundColor: colors.limeSoft }, filterText: { color: colors.muted, fontSize: 5 }, filterTextActive: { color: colors.forest, fontWeight: '700' }, queueRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingHorizontal: 3 }, queueRowSelected: { backgroundColor: '#f1f6ec' }, queueTitle: { color: colors.ink, fontSize: 6, fontWeight: '700' }, queueReflection: { color: colors.muted, fontSize: 5, marginTop: 3 }, gapFlag: { color: '#a8583d', fontSize: 5, fontWeight: '800' }, reviewPanel: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.paper, padding: 10 }, statusBadge: { color: colors.forest, fontSize: 5, fontWeight: '700', padding: 5, borderRadius: 3, backgroundColor: colors.limeSoft }, predictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf0eb', paddingTop: 7 }, fieldLabel: { color: '#89938b', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, marginTop: 8, marginBottom: 4 }, mediaPreview: { minHeight: 100, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: 7, backgroundColor: '#f7f8f5', borderRadius: 4, marginTop: 7 }, mediaItem: { width: 110, minHeight: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#fff', padding: 5 }, mediaImage: { width: 100, height: 62, borderRadius: 3 }, audioPreview: { flexDirection: 'row', alignItems: 'center', gap: 5 }, filePreview: { flexDirection: 'row', alignItems: 'center', gap: 5 }, mediaName: { maxWidth: 76, color: colors.ink, fontSize: 5 }, reflectionBox: { borderLeftWidth: 2, borderLeftColor: colors.blue, paddingLeft: 7, marginTop: 8 }, reflectionText: { color: colors.ink, fontSize: 7, lineHeight: 11, marginTop: 3 }, perceptionGap: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: colors.orangeSoft, borderRadius: 3, padding: 6, marginTop: 7 }, perceptionGapText: { color: '#87533f', flex: 1, fontSize: 6, lineHeight: 9 }, masterySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, masteryChoice: { minWidth: 70, flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 3 }, masteryChoiceLevel: { fontSize: 7, fontWeight: '700' }, masteryChoiceName: { color: colors.muted, fontSize: 5 }, percentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, percentInput: { width: 64, height: 26, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, fontSize: 7, color: colors.ink }, percentSign: { color: colors.muted, fontSize: 7 }, feedbackInput: { minHeight: 45, borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 6, fontSize: 6, color: colors.ink }, reviewButton: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: colors.forest, borderRadius: 3, marginTop: 8 }, reviewButtonText: { color: '#fff', fontSize: 7, fontWeight: '600' }, familyReadOnly: { color: colors.muted, fontSize: 6, marginTop: 8 }, emptyText: { color: colors.muted, fontSize: 6, lineHeight: 9, paddingVertical: 8 },
  assignmentPanel: { width: 200, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.paper, padding: 8 }, canvasLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, canvasLayoutNarrow: { flexDirection: 'column' }, canvasPanel: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.paper, padding: 9 }, dueBadge: { color: colors.forest, fontSize: 5, fontWeight: '700', padding: 4, borderRadius: 3, backgroundColor: colors.limeSoft }, assignmentRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingHorizontal: 3 }, assignmentRowSelected: { backgroundColor: '#f1f6ec' }, assignmentTitle: { color: colors.ink, fontSize: 6, fontWeight: '700' }, assignmentMeta: { color: colors.muted, fontSize: 5, marginTop: 3 }, captureModes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 7 }, captureMode: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 6 }, captureModeActive: { backgroundColor: colors.limeSoft }, captureModeText: { color: colors.muted, fontSize: 6 }, captureModeTextActive: { color: colors.forest, fontWeight: '700' }, capturePanel: { minHeight: 78, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 10 }, captureDescription: { flex: 1, minWidth: 170 }, captureTitle: { color: colors.ink, fontSize: 7, fontWeight: '700' }, captureCopy: { color: colors.muted, fontSize: 6, lineHeight: 9, marginTop: 4 }, captureButton: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 3, paddingHorizontal: 8, backgroundColor: colors.forest }, captureButtonText: { color: '#fff', fontSize: 6, fontWeight: '600' }, imageOptions: { flexDirection: 'row', gap: 4 }, optionChip: { minHeight: 22, justifyContent: 'center', borderRadius: 3, paddingHorizontal: 5, backgroundColor: '#f0f2ee' }, optionChipSelected: { backgroundColor: colors.blueSoft }, optionText: { color: colors.muted, fontSize: 5 }, recordActions: { flexDirection: 'row', gap: 5 }, secondaryCaptureButton: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7 }, secondaryCaptureText: { color: colors.forest, fontSize: 6, fontWeight: '600' }, recordingStatus: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 5 }, recordingDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: colors.orange }, recordingText: { flex: 1, color: colors.orange, fontSize: 6, fontWeight: '600' },
  drawPanel: { gap: 6, paddingVertical: 8 }, drawToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 }, penColors: { flexDirection: 'row', alignItems: 'center', gap: 4 }, penColor: { width: 14, height: 14, borderRadius: 7 }, penColorSelected: { borderWidth: 2, borderColor: colors.ink }, shapeToolButton: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: '#f0f2ee' }, shapeToolActive: { backgroundColor: colors.limeSoft, borderWidth: 1, borderColor: colors.forest }, highlighterButton: { minHeight: 20, justifyContent: 'center', paddingHorizontal: 5, borderRadius: 3, backgroundColor: colors.yellowSoft }, highlighterActive: { borderWidth: 1, borderColor: colors.yellow }, highlighterText: { color: '#856a2d', fontSize: 5 }, clearCanvas: { width: 22, height: 20, alignItems: 'center', justifyContent: 'center' }, drawingSurface: { height: 145, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, borderRadius: 3, backgroundColor: '#fcfdfb' }, annotationOverlay: { position: 'absolute', top: 20, left: 20, color: colors.ink, fontSize: 9 }, textAnnotationRow: { flexDirection: 'row', gap: 5 }, annotationInput: { flex: 1, height: 25, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, fontSize: 6 }, smallAction: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6 }, smallActionText: { color: colors.forest, fontSize: 6 }, attachmentList: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 4 }, attachmentRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, attachmentName: { flex: 1, color: colors.ink, fontSize: 6 },
  scoreSlider: { height: 20, justifyContent: 'center', marginTop: 3, marginBottom: 4, borderRadius: 8, backgroundColor: '#e9ede7' }, scoreSliderFill: { position: 'absolute', left: 0, height: 5, borderRadius: 3, backgroundColor: colors.forest }, scoreSliderThumb: { position: 'absolute', width: 13, height: 13, marginLeft: -6, borderWidth: 2, borderColor: colors.forest, borderRadius: 7, backgroundColor: '#fff' },
  hattieGate: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, marginTop: 4 }, hattieHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, effectSize: { color: colors.blue, fontSize: 6, fontWeight: '800', padding: 5, borderRadius: 3, backgroundColor: colors.blueSoft }, predictionOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 7 }, predictionOption: { flex: 1, minWidth: 90, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 3, padding: 4 }, predictionLevel: { fontSize: 7, fontWeight: '800' }, predictionName: { color: colors.ink, fontSize: 6, fontWeight: '600', marginTop: 2 }, predictionCallout: { color: colors.muted, fontSize: 5, marginTop: 2 }, reflectionInput: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 6, color: colors.ink, fontSize: 6 }, reflectionAudioRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 }, audioComplete: { flexDirection: 'row', color: colors.forest, fontSize: 6 }, gateHint: { color: colors.muted, fontSize: 5, marginTop: 5 }, turnInButton: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 3, backgroundColor: colors.forest }, turnInDisabled: { opacity: 0.45 }, turnInText: { color: '#fff', fontSize: 7, fontWeight: '700' }, footerText: { color: '#98a198', fontSize: 5, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
});
