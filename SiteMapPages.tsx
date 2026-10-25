import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Database, Hammer, PlayCircle, Users } from 'lucide-react-native';
import {
  hubFor,
  hubs,
  roleLabels,
  sectionsForHub,
  type AppRole,
  type ChildTab,
  type PrimarySection,
  type PrimarySectionId,
} from './Layout';

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', paper: '#ffffff', canvas: '#f5f6f2',
  forest: '#284b3c', forestDeep: '#20392f', lime: '#c5e889', limeSoft: '#eef6e3',
  orange: '#d8774d', orangeSoft: '#fff0e9', blue: '#6e94b1', blueSoft: '#eaf1f6',
};

function uniqueRoles(tabs: ChildTab[]): AppRole[] {
  return Array.from(new Set(tabs.flatMap((tab) => tab.roles)));
}

function StatusBadge({ status }: { status: ChildTab['status'] }) {
  const demo = status === 'demo';
  return <View style={[styles.badge, { backgroundColor: demo ? colors.limeSoft : colors.blueSoft }]}>
    {demo ? <PlayCircle size={10} color="#50753a" /> : <Hammer size={10} color="#476f8b" />}
    <Text style={[styles.badgeText, { color: demo ? '#50753a' : '#476f8b' }]}>{demo ? 'INTERACTIVE DEMO' : 'PLANNED'}</Text>
  </View>;
}

function DataChips({ tables }: { tables?: string[] }) {
  if (!tables?.length) return null;
  return <View style={styles.dataRow}>
    <Database size={11} color={colors.muted} />
    {tables.map((table) => <Text key={table} style={styles.dataChip}>{table}</Text>)}
  </View>;
}

function Progress({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${percent}%` as `${number}%` }]} /></View>;
}

/** Landing page for a section: every page in it, what it does, and how far along it is. */
export function SectionOverview({ section, tabs, narrow, onOpen }: {
  section: PrimarySection;
  tabs: ChildTab[];
  narrow: boolean;
  onOpen: (tabId: string) => void;
}) {
  const hub = hubFor(section);
  const demoCount = tabs.filter((tab) => tab.status === 'demo').length;
  const Icon = section.icon;
  return <View style={styles.stack}>
    <View style={[styles.hero, narrow && styles.heroNarrow]}>
      <View style={styles.heroIcon}><Icon size={22} color={colors.forestDeep} /></View>
      <View style={{ flex: 1, minWidth: 200 }}>
        <Text style={styles.eyebrowLight}>{hub.title.toUpperCase()} · PILLAR {String(section.pillarId).padStart(2, '0')}</Text>
        <Text style={styles.heroTitle}>{section.title}</Text>
        <Text style={styles.heroCopy}>{section.summary}</Text>
      </View>
      <View style={styles.heroStats}>
        <View style={styles.heroStat}><Text style={styles.heroStatValue}>{tabs.length}</Text><Text style={styles.heroStatLabel}>PAGES</Text></View>
        <View style={styles.heroStat}><Text style={styles.heroStatValue}>{demoCount}</Text><Text style={styles.heroStatLabel}>DEMOS</Text></View>
        <View style={styles.heroStat}><Text style={styles.heroStatValue}>{tabs.length - demoCount}</Text><Text style={styles.heroStatLabel}>PLANNED</Text></View>
      </View>
    </View>

    <View style={styles.cardGrid}>
      {tabs.map((tab, index) => <Pressable key={tab.id} accessibilityRole="link" accessibilityLabel={`Open ${tab.label}`} onPress={() => onOpen(tab.id)} style={({ hovered }: any) => [styles.pageCard, narrow && styles.pageCardNarrow, hovered && styles.pageCardHover]}>
        <View style={styles.pageCardTop}><Text style={styles.pageNumber}>{String(index + 1).padStart(2, '0')}</Text><StatusBadge status={tab.status} /></View>
        <Text style={styles.pageTitle}>{tab.label}</Text>
        <Text style={styles.pageSummary}>{tab.summary}</Text>
        <View style={styles.capList}>{tab.capabilities.slice(0, 3).map((capability) => <View key={capability} style={styles.capRow}><View style={styles.capDot} /><Text style={styles.capText}>{capability}</Text></View>)}</View>
        <DataChips tables={tab.data} />
        <View style={styles.pageCardFooter}><Text style={styles.openText}>{tab.status === 'demo' ? 'Open page' : 'View blueprint'}</Text><ArrowRight size={13} color={colors.forest} /></View>
      </Pressable>)}
    </View>

    <View style={styles.rolePanel}>
      <View style={styles.rolePanelHeader}><Users size={14} color={colors.forest} /><Text style={styles.panelTitle}>Who uses {section.title}</Text></View>
      <View style={styles.roleChips}>{uniqueRoles(tabs).map((role) => <Text key={role} style={styles.roleChip}>{roleLabels[role]}</Text>)}</View>
      <Text style={styles.footnote}>Pages are filtered by your district role. Every page reads through the same shared district data layer, so a student record updated here appears everywhere it is used.</Text>
    </View>
  </View>;
}

/** Shown for pages that are on the roadmap but not built yet. */
export function ModuleBlueprint({ section, tab, siblings, narrow, onBack, onOpen }: {
  section: PrimarySection;
  tab: ChildTab;
  siblings: ChildTab[];
  narrow: boolean;
  onBack: () => void;
  onOpen: (tabId: string) => void;
}) {
  const related = siblings.filter((item) => item.id !== tab.id && item.status === 'demo');
  return <View style={styles.stack}>
    <View style={styles.blueprint}>
      <View style={styles.blueprintTop}><StatusBadge status="planned" /><Text style={styles.blueprintMeta}>{section.title.toUpperCase()} / {tab.label.toUpperCase()}</Text></View>
      <Text style={styles.blueprintTitle}>{tab.label}</Text>
      <Text style={styles.blueprintCopy}>{tab.summary}</Text>
    </View>

    <View style={[styles.blueprintGrid, narrow && styles.blueprintGridNarrow]}>
      <View style={[styles.panel, { flex: 2 }]}>
        <Text style={styles.panelTitle}>What this page will do</Text>
        <View style={{ marginTop: 10 }}>{tab.capabilities.map((capability) => <View key={capability} style={styles.checkRow}><Circle size={14} color="#b9c4bb" /><Text style={styles.checkText}>{capability}</Text></View>)}</View>
      </View>
      <View style={[styles.panel, { flex: 1 }]}>
        <Text style={styles.panelTitle}>Who will use it</Text>
        <View style={[styles.roleChips, { marginTop: 10 }]}>{tab.roles.map((role) => <Text key={role} style={styles.roleChip}>{roleLabels[role]}</Text>)}</View>
        <Text style={[styles.panelTitle, { marginTop: 16 }]}>Data it needs</Text>
        {tab.data?.length ? <View style={{ marginTop: 8 }}><DataChips tables={tab.data} /></View>
          : <Text style={styles.footnote}>New tables. No migration exists yet for this page.</Text>}
      </View>
    </View>

    {related.length ? <View style={styles.panel}>
      <Text style={styles.panelTitle}>Working pages in {section.title}</Text>
      <View style={styles.relatedRow}>{related.map((item) => <Pressable key={item.id} onPress={() => onOpen(item.id)} style={styles.relatedChip}><CheckCircle2 size={12} color="#618d43" /><Text style={styles.relatedText}>{item.label}</Text><ArrowRight size={12} color={colors.forest} /></Pressable>)}</View>
    </View> : null}

    <Pressable onPress={onBack} style={styles.backLink}><ArrowLeft size={13} color={colors.forest} /><Text style={styles.openText}>Back to {section.title} overview</Text></Pressable>
  </View>;
}

/** Home-page breakdown of the whole platform: hub → section → pages. */
export function HubBreakdown({ sections, tabsFor, narrow, onOpenSection }: {
  sections: PrimarySection[];
  tabsFor: (section: PrimarySection) => ChildTab[];
  narrow: boolean;
  onOpenSection: (sectionId: PrimarySectionId) => void;
}) {
  const allTabs = sections.flatMap(tabsFor);
  const demos = allTabs.filter((tab) => tab.status === 'demo').length;
  return <View style={styles.breakdown}>
    <View style={styles.breakdownHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>PLATFORM MAP</Text>
        <Text style={styles.breakdownTitle}>{hubs.length} hubs · {sections.length} sections · {allTabs.length} pages</Text>
        <Text style={styles.breakdownCopy}>{demos} pages have interactive demos. The rest are blueprints showing what each will do.</Text>
      </View>
    </View>
    <View style={[styles.hubColumns, narrow && styles.hubColumnsNarrow]}>
      {hubs.map((hub) => {
        const hubSections = sectionsForHub(hub.id, sections);
        if (!hubSections.length) return null;
        const HubIcon = hub.icon;
        return <View key={hub.id} style={styles.hubColumn}>
          <View style={styles.hubHeader}><View style={styles.hubIcon}><HubIcon size={15} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.hubTitle}>{hub.title}</Text><Text style={styles.hubSummary}>{hub.summary}</Text></View></View>
          {hubSections.map((section) => {
            const tabs = tabsFor(section);
            const done = tabs.filter((tab) => tab.status === 'demo').length;
            const SectionIcon = section.icon;
            return <Pressable key={section.id} accessibilityRole="link" onPress={() => onOpenSection(section.id)} style={({ hovered }: any) => [styles.sectionRow, hovered && styles.sectionRowHover]}>
              <SectionIcon size={15} color={colors.forest} />
              <View style={{ flex: 1 }}>
                <View style={styles.sectionRowTop}><Text style={styles.sectionRowTitle}>{section.title}</Text><Text style={styles.sectionRowCount}>{done}/{tabs.length}</Text></View>
                <Progress done={done} total={tabs.length} />
                <Text numberOfLines={1} style={styles.sectionRowPages}>{tabs.map((tab) => tab.label).join(' · ')}</Text>
              </View>
              <ArrowRight size={13} color="#98a29a" />
            </Pressable>;
          })}
        </View>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  eyebrow: { color: colors.forest, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  eyebrowLight: { color: '#b9cdbf', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, backgroundColor: colors.forestDeep, borderRadius: 8, padding: 20 },
  heroNarrow: { padding: 16 },
  heroIcon: { width: 46, height: 46, borderRadius: 10, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 5 },
  heroCopy: { color: '#c7d5cb', fontSize: 12, lineHeight: 18, marginTop: 4, maxWidth: 520 },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStat: { minWidth: 64, borderRadius: 6, backgroundColor: '#2c4a3d', paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center' },
  heroStatValue: { color: colors.lime, fontSize: 20, fontWeight: '700' },
  heroStatLabel: { color: '#a9bdb0', fontSize: 8, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pageCard: { flexGrow: 1, flexBasis: '30%', minWidth: 230, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 14 },
  pageCardNarrow: { flexBasis: '100%', minWidth: 0 },
  pageCardHover: { borderColor: colors.forest, backgroundColor: '#fafcf8' },
  pageCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageNumber: { color: '#98a29a', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  pageTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 10 },
  pageSummary: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  capList: { marginTop: 10, gap: 5 },
  capRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  capDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#9fb5a4', marginTop: 6 },
  capText: { flex: 1, color: '#4f5c53', fontSize: 10, lineHeight: 15 },
  dataRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 10 },
  dataChip: { color: '#55635a', fontSize: 9, fontFamily: 'monospace', backgroundColor: colors.canvas, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  pageCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto', paddingTop: 12 },
  openText: { color: colors.forest, fontSize: 11, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  rolePanel: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 14 },
  rolePanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  panel: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 14 },
  panelTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 9 },
  roleChip: { color: colors.forest, fontSize: 10, fontWeight: '600', backgroundColor: '#edf3e9', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 4 },
  footnote: { color: '#879189', fontSize: 10, lineHeight: 15, marginTop: 10 },
  blueprint: { backgroundColor: colors.paper, borderWidth: 1, borderStyle: 'dashed', borderColor: '#b9c9bd', borderRadius: 8, padding: 20 },
  blueprintTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  blueprintMeta: { color: '#98a29a', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  blueprintTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', marginTop: 10 },
  blueprintCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 560 },
  blueprintGrid: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  blueprintGridNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7, borderTopWidth: 1, borderTopColor: '#f0f2ee' },
  checkText: { flex: 1, color: '#3f4c43', fontSize: 11 },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  relatedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 5, paddingHorizontal: 9, paddingVertical: 6 },
  relatedText: { color: colors.ink, fontSize: 11, fontWeight: '500' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  breakdown: { paddingTop: 18, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#e4e9e1', borderBottomWidth: 1, borderBottomColor: '#e4e9e1', marginBottom: 14 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  breakdownTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 5 },
  breakdownCopy: { color: colors.muted, fontSize: 10, marginTop: 4 },
  hubColumns: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  hubColumnsNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  hubColumn: { flex: 1, minWidth: 0, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 12 },
  hubHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingBottom: 10 },
  hubIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#e7efe3', alignItems: 'center', justifyContent: 'center' },
  hubTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  hubSummary: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingVertical: 9, paddingHorizontal: 4, borderRadius: 4 },
  sectionRowHover: { backgroundColor: '#f6f9f4' },
  sectionRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionRowTitle: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  sectionRowCount: { color: '#87938a', fontSize: 9, fontWeight: '700' },
  sectionRowPages: { color: '#89938b', fontSize: 9, marginTop: 4 },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: '#e9eee7', marginTop: 5 },
  progressValue: { height: 3, borderRadius: 2, backgroundColor: '#7fa65f' },
});
