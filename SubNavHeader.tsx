import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ChildTab } from './Layout';

export function SubNavHeader({ tabs, activeTabId, onSelect }: {
  tabs: ChildTab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
}) {
  return <View style={styles.header}>
    <Text style={styles.label}>SECTION</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {tabs.map((tab) => {
        const selected = tab.id === activeTabId;
        return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onSelect(tab.id)} style={[styles.tab, selected && styles.tabSelected]}>
          <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  header: { height: 47, flexDirection: 'row', alignItems: 'center', gap: 13, paddingLeft: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e6e9e3' },
  label: { color: '#89938b', fontSize: 7, fontWeight: '700', letterSpacing: 0.6 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 15 },
  tab: { minHeight: 29, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 4 },
  tabSelected: { backgroundColor: '#edf3e9' },
  tabText: { color: '#68746b', fontSize: 8, fontWeight: '500' },
  tabTextSelected: { color: '#284b3c', fontWeight: '700' },
});