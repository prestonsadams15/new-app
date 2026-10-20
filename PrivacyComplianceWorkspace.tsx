import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileClock,
  FileText,
  LockKeyhole,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react-native';

type RequestRecord = { id: string; student: string; requested: string; due: string; status: string };
type AuditRecord = { id: string; action: string; resource: string; reason: string; time: string };
type RetentionRule = { id: string; category: string; days: number; action: 'anonymize' | 'delete' | 'review' };

const colors = { ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6', orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df' };
const sampleStudents = ['Maya Thompson', 'Ethan Chen', 'Sofia Martinez'];
const reasonCodes = [
  { value: 'student_safety', label: 'Student safety' },
  { value: 'educational_support', label: 'Educational support' },
  { value: 'legal_compliance', label: 'Legal compliance' },
  { value: 'parent_request', label: 'Parent request' },
  { value: 'emergency_response', label: 'Emergency response' },
];

function ScopeToggle({ label, value, onChange, detail }: { label: string; value: boolean; onChange: () => void; detail: string }) {
  return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onChange} style={styles.toggleRow}><View style={{ flex: 1 }}><Text style={styles.toggleTitle}>{label}</Text><Text style={styles.toggleDetail}>{detail}</Text></View><View style={[styles.toggleTrack, value && styles.toggleTrackOn]}><View style={[styles.toggleThumb, value && styles.toggleThumbOn]} /></View></Pressable>;
}

export function PrivacyComplianceWorkspace({ narrow }: { narrow: boolean }) {
  const [student, setStudent] = useState(sampleStudents[0]);
  const [directoryOptOut, setDirectoryOptOut] = useState(false);
  const [mediaOptOut, setMediaOptOut] = useState(true);
  const [militaryOptOut, setMilitaryOptOut] = useState(false);
  const [higherEdOptOut, setHigherEdOptOut] = useState(false);
  const [consentStatus, setConsentStatus] = useState('Not verified');
  const [requests, setRequests] = useState<RequestRecord[]>([
    { id: 'req-1', student: 'Maya Thompson', requested: 'Oct 06, 2026', due: 'Nov 20, 2026', status: 'Under review' },
  ]);
  const [audit, setAudit] = useState<AuditRecord[]>([
    { id: 'audit-1', action: 'view_custody', resource: 'student_safety_restrictions', reason: 'student_safety', time: '8:42 AM' },
    { id: 'audit-2', action: 'export_student_record', resource: 'ferpa_record_requests', reason: 'parent_request', time: 'Yesterday' },
  ]);
  const [reasonCode, setReasonCode] = useState('student_safety');
  const [justification, setJustification] = useState('');
  const [leiUntil, setLeiUntil] = useState('');
  const [retentionRules, setRetentionRules] = useState<RetentionRule[]>([]);
  const [retentionCategory, setRetentionCategory] = useState('daily_kiosk_photos');
  const [retentionDays, setRetentionDays] = useState('');
  const [retentionAction, setRetentionAction] = useState<'anonymize' | 'delete' | 'review'>('review');
  const [notice, setNotice] = useState('');

  const createRecordRequest = () => {
    const requestedAt = new Date();
    const dueAt = new Date(requestedAt);
    dueAt.setDate(dueAt.getDate() + 45);
    const formatDate = (date: Date) => date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
    const item = { id: `req-${Date.now()}`, student, requested: formatDate(requestedAt), due: formatDate(dueAt), status: 'Submitted · preview' };
    setRequests((current) => [item, ...current]);
    setNotice(`Record-inspection request created locally. Response due ${item.due} (45-day preview).`);
    setAudit((current) => [{ id: `audit-${Date.now()}`, action: 'create_record_request', resource: 'ferpa_record_requests', reason: 'parent_request', time: 'Just now' }, ...current]);
  };

  const beginLeiPreview = () => {
    if (justification.trim().length < 15) { setNotice('Provide a specific educational-interest justification of at least 15 characters.'); return; }
    const expires = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setLeiUntil(expires);
    setNotice(`LEI access preview granted for ${student} until ${expires}. A configured Supabase function must authorize and audit real access.`);
    setAudit((current) => [{ id: `audit-${Date.now()}`, action: 'lei_override', resource: 'restricted_student_record', reason: reasonCode, time: 'Just now' }, ...current]);
    setJustification('');
  };

  const addRetentionRule = () => {
    const days = Number(retentionDays);
    if (!Number.isInteger(days) || days < 1 || days > 36500) { setNotice('Enter a retention period between 1 and 36,500 days, approved by district records staff.'); return; }
    setRetentionRules((current) => [{ id: `retention-${Date.now()}`, category: retentionCategory, days, action: retentionAction }, ...current]);
    setRetentionDays('');
    setNotice('Retention rule saved to this local preview. No records were deleted or anonymized.');
  };

  const prepareExport = (requestId: string) => {
    setRequests((current) => current.map((item) => item.id === requestId ? { ...item, status: 'Export preview prepared' } : item));
    setAudit((current) => [{ id: `audit-${Date.now()}`, action: 'export_student_record', resource: 'ferpa_record_requests', reason: 'parent_request', time: 'Just now' }, ...current]);
    setNotice('Encrypted record package is not connected. Export preview prepared locally; no record bundle was created.');
  };

  const updatePreference = (label: string) => {
    setNotice(`${label} preference saved locally for ${student}. District publication and disclosure systems are not connected.`);
  };

  return (
    <View style={styles.workspace}>
      <View style={styles.header}><View style={styles.headerIcon}><ShieldCheck size={16} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>Privacy &amp; records</Text><Text style={styles.headerSubtitle}>FERPA · COPPA · PPRA · IDEA · State privacy controls</Text></View><View style={styles.previewTag}><Text style={styles.previewTagText}>PREVIEW</Text></View></View>
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}
      <View style={[styles.columns, narrow && styles.columnsNarrow]}>
        <View style={styles.mainColumn}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Family privacy preferences</Text><Text style={styles.panelSubtitle}>Directory disclosures and media releases</Text></View><UserRoundCheck size={15} color={colors.forest} /></View>
            <Text style={styles.fieldLabel}>SAMPLE STUDENT</Text><View style={styles.studentPicker}>{sampleStudents.map((name) => <Pressable key={name} onPress={() => setStudent(name)} style={[styles.studentChip, student === name && styles.studentChipActive]}><Text style={[styles.studentChipText, student === name && styles.studentChipTextActive]}>{name}</Text></Pressable>)}</View>
            <ScopeToggle label="Directory information opt-out" detail="Hide from public directories and approved releases" value={directoryOptOut} onChange={() => { setDirectoryOptOut(!directoryOptOut); updatePreference('Directory information opt-out'); }} />
            <ScopeToggle label="Media / photo opt-out" detail="Suppress photo/video selection in community and public CMS" value={mediaOptOut} onChange={() => { setMediaOptOut(!mediaOptOut); updatePreference('Media opt-out'); }} />
            <ScopeToggle label="Military recruiter opt-out" detail="High-school disclosure preference" value={militaryOptOut} onChange={() => { setMilitaryOptOut(!militaryOptOut); updatePreference('Military recruiter opt-out'); }} />
            <ScopeToggle label="Higher-education recruiter opt-out" detail="Control permitted postsecondary recruiter disclosures" value={higherEdOptOut} onChange={() => { setHigherEdOptOut(!higherEdOptOut); updatePreference('Higher-education recruiter opt-out'); }} />
            <View style={styles.consentRow}><View style={styles.consentIcon}><LockKeyhole size={14} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.consentTitle}>COPPA parental consent</Text><Text style={styles.consentDetail}>Status: {consentStatus} · Verification evidence required</Text></View><Pressable onPress={() => { setConsentStatus('Verification requested'); setNotice('COPPA verification request preview created. Consent cannot be self-asserted from this client.'); }} style={styles.smallButton}><Text style={styles.smallButtonText}>Request</Text></Pressable></View>
            <Text style={styles.disclaimer}>Preferences are sample state. Production updates must be authorized, timestamped, and honored by all feed and CMS publication paths.</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Student record inspection requests</Text><Text style={styles.panelSubtitle}>Parent / eligible-student portal · 45-day response tracking</Text></View><FileClock size={15} color={colors.forest} /></View>
            <View style={styles.requestHeader}><View style={{ flex: 1 }}><Text style={styles.requestLabel}>STUDENT</Text><Text style={styles.requestStudent}>{student}</Text></View><Pressable onPress={createRecordRequest} style={styles.primaryButton}><Plus size={11} color="#fff" /><Text style={styles.primaryButtonText}>New request</Text></Pressable></View>
            {requests.filter((item) => item.student === student).map((item) => <View key={item.id} style={styles.requestRow}><View style={{ flex: 1 }}><Text style={styles.requestTitle}>Complete educational record</Text><Text style={styles.requestMeta}>Requested {item.requested} · Due {item.due}</Text></View><View style={styles.requestActions}><Text style={styles.requestStatus}>{item.status}</Text><Pressable onPress={() => prepareExport(item.id)} style={styles.exportButton}><Download size={10} color={colors.forest} /><Text style={styles.exportText}>Prepare</Text></Pressable></View></View>)}
            {requests.every((item) => item.student !== student) ? <Text style={styles.emptyText}>No record requests for this sample student.</Text> : null}
            <Text style={styles.disclaimer}>The 45-day due date is a tracking aid, not a legal determination. Export assembly, encryption, delivery, and identity verification are not connected.</Text>
          </View>
        </View>

        <View style={[styles.sideColumn, narrow && styles.sideColumnNarrow]}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Legitimate educational interest</Text><Text style={styles.panelSubtitle}>Restricted record access override</Text></View><ShieldAlert size={15} color={colors.orange} /></View>
            <View style={styles.leiWarning}><Text style={styles.leiWarningText}>Administrators must document a specific reason before restricted student data is unlocked.</Text></View>
            <Text style={styles.fieldLabel}>REASON CODE</Text><View style={styles.reasonList}>{reasonCodes.map((reason) => <Pressable key={reason.value} onPress={() => setReasonCode(reason.value)} style={[styles.reasonChip, reasonCode === reason.value && styles.reasonChipActive]}><Text style={[styles.reasonText, reasonCode === reason.value && styles.reasonTextActive]}>{reason.label}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>JUSTIFICATION · REQUIRED</Text><TextInput value={justification} onChangeText={setJustification} multiline placeholder="Describe the direct educational interest..." style={styles.justificationInput} />
            <Pressable onPress={beginLeiPreview} style={styles.leiButton}><LockKeyhole size={11} color="#fff" /><Text style={styles.leiButtonText}>{leiUntil ? `Preview active until ${leiUntil}` : 'Request 5-minute access preview'}</Text></Pressable>
            <Text style={styles.disclaimer}>Preview only. No student fields unlock. Production access requires the database grant RPC and an audit event.</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Audit trail</Text><Text style={styles.panelSubtitle}>PII / restricted access preview</Text></View><ShieldCheck size={14} color={colors.forest} /></View>
            {audit.slice(0, 4).map((record) => <View key={record.id} style={styles.auditRow}><View style={styles.auditDot} /><View style={{ flex: 1 }}><Text style={styles.auditAction}>{record.action.replaceAll('_', ' ')}</Text><Text style={styles.auditResource}>{record.resource} · {record.reason.replaceAll('_', ' ')}</Text></View><Text style={styles.auditTime}>{record.time}</Text></View>)}
            <Text style={styles.disclaimer}>The sample audit list is not immutable storage. Production reads/exports must pass through audited server APIs; direct database SELECTs are not row-trigger-audited.</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Retention policy controls</Text><Text style={styles.panelSubtitle}>District-approved schedule only</Text></View><Clock3 size={14} color={colors.forest} /></View>
            <Text style={styles.fieldLabel}>DATA CATEGORY</Text><View style={styles.reasonList}>{['kiosk_photos', 'chat_logs', 'attendance_logs', 'discipline_records'].map((category) => <Pressable key={category} onPress={() => setRetentionCategory(category)} style={[styles.reasonChip, retentionCategory === category && styles.reasonChipActive]}><Text style={[styles.reasonText, retentionCategory === category && styles.reasonTextActive]}>{category.replaceAll('_', ' ')}</Text></Pressable>)}</View>
            <View style={styles.retentionControls}><TextInput value={retentionDays} onChangeText={setRetentionDays} keyboardType="number-pad" placeholder="Days" style={styles.retentionInput} />{(['anonymize', 'delete', 'review'] as const).map((action) => <Pressable key={action} onPress={() => setRetentionAction(action)} style={[styles.reasonChip, retentionAction === action && styles.reasonChipActive]}><Text style={[styles.reasonText, retentionAction === action && styles.reasonTextActive]}>{action}</Text></Pressable>)}</View>
            <Pressable onPress={addRetentionRule} style={styles.smallButton}><Text style={styles.smallButtonText}>Add draft rule</Text></Pressable>
            {retentionRules.map((rule) => <View key={rule.id} style={styles.retentionRow}><Text style={styles.retentionCategory}>{rule.category.replaceAll('_', ' ')}</Text><Text style={styles.retentionValue}>{rule.days} days · {rule.action}</Text></View>)}
            <Text style={styles.disclaimer}>No deletion or anonymization runs from the client. Retention durations require records-officer approval and state-specific schedules.</Text>
          </View>
        </View>
      </View>
      <Text style={styles.footerText}>PRIVACY CONTROL PREVIEW · NO LEGAL CERTIFICATION · NO PRODUCTION RECORDS EXPORTED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 9 }, header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: '#fff' },
  headerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft }, headerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 },
  previewTag: { backgroundColor: colors.yellowSoft, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4 }, previewTagText: { color: '#82682a', fontSize: 5, fontWeight: '700' },
  notice: { padding: 7, borderRadius: 3, backgroundColor: colors.limeSoft }, noticeText: { color: colors.forest, fontSize: 6, lineHeight: 10 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, columnsNarrow: { flexDirection: 'column' }, mainColumn: { flex: 1, minWidth: 0 }, sideColumn: { width: 245, gap: 1 }, sideColumnNarrow: { width: '100%' },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9, marginBottom: 7 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 7 }, panelTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 },
  fieldLabel: { color: '#79847b', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, marginTop: 6, marginBottom: 4 }, studentPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 }, studentChip: { minHeight: 22, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 3, backgroundColor: '#f0f2ee' }, studentChipActive: { backgroundColor: colors.blueSoft }, studentChipText: { color: colors.muted, fontSize: 5 }, studentChipTextActive: { color: '#4f7188', fontWeight: '700' },
  toggleRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb' }, toggleTitle: { color: colors.ink, fontSize: 6, fontWeight: '600' }, toggleDetail: { color: colors.muted, fontSize: 5, marginTop: 3 }, toggleTrack: { width: 27, height: 15, padding: 2, justifyContent: 'center', borderRadius: 8, backgroundColor: '#d8dfd7' }, toggleTrackOn: { backgroundColor: colors.forest }, toggleThumb: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#fff' }, toggleThumbOn: { alignSelf: 'flex-end' },
  consentRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, consentIcon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft }, consentTitle: { color: colors.ink, fontSize: 6, fontWeight: '700' }, consentDetail: { color: colors.muted, fontSize: 5, marginTop: 3 }, smallButton: { minHeight: 23, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: 3, backgroundColor: colors.limeSoft }, smallButtonText: { color: colors.forest, fontSize: 5, fontWeight: '700' },
  disclaimer: { color: '#89938b', fontSize: 5, lineHeight: 9, marginTop: 6 }, requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 5 }, requestLabel: { color: colors.muted, fontSize: 5, fontWeight: '700' }, requestStudent: { color: colors.ink, fontSize: 7, fontWeight: '600', marginTop: 3 }, primaryButton: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, borderRadius: 3, backgroundColor: colors.forest }, primaryButtonText: { color: '#fff', fontSize: 5, fontWeight: '600' }, requestRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, requestTitle: { color: colors.ink, fontSize: 6, fontWeight: '600' }, requestMeta: { color: colors.muted, fontSize: 5, marginTop: 3 }, requestActions: { alignItems: 'flex-end', gap: 4 }, requestStatus: { color: '#927130', fontSize: 5 }, exportButton: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.blueSoft, paddingHorizontal: 5, paddingVertical: 4, borderRadius: 3 }, exportText: { color: '#4f7188', fontSize: 5, fontWeight: '600' }, emptyText: { color: colors.muted, fontSize: 6, paddingVertical: 6 },
  leiWarning: { padding: 7, backgroundColor: colors.orangeSoft, borderRadius: 3 }, leiWarningText: { color: '#93513c', fontSize: 6, lineHeight: 9 }, reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 }, reasonChip: { minHeight: 21, justifyContent: 'center', paddingHorizontal: 5, borderRadius: 3, backgroundColor: '#f0f2ee' }, reasonChipActive: { backgroundColor: colors.blueSoft }, reasonText: { color: colors.muted, fontSize: 5 }, reasonTextActive: { color: '#4c7188', fontWeight: '700' }, justificationInput: { minHeight: 56, borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 6, fontSize: 6, textAlignVertical: 'top' }, leiButton: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6, borderRadius: 3, backgroundColor: colors.forest }, leiButtonText: { color: '#fff', fontSize: 5, fontWeight: '600' },
  auditRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, auditDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.blue }, auditAction: { color: colors.ink, fontSize: 5, fontWeight: '600', textTransform: 'capitalize' }, auditResource: { color: colors.muted, fontSize: 5, marginTop: 2 }, auditTime: { color: colors.muted, fontSize: 5 },
  retentionControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 3, marginTop: 6 }, retentionInput: { width: 52, height: 22, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 4, fontSize: 5 }, retentionRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf0eb', marginTop: 5, paddingTop: 4 }, retentionCategory: { color: colors.ink, fontSize: 5, textTransform: 'capitalize' }, retentionValue: { color: colors.muted, fontSize: 5 }, footerText: { color: '#99a198', fontSize: 5, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
});