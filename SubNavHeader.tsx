import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';
import { OVERVIEW_TAB_ID, type ChildTab } from './Layout';

export function SubNavHeader({ sectionTitle, tabs, activeTabId, onSelect }: {
  sectionTitle: string;
  tabs: ChildTab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
}) {
  const overviewSelected = activeTabId === OVERVIEW_TAB_ID;
  return <View style={styles.header}>
    <Text numberOfLines={1} style={styles.label}>{sectionTitle.toUpperCase()}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: overviewSelected }} onPress={() => onSelect(OVERVIEW_TAB_ID)} style={[styles.tab, overviewSelected && styles.tabSelected]}>
        <LayoutGrid size={12} color={overviewSelected ? '#284b3c' : '#7d897f'} />
        <Text style={[styles.tabText, overviewSelected && styles.tabTextSelected]}>Overview</Text>
      </Pressable>
      <View style={styles.divider} />
      {tabs.map((tab) => {
        const selected = tab.id === activeTabId;
        const planned = tab.status === 'planned';
        return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityHint={planned ? 'Planned page' : undefined} onPress={() => onSelect(tab.id)} style={[styles.tab, selected && styles.tabSelected]}>
          <Text style={[styles.tabText, planned && styles.tabTextPlanned, selected && styles.tabTextSelected]}>{tab.label}</Text>
          {planned ? <View style={styles.plannedDot} /> : null}
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  header: { height: 47, flexDirection: 'row', alignItems: 'center', gap: 13, paddingLeft: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e6e9e3' },
  label: { color: '#89938b', fontSize: 8, fontWeight: '700', letterSpacing: 0.6, maxWidth: 140 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 15 },
  tab: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, borderRadius: 4 },
  tabSelected: { backgroundColor: '#edf3e9' },
  tabText: { color: '#68746b', fontSize: 10, fontWeight: '500' },
  tabTextPlanned: { color: '#929b94' },
  tabTextSelected: { color: '#284b3c', fontWeight: '700' },
  plannedDot: { width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: '#9fb3c3' },
  divider: { width: 1, height: 16, backgroundColor: '#e6e9e3', marginHorizontal: 3 },
});
