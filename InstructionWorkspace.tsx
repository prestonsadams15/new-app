import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookOpen, CalendarDays, ClipboardList } from 'lucide-react-native';
import { LessonPlannerWorkspace } from './LessonPlannerWorkspace';
import { SpecialEducationWorkspace } from './SpecialEducationWorkspace';

type Mode = 'Lesson planner' | 'Special education';

const colors = { ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c' };

export function InstructionWorkspace({ narrow }: { narrow: boolean }) {
  const [mode, setMode] = useState<Mode>('Lesson planner');
  const options: { label: Mode; icon: typeof BookOpen }[] = [
    { label: 'Lesson planner', icon: CalendarDays },
    { label: 'Special education', icon: ClipboardList },
  ];
  return <View style={styles.workspace}>
    <View style={styles.modeTabs}>
      {options.map(({ label, icon: Icon }) => {
        const selected = mode === label;
        return <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setMode(label)} style={[styles.modeTab, selected && styles.modeTabSelected]}>
          <Icon size={13} color={selected ? '#fff' : colors.muted} />
          <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{label}</Text>
        </Pressable>;
      })}
    </View>
    {mode === 'Lesson planner' ? <LessonPlannerWorkspace narrow={narrow} /> : <SpecialEducationWorkspace narrow={narrow} />}
  </View>;
}

const styles = StyleSheet.create({
  workspace: { gap: 8 },
  modeTabs: { flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 7 },
  modeTab: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#e9ede7' },
  modeTabSelected: { backgroundColor: colors.forest },
  modeText: { color: '#68746b', fontSize: 8, fontWeight: '600' },
  modeTextSelected: { color: '#fff' },
});