import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BadgeCheck, Check, IdCard, LogOut, Printer, ScanLine, ShieldAlert, UserCheck, Users, X } from 'lucide-react-native';

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', limeSoft: '#eef6e3',
  orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df',
  blue: '#6e94b1', blueSoft: '#eaf1f6', red: '#b64036', redSoft: '#fdecea', paper: '#fff',
};

const timestamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const escapeHtml = (value: string) => value.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

// Sample entries only; a production deployment must query licensed registry and district watchlist services server-side.
const sampleWatchlist: { name: string; status: ScreeningStatus; reason: string }[] = [
  { name: 'sample offender', status: 'flagged_offender', reason: 'Sample registry match (demo entry)' },
  { name: 'sample restricted', status: 'flagged_custody', reason: 'Sample custody restriction (demo entry)' },
];

type ScreeningStatus = 'passed' | 'flagged_offender' | 'flagged_custody' | 'override_cleared';
type VisitorLog = { id: string; name: string; reason: string; destination: string; status: ScreeningStatus; badgePrinted: boolean; checkIn: string; checkOut?: string; idHash: string };

const statusLabel: Record<ScreeningStatus, string> = {
  passed: 'No match · sample list only',
  flagged_offender: 'Flagged · sample registry',
  flagged_custody: 'Flagged · sample custody',
  override_cleared: 'Administrator override',
};

async function hashText(value: string) {
  if (typeof crypto === 'undefined' || !crypto.subtle) return 'unavailable';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function parseAamva(raw: string) {
  const field = (code: string) => raw.match(new RegExp(`${code}([^\\n\\r]+)`))?.[1]?.trim() ?? '';
  const first = field('DAC') || field('DCT').split(',')[0];
  const last = field('DCS');
  return { name: [first, last].filter(Boolean).join(' '), licenseNumber: field('DAQ') };
}

export function VisitorScreeningWorkspace({ narrow }: { narrow: boolean }) {
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('Front office');
  const [overrideReason, setOverrideReason] = useState('');
  const [current, setCurrent] = useState<VisitorLog | null>(null);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [notice, setNotice] = useState('');

  const scanId = () => {
    const Detector = (globalThis as any).BarcodeDetector;
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !Detector) {
      setNotice('Barcode scanning is not supported in this browser. Enter the visitor details manually.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    (input as HTMLInputElement & { capture?: string }).capture = 'environment';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const bitmap = await createImageBitmap(file);
        const results = await new Detector({ formats: ['pdf417'] }).detect(bitmap);
        if (!results.length) { setNotice('No PDF417 barcode found. Retake the photo of the back of the license.'); return; }
        const parsed = parseAamva(String(results[0].rawValue));
        if (!parsed.name) { setNotice('Barcode read, but it did not contain an AAMVA name. Enter details manually.'); return; }
        setName(parsed.name);
        setLicenseNumber(parsed.licenseNumber);
        setNotice('ID barcode read in this browser. Confirm the name against the person before screening.');
      } catch {
        setNotice('Could not read that image. Enter the visitor details manually.');
      }
    };
    input.click();
  };

  const screenVisitor = async () => {
    if (!name.trim() || !reason.trim()) { setNotice('Enter the visitor name and reason for visit.'); return; }
    const match = sampleWatchlist.find((entry) => normalize(entry.name) === normalize(name));
    const idHash = licenseNumber.trim() ? await hashText(`license:${licenseNumber.trim().toUpperCase()}`) : 'not provided';
    const entry: VisitorLog = { id: `visit-${Date.now()}`, name: name.trim(), reason: reason.trim(), destination, status: match?.status ?? 'passed', badgePrinted: false, checkIn: timestamp(), idHash };
    setCurrent(entry);
    setLicenseNumber('');
    setOverrideReason('');
    setNotice(match ? `${match.reason}. Do not issue a badge; contact an administrator.` : 'No match in the sample list. State sex-offender registry and district watchlist services are not connected, so this is not a clearance.');
  };

  const adminOverride = () => {
    if (!current || overrideReason.trim().length < 10) { setNotice('An override requires a written reason of at least 10 characters.'); return; }
    setCurrent({ ...current, status: 'override_cleared' });
    setNotice('Override recorded locally. In production this must be restricted to administrators and audited.');
  };

  const canIssueBadge = current && (current.status === 'passed' || current.status === 'override_cleared');

  const printBadge = () => {
    if (!current || !canIssueBadge) return;
    const html = `<html><body style="font-family:sans-serif;text-align:center;border:3px solid #284b3c;padding:24px;width:300px"><h2>VISITOR</h2><h1>${escapeHtml(current.name)}</h1><p>To: ${escapeHtml(current.destination)}</p><p>In: ${escapeHtml(current.checkIn)} · ${escapeHtml(new Date().toLocaleDateString())}</p></body></html>`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const popup = window.open('', '_blank', 'width=420,height=360');
      if (!popup) { setNotice('Allow pop-ups to print the badge preview.'); return; }
      popup.document.write(html);
      popup.document.close();
      popup.print();
    }
    const printed = { ...current, badgePrinted: true };
    setCurrent(printed);
    setLogs((existing) => [printed, ...existing.filter((item) => item.id !== printed.id)]);
    setNotice('Badge preview sent to the browser print dialog. No thermal printer is connected.');
    setName('');
    setReason('');
  };

  const checkOut = (id: string) => setLogs((existing) => existing.map((item) => item.id === id ? { ...item, checkOut: timestamp() } : item));

  return (
    <View style={styles.workspace}>
      <View style={styles.header}><View style={styles.headerIcon}><IdCard size={16} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>Visitor and contractor screening</Text><Text style={styles.headerSubtitle}>Evergreen Elementary · Front office</Text></View><Text style={styles.badge}>SAMPLE LISTS ONLY</Text></View>
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text><Pressable accessibilityLabel="Dismiss notice" onPress={() => setNotice('')}><X size={12} color={colors.forest} /></Pressable></View> : null}
      <View style={[styles.layout, narrow && styles.layoutNarrow]}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Check-in</Text>
          <Pressable onPress={scanId} style={styles.secondaryButton}><ScanLine size={13} color={colors.forest} /><Text style={styles.secondaryButtonText}>Scan license barcode (PDF417)</Text></Pressable>
          <Text style={styles.fieldLabel}>FULL NAME</Text><TextInput value={name} onChangeText={setName} style={styles.input} placeholder="As shown on ID" />
          <Text style={styles.fieldLabel}>LICENSE NUMBER · HASHED, NOT STORED</Text><TextInput value={licenseNumber} onChangeText={setLicenseNumber} style={styles.input} placeholder="Optional" autoCapitalize="characters" />
          <Text style={styles.fieldLabel}>REASON FOR VISIT</Text><TextInput value={reason} onChangeText={setReason} style={styles.input} placeholder="Meeting, delivery, repair…" />
          <Text style={styles.fieldLabel}>DESTINATION</Text>
          <View style={styles.chips}>{['Front office', 'Room 12', 'Library', 'Gym', 'Maintenance'].map((room) => <Pressable key={room} onPress={() => setDestination(room)} style={[styles.chip, destination === room && styles.chipActive]}><Text style={[styles.chipText, destination === room && styles.chipTextActive]}>{room}</Text></Pressable>)}</View>
          <Pressable onPress={() => { void screenVisitor(); }} style={styles.primaryButton}><ShieldAlert size={13} color="#fff" /><Text style={styles.primaryButtonText}>Run screening</Text></Pressable>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Screening result</Text>
          {current ? <>
            <View style={[styles.result, current.status === 'passed' || current.status === 'override_cleared' ? styles.resultOk : styles.resultFlag]}><Text style={styles.resultName}>{current.name}</Text><Text style={styles.resultStatus}>{statusLabel[current.status]}</Text><Text style={styles.resultMeta}>ID hash {current.idHash} · {current.destination}</Text></View>
            {!canIssueBadge ? <><Text style={styles.fieldLabel}>ADMINISTRATOR OVERRIDE REASON</Text><TextInput value={overrideReason} onChangeText={setOverrideReason} style={styles.input} placeholder="Required for any override" /><Pressable onPress={adminOverride} style={styles.secondaryButton}><UserCheck size={13} color={colors.forest} /><Text style={styles.secondaryButtonText}>Record override</Text></Pressable></> : null}
            <Pressable disabled={!canIssueBadge} onPress={printBadge} style={[styles.primaryButton, !canIssueBadge && styles.disabled]}><Printer size={13} color="#fff" /><Text style={styles.primaryButtonText}>Print visitor badge</Text></Pressable>
          </> : <Text style={styles.empty}>Run a screening to see the result here.</Text>}
          <Text style={styles.disclaimer}>State registry and district watchlist checks are not connected. The sample list contains demo entries only and must not be used to clear a real visitor.</Text>
        </View>
      </View>
      <View style={styles.panel}>
        <View style={styles.panelRow}><Text style={styles.panelTitle}>Today’s visitors</Text><Users size={14} color={colors.forest} /></View>
        {logs.map((log) => <View key={log.id} style={styles.logRow}><View style={{ flex: 1 }}><Text style={styles.logName}>{log.name} · {log.destination}</Text><Text style={styles.logMeta}>{log.reason} · in {log.checkIn}{log.checkOut ? ` · out ${log.checkOut}` : ''}</Text></View>{log.checkOut ? <BadgeCheck size={14} color={colors.forest} /> : <Pressable onPress={() => checkOut(log.id)} style={styles.secondaryButton}><LogOut size={12} color={colors.forest} /><Text style={styles.secondaryButtonText}>Check out</Text></Pressable>}</View>)}
        {logs.length === 0 ? <Text style={styles.empty}>No visitors badged in this session.</Text> : null}
      </View>
      <Text style={styles.footer}>VISITOR SCREENING DEMO · NO REGISTRY, WATCHLIST, OR THERMAL PRINTER INTEGRATION</Text>
    </View>
  );
}

type Guardian = { name: string; relationship: string; authorized: boolean };
type ReunifyStudent = { id: string; name: string; grade: string; guardians: Guardian[]; custodyRestriction?: string; releasedTo?: string };
type Stroke = { path: string };
type ReleaseLog = { id: string; student: string; guardian: string; time: string; signed: boolean };

const releaseStudents: ReunifyStudent[] = [
  { id: 'r1', name: 'Maya Thompson', grade: '4', guardians: [{ name: 'Dana Thompson', relationship: 'Mother', authorized: true }, { name: 'Chris Thompson', relationship: 'Uncle', authorized: false }] },
  { id: 'r2', name: 'Ethan Chen', grade: '2', guardians: [{ name: 'Lin Chen', relationship: 'Father', authorized: true }] },
  { id: 'r3', name: 'Noah Williams', grade: '6', guardians: [{ name: 'Pat Williams', relationship: 'Father', authorized: true }], custodyRestriction: 'Active custody restriction on file (demo)' },
];

const stepTitles = ['Select student', 'Select guardian', 'Verify ID', 'Signature', 'Release'];

export function ReunificationWorkspace({ narrow }: { narrow: boolean }) {
  const [students, setStudents] = useState(releaseStudents);
  const [step, setStep] = useState(0);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [guardianName, setGuardianName] = useState<string | null>(null);
  const [idVerified, setIdVerified] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [logs, setLogs] = useState<ReleaseLog[]>([]);
  const [notice, setNotice] = useState('');

  const student = students.find((item) => item.id === studentId);
  const guardian = student?.guardians.find((item) => item.name === guardianName);
  const blocked = Boolean(student?.custodyRestriction) || guardian?.authorized === false;

  const reset = () => { setStep(0); setStudentId(null); setGuardianName(null); setIdVerified(false); setStrokes([]); };

  const onStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setStrokes((current) => [...current, { path: `M ${locationX} ${locationY}` }]);
  };
  const onMove = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setStrokes((current) => current.map((stroke, index) => index === current.length - 1 ? { path: `${stroke.path} L ${locationX} ${locationY}` } : stroke));
  };

  const release = () => {
    if (!student || !guardian || blocked || !idVerified || !strokes.length) { setNotice('Complete every verification step before release.'); return; }
    setStudents((current) => current.map((item) => item.id === student.id ? { ...item, releasedTo: guardian.name } : item));
    setLogs((current) => [{ id: `release-${Date.now()}`, student: student.name, guardian: guardian.name, time: timestamp(), signed: true }, ...current]);
    setNotice(`${student.name} released to ${guardian.name}. Chain-of-custody entry recorded locally; the signature is not stored.`);
    reset();
  };

  return (
    <View style={styles.workspace}>
      <View style={styles.header}><View style={styles.headerIcon}><Users size={16} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>Parent-student reunification</Text><Text style={styles.headerSubtitle}>Standard Reunification Method · Guided release</Text></View><Text style={styles.badge}>LOCAL PREVIEW</Text></View>
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text><Pressable accessibilityLabel="Dismiss notice" onPress={() => setNotice('')}><X size={12} color={colors.forest} /></Pressable></View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.steps}>{stepTitles.map((title, index) => <View key={title} style={[styles.stepItem, index === step && styles.stepActive, index < step && styles.stepDone]}><Text style={styles.stepText}>{index + 1}. {title}</Text></View>)}</ScrollView>
      <View style={[styles.layout, narrow && styles.layoutNarrow]}>
        <View style={styles.panel}>
          {step === 0 ? <>
            <Text style={styles.panelTitle}>Students awaiting reunification</Text>
            {students.map((item) => <Pressable key={item.id} disabled={Boolean(item.releasedTo)} onPress={() => { setStudentId(item.id); setStep(1); }} style={styles.logRow}><View style={{ flex: 1 }}><Text style={styles.logName}>{item.name} · Grade {item.grade}</Text><Text style={styles.logMeta}>{item.releasedTo ? `Released to ${item.releasedTo}` : item.custodyRestriction ? 'Custody alert — verify with administrator' : 'Awaiting guardian'}</Text></View>{item.releasedTo ? <BadgeCheck size={14} color={colors.forest} /> : null}</Pressable>)}
          </> : null}
          {step === 1 && student ? <>
            <Text style={styles.panelTitle}>Guardian for {student.name}</Text>
            {student.custodyRestriction ? <View style={styles.resultFlag}><Text style={styles.resultStatus}>{student.custodyRestriction}</Text><Text style={styles.resultMeta}>Release is blocked. Escalate to an administrator.</Text></View> : null}
            {student.guardians.map((item) => <Pressable key={item.name} onPress={() => { setGuardianName(item.name); setStep(2); }} style={styles.logRow}><View style={{ flex: 1 }}><Text style={styles.logName}>{item.name} · {item.relationship}</Text><Text style={styles.logMeta}>{item.authorized ? 'Authorized pickup' : 'Not authorized for pickup'}</Text></View></Pressable>)}
            <Pressable onPress={reset} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Back</Text></Pressable>
          </> : null}
          {step === 2 && student && guardian ? <>
            <Text style={styles.panelTitle}>Verify guardian identity</Text>
            <Text style={styles.disclaimer}>Compare a government photo ID with the guardian record for {guardian.name}. This preview does not scan or store the ID.</Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: idVerified }} onPress={() => setIdVerified(!idVerified)} style={styles.checkRow}><View style={[styles.checkbox, idVerified && styles.checkboxOn]}>{idVerified ? <Check size={10} color="#fff" /> : null}</View><Text style={styles.logName}>I verified this guardian’s photo ID in person</Text></Pressable>
            {blocked ? <View style={styles.resultFlag}><Text style={styles.resultStatus}>Release blocked</Text><Text style={styles.resultMeta}>{student.custodyRestriction ?? 'Guardian is not authorized for pickup.'}</Text></View> : null}
            <View style={styles.rowButtons}><Pressable onPress={() => setStep(1)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Back</Text></Pressable><Pressable disabled={!idVerified || blocked} onPress={() => setStep(3)} style={[styles.primaryButton, (!idVerified || blocked) && styles.disabled]}><Text style={styles.primaryButtonText}>Continue</Text></Pressable></View>
          </> : null}
          {step === 3 ? <>
            <Text style={styles.panelTitle}>Guardian signature</Text>
            <View onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={onStart} onResponderMove={onMove} style={styles.signature}><Svg pointerEvents="none" width="100%" height="100%">{strokes.map((stroke, index) => <Path key={index} d={stroke.path} stroke={colors.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}</Svg></View>
            <View style={styles.rowButtons}><Pressable onPress={() => setStrokes([])} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Clear</Text></Pressable><Pressable disabled={!strokes.length} onPress={() => setStep(4)} style={[styles.primaryButton, !strokes.length && styles.disabled]}><Text style={styles.primaryButtonText}>Continue</Text></Pressable></View>
          </> : null}
          {step === 4 && student && guardian ? <>
            <Text style={styles.panelTitle}>Confirm release</Text>
            <Text style={styles.logName}>Release {student.name} to {guardian.name}?</Text>
            <Text style={styles.disclaimer}>This records a time-stamped chain-of-custody entry in local preview state.</Text>
            <Pressable onPress={release} style={styles.primaryButton}><UserCheck size={13} color="#fff" /><Text style={styles.primaryButtonText}>Release student</Text></Pressable>
          </> : null}
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Chain of custody</Text>
          {logs.map((log) => <View key={log.id} style={styles.logRow}><View style={{ flex: 1 }}><Text style={styles.logName}>{log.student} → {log.guardian}</Text><Text style={styles.logMeta}>{log.time} · ID verified · signature captured</Text></View></View>)}
          {logs.length === 0 ? <Text style={styles.empty}>No releases recorded.</Text> : null}
        </View>
      </View>
      <Text style={styles.footer}>REUNIFICATION DEMO · SAMPLE GUARDIANS AND CUSTODY DATA · NO SIS OR ID-SCAN INTEGRATION</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 8, minWidth: 0 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 8 },
  headerIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft },
  headerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  badge: { color: '#6d776e', fontSize: 6, fontWeight: '700', padding: 5, borderRadius: 3, backgroundColor: '#f0f2ee' },
  notice: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: colors.limeSoft }, noticeText: { flex: 1, color: colors.forest, fontSize: 7, lineHeight: 11 },
  layout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, layoutNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  panel: { flex: 1, minWidth: 0, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 10, gap: 4 },
  panelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, panelTitle: { color: colors.ink, fontSize: 9, fontWeight: '700', marginBottom: 4 },
  fieldLabel: { color: '#89938b', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, marginTop: 6 },
  input: { minHeight: 28, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7, fontSize: 7, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, chip: { minHeight: 24, justifyContent: 'center', paddingHorizontal: 7, borderRadius: 3, backgroundColor: '#f0f2ee' }, chipActive: { backgroundColor: colors.limeSoft, borderWidth: 1, borderColor: colors.forest }, chipText: { color: colors.muted, fontSize: 6 }, chipTextActive: { color: colors.forest, fontWeight: '700' },
  primaryButton: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 3, paddingHorizontal: 9, marginTop: 6, backgroundColor: colors.forest }, primaryButtonText: { color: '#fff', fontSize: 7, fontWeight: '600' },
  secondaryButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7, marginTop: 4, alignSelf: 'flex-start' }, secondaryButtonText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  disabled: { opacity: 0.45 }, rowButtons: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  result: { borderRadius: 4, padding: 8 }, resultOk: { backgroundColor: colors.limeSoft }, resultFlag: { backgroundColor: colors.redSoft, borderRadius: 4, padding: 8, marginVertical: 4 },
  resultName: { color: colors.ink, fontSize: 9, fontWeight: '700' }, resultStatus: { color: colors.ink, fontSize: 7, fontWeight: '600', marginTop: 2 }, resultMeta: { color: colors.muted, fontSize: 6, marginTop: 3 },
  logRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, logName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, logMeta: { color: colors.muted, fontSize: 6, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 7, paddingVertical: 8 }, disclaimer: { color: colors.muted, fontSize: 6, lineHeight: 9, marginTop: 6 },
  steps: { flexDirection: 'row', gap: 4 }, stepItem: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 3, backgroundColor: '#e9ede7' }, stepActive: { backgroundColor: colors.forest }, stepDone: { backgroundColor: colors.limeSoft }, stepText: { color: colors.muted, fontSize: 6, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }, checkbox: { width: 14, height: 14, borderWidth: 1, borderColor: colors.muted, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  signature: { height: 120, borderWidth: 1, borderColor: colors.line, borderRadius: 3, backgroundColor: '#fcfdfb', overflow: 'hidden' },
  footer: { color: '#98a198', fontSize: 5, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
});
