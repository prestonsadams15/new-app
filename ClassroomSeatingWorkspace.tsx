import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookOpen, Check, Clock3, Minus, Plus, Search, Shuffle, Users, X } from 'lucide-react-native';

type BlockType = 'desk' | 'table-2' | 'table-4' | 'table-6' | 'rug' | 'lab' | 'teacher-desk' | 'board' | 'door' | 'window';
type PlacementMode = 'assign' | 'build';
type AutoMode = 'Alphabetical' | 'Random shuffle' | 'Balanced';
type Student = {
  id: string;
  name: string;
  initials: string;
  language: string;
  accommodation?: string;
  frontRow?: boolean;
  avoidWith?: string[];
  behaviorAlert?: string;
  academicLevel: number;
  behaviorNeed: number;
  predictedGrade: string;
};
type FloorBlock = { id: string; type: BlockType; x: number; y: number; label: string };
type SeatAssignment = Record<string, string[]>;

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f',
  lime: '#c5e889', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6',
  orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df', white: '#fff',
};

const blockOptions: { type: BlockType; label: string; icon: string; capacity: number; structural?: boolean }[] = [
  { type: 'desk', label: 'Single desk', icon: '🪑', capacity: 1 },
  { type: 'table-2', label: '2-seat table', icon: '🪵', capacity: 2 },
  { type: 'table-4', label: '4-seat table', icon: '🪵', capacity: 4 },
  { type: 'table-6', label: '6-seat table', icon: '🪵', capacity: 6 },
  { type: 'rug', label: 'Rug spot', icon: '🧘', capacity: 4 },
  { type: 'lab', label: 'Lab station', icon: '🔬', capacity: 2 },
  { type: 'teacher-desk', label: 'Teacher desk', icon: '🧑‍🏫', capacity: 0, structural: true },
  { type: 'board', label: 'Whiteboard', icon: '📽️', capacity: 0, structural: true },
  { type: 'door', label: 'Door', icon: '🚪', capacity: 0, structural: true },
  { type: 'window', label: 'Window', icon: '🪟', capacity: 0, structural: true },
];

const demoStudents: Student[] = [
  { id: 'alex', name: 'Alex Mercer', initials: 'AM', language: 'Spanish', accommodation: 'Audio read-aloud · extended time', frontRow: true, avoidWith: ['marcus'], behaviorAlert: 'Do not seat next to Marcus V.', academicLevel: 2.4, behaviorNeed: 2, predictedGrade: 'B+' },
  { id: 'marcus', name: 'Marcus Vega', initials: 'MV', language: 'English', academicLevel: 2.1, behaviorNeed: 2, predictedGrade: 'B' },
  { id: 'maya', name: 'Maya Thompson', initials: 'MT', language: 'English', academicLevel: 3.2, behaviorNeed: 1, predictedGrade: 'A-' },
  { id: 'ethan', name: 'Ethan Chen', initials: 'EC', language: 'Mandarin', accommodation: 'Preferential seating', frontRow: true, academicLevel: 3.7, behaviorNeed: 1, predictedGrade: 'A' },
  { id: 'sofia', name: 'Sofia Martinez', initials: 'SM', language: 'Spanish', academicLevel: 2.8, behaviorNeed: 2, predictedGrade: 'B+' },
  { id: 'noah', name: 'Noah Williams', initials: 'NW', language: 'English', accommodation: 'Movement breaks', academicLevel: 1.8, behaviorNeed: 3, predictedGrade: 'C+' },
  { id: 'ava', name: 'Ava Johnson', initials: 'AJ', language: 'English', academicLevel: 3.1, behaviorNeed: 1, predictedGrade: 'A-' },
  { id: 'lucas', name: 'Lucas Brooks', initials: 'LB', language: 'English', academicLevel: 2.5, behaviorNeed: 2, predictedGrade: 'B' },
  { id: 'elena', name: 'Elena Garcia', initials: 'EG', language: 'Spanish', frontRow: true, academicLevel: 2.2, behaviorNeed: 2, predictedGrade: 'B-' },
  { id: 'kai', name: 'Kai Ahmed', initials: 'KA', language: 'Arabic', accommodation: 'Large print', academicLevel: 3.4, behaviorNeed: 1, predictedGrade: 'A-' },
  { id: 'ivy', name: 'Ivy Morgan', initials: 'IM', language: 'English', academicLevel: 1.9, behaviorNeed: 3, predictedGrade: 'C+' },
  { id: 'owen', name: 'Owen Brooks', initials: 'OB', language: 'English', academicLevel: 3.3, behaviorNeed: 1, predictedGrade: 'A-' },
];

const startingBlocks: FloorBlock[] = [
  { id: 'board-1', type: 'board', x: 4, y: 0, label: 'Whiteboard' },
  { id: 'window-1', type: 'window', x: 1, y: 0, label: 'Window' },
  { id: 'window-2', type: 'window', x: 10, y: 0, label: 'Window' },
  { id: 'teacher-1', type: 'teacher-desk', x: 6, y: 1, label: 'Teacher desk' },
  ...[2, 4, 6, 8, 10].flatMap((x, row) => [3, 5, 7].map((y, column) => ({ id: `desk-${row * 3 + column + 1}`, type: 'desk' as const, x, y, label: `Desk ${row * 3 + column + 1}` }))),
  { id: 'door-1', type: 'door', x: 0, y: 9, label: 'Door' },
];

function blockOption(type: BlockType) {
  return blockOptions.find((item) => item.type === type) ?? blockOptions[0];
}

function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'blue' | 'yellow' | 'orange' }) {
  const toneStyle = tone === 'green' ? styles.tagGreen : tone === 'blue' ? styles.tagBlue : tone === 'yellow' ? styles.tagYellow : tone === 'orange' ? styles.tagOrange : styles.tagNeutral;
  return <Text style={[styles.tag, toneStyle]}>{children}</Text>;
}

export function ClassroomSeatingWorkspace({ narrow }: { narrow: boolean }) {
  const [columns, setColumns] = useState(12);
  const [rows, setRows] = useState(10);
  const [blocks, setBlocks] = useState(startingBlocks);
  const [assignments, setAssignments] = useState<SeatAssignment>({
    'desk-1': ['alex'], 'desk-2': ['maya'], 'desk-3': ['sofia'], 'desk-4': ['ethan'], 'desk-5': ['noah'], 'desk-6': ['ava'],
  });
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType>('desk');
  const [mode, setMode] = useState<PlacementMode>('assign');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentDetailId, setSelectedStudentDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState<'Unassigned' | 'All students'>('Unassigned');
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Tardy' | 'Absent'>>({});
  const [notice, setNotice] = useState('');
  const [pointAward, setPointAward] = useState(1);
  const [pointBalances, setPointBalances] = useState<Record<string, number>>({});
  const [blockCounter, setBlockCounter] = useState(30);

  const assignedIds = useMemo(() => new Set(Object.values(assignments).flat()), [assignments]);
  const selectedStudent = demoStudents.find((student) => student.id === selectedStudentDetailId);
  const visibleRoster = demoStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = rosterFilter === 'All students' || !assignedIds.has(student.id);
    return matchesSearch && matchesFilter;
  });
  const blockAt = (x: number, y: number) => blocks.find((block) => block.x === x && block.y === y);

  const resize = (axis: 'columns' | 'rows', amount: number) => {
    const next = axis === 'columns' ? Math.max(6, Math.min(16, columns + amount)) : Math.max(6, Math.min(15, rows + amount));
    const outside = blocks.some((block) => axis === 'columns' ? block.x >= next : block.y >= next);
    if (outside) { setNotice('Move or remove blocks beyond the new room edge before shrinking the grid.'); return; }
    if (axis === 'columns') setColumns(next);
    else setRows(next);
  };

  const placeBlock = (x: number, y: number) => {
    if (blockAt(x, y)) { setNotice('That grid cell is occupied. Remove or move its block first.'); return; }
    const label = blockOption(selectedBlockType).label;
    const block = { id: `block-${blockCounter}`, type: selectedBlockType, x, y, label: `${label} ${blockCounter - 29}` };
    setBlocks((current) => [...current, block]);
    setBlockCounter((current) => current + 1);
    setNotice(`${label} placed at column ${x + 1}, row ${y + 1}.`);
  };

  const removeBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
    setAssignments((current) => { const next = { ...current }; delete next[blockId]; return next; });
    setSelectedStudentDetailId(null);
    setNotice('Floor-plan block removed. Its seat assignments were cleared.');
  };

  const studentHasConflict = (studentId: string, block: FloorBlock, currentAssignments: SeatAssignment) => {
    const student = demoStudents.find((entry) => entry.id === studentId);
    if (!student) return false;
    if (student.frontRow && block.y > 3) return true;
    return blocks.some((otherBlock) => {
      if (otherBlock.id === block.id || Math.abs(otherBlock.x - block.x) + Math.abs(otherBlock.y - block.y) > 1) return false;
      return (currentAssignments[otherBlock.id] ?? []).some((otherId) => {
        if (otherId === studentId) return false;
        const otherStudent = demoStudents.find((entry) => entry.id === otherId);
        return student.avoidWith?.includes(otherId) || otherStudent?.avoidWith?.includes(studentId);
      });
    }) || (currentAssignments[block.id] ?? []).some((otherId) => otherId !== studentId && (student.avoidWith?.includes(otherId)
      || demoStudents.find((entry) => entry.id === otherId)?.avoidWith?.includes(studentId)));
  };

  const assignStudent = (block: FloorBlock, studentId: string) => {
    const capacity = blockOption(block.type).capacity;
    if (capacity < 1) { setNotice('Room structures are not assignable seats.'); return; }
    if (assignments[block.id]?.includes(studentId)) {
      setSelectedStudentDetailId(studentId);
      return;
    }
    const currentCount = assignments[block.id]?.length ?? 0;
    if (currentCount >= capacity) { setNotice(`${block.label} has no open seats.`); return; }
    const assignmentsWithoutStudent: SeatAssignment = {};
    Object.entries(assignments).forEach(([blockId, ids]) => { assignmentsWithoutStudent[blockId] = ids.filter((id) => id !== studentId); });
    if (studentHasConflict(studentId, block, assignmentsWithoutStudent)) { setNotice('Placement blocked by a front-row or student separation rule. Choose a compliant seat.'); return; }
    setAssignments((current) => {
      const next: SeatAssignment = {};
      Object.entries(current).forEach(([blockId, ids]) => { next[blockId] = ids.filter((id) => id !== studentId); });
      next[block.id] = [...(next[block.id] ?? []), studentId];
      return next;
    });
    setSelectedStudentId(null);
    setSelectedStudentDetailId(studentId);
    setNotice(`${demoStudents.find((student) => student.id === studentId)?.name} assigned to ${block.label}.`);
  };

  const onGridCellPress = (x: number, y: number) => {
    const block = blockAt(x, y);
    if (mode === 'build') { placeBlock(x, y); return; }
    if (block && selectedStudentId) { assignStudent(block, selectedStudentId); return; }
    if (block) {
      const studentId = assignments[block.id]?.[0];
      if (studentId) setSelectedStudentDetailId(studentId);
      else setNotice(blockOption(block.type).capacity > 0 ? `${block.label} is open.` : `${block.label} is a room structure.`);
    }
  };

  const makeSeatList = () => blocks.filter((block) => blockOption(block.type).capacity > 0)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .flatMap((block) => Array.from({ length: blockOption(block.type).capacity }, (_, seatIndex) => ({ block, seatIndex })));

  const autoSeat = (autoMode: AutoMode) => {
    const unassigned = demoStudents.filter((student) => !assignedIds.has(student.id));
    const openSeats = makeSeatList().filter(({ block }) => (assignments[block.id]?.length ?? 0) < blockOption(block.type).capacity);
    if (!unassigned.length || !openSeats.length) { setNotice('Add open seat blocks and unassigned students before generating a layout.'); return; }
    let candidates = [...unassigned];
    if (autoMode === 'Alphabetical') candidates.sort((a, b) => a.name.localeCompare(b.name));
    if (autoMode === 'Random shuffle') {
      for (let index = candidates.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
      }
    }
    if (autoMode === 'Balanced') candidates.sort((a, b) => Number(Boolean(b.frontRow)) - Number(Boolean(a.frontRow)) || a.academicLevel - b.academicLevel || a.name.localeCompare(b.name));
    const next = Object.fromEntries(Object.entries(assignments).map(([blockId, ids]) => [blockId, [...ids]])) as SeatAssignment;
    const placed: string[] = [];
    const skipped: string[] = [];
    for (const student of candidates) {
      const freeSeats = openSeats.filter(({ block }) => (next[block.id]?.length ?? 0) < blockOption(block.type).capacity);
      let validSeats = freeSeats.filter(({ block }) => !studentHasConflict(student.id, block, next));
      if (autoMode === 'Balanced') {
        const targetAverage = demoStudents.reduce((total, entry) => total + entry.academicLevel, 0) / demoStudents.length;
        validSeats.sort((left, right) => {
          const score = (block: FloorBlock) => {
            const current = next[block.id] ?? [];
            const currentStudents = current.map((id) => demoStudents.find((entry) => entry.id === id)).filter((entry): entry is Student => Boolean(entry));
            const academicAverage = (currentStudents.reduce((sum, entry) => sum + entry.academicLevel, 0) + student.academicLevel) / (currentStudents.length + 1);
            const behaviorAverage = (currentStudents.reduce((sum, entry) => sum + entry.behaviorNeed, 0) + student.behaviorNeed) / (currentStudents.length + 1);
            return Math.abs(academicAverage - targetAverage) + Math.abs(behaviorAverage - 1.8) * 0.45 + (student.frontRow ? block.y * 0.08 : 0);
          };
          return score(left.block) - score(right.block) || left.block.y - right.block.y || left.block.x - right.block.x;
        });
      }
      const seat = validSeats[0];
      if (!seat) { skipped.push(student.name); continue; }
      next[seat.block.id] = [...(next[seat.block.id] ?? []), student.id];
      placed.push(student.name);
    }
    setAssignments(next);
    setNotice(`${autoMode}: assigned ${placed.length} students${skipped.length ? `; skipped ${skipped.length} to preserve separation rules` : ''}. Review the draft before saving.`);
  };

  const applyAttendance = (status: 'Tardy' | 'Absent') => {
    if (!selectedStudent) return;
    setAttendance((current) => ({ ...current, [selectedStudent.id]: status }));
    setNotice(`${selectedStudent.name} marked ${status.toLowerCase()} in this local preview.`);
  };

  const awardBehaviorPoints = () => {
    if (!selectedStudent) return;
    setPointBalances((current) => ({ ...current, [selectedStudent.id]: (current[selectedStudent.id] ?? 0) + pointAward }));
    setNotice(`+${pointAward} PBIS point${pointAward === 1 ? '' : 's'} awarded to ${selectedStudent.name} in this preview.`);
  };

  const webDragProps = (studentId: string) => Platform.OS === 'web' ? ({
    draggable: true,
    onDragStart: (event: any) => { event.dataTransfer?.setData('text/plain', studentId); setSelectedStudentId(studentId); },
  } as any) : {};

  const webDropProps = (block: FloorBlock | undefined) => Platform.OS === 'web' && block && blockOption(block.type).capacity > 0 ? ({
    onDragOver: (event: any) => event.preventDefault(),
    onDrop: (event: any) => { event.preventDefault(); const studentId = event.dataTransfer?.getData('text/plain'); if (studentId) assignStudent(block, studentId); },
  } as any) : {};

  return (
    <View style={styles.workspace}>
      <View style={[styles.header, narrow && styles.headerNarrow]}>
        <View style={styles.headerIcon}><Users size={16} color={colors.forest} /></View>
        <View style={{ flex: 1, minWidth: 130 }}><Text style={styles.headerTitle}>Classroom seating chart</Text><Text style={styles.headerSubtitle}>Evergreen Elementary · Grade 5 Math · Draft layout</Text></View>
        <View style={styles.headerActions}><View style={styles.draftBadge}><Text style={styles.draftText}>LOCAL DRAFT</Text></View><Pressable onPress={() => setNotice('Floor plan saved locally. Supabase sync is not connected.')} style={styles.saveButton}><Check size={11} color="#fff" /><Text style={styles.saveButtonText}>Save layout</Text></Pressable></View>
      </View>
      <View style={[styles.toolbar, narrow && styles.toolbarNarrow]}>
        <View style={styles.modeControl}>{(['assign', 'build'] as const).map((item) => <Pressable key={item} onPress={() => setMode(item)} style={[styles.modeButton, mode === item && styles.modeButtonActive]}><Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item === 'assign' ? 'Assign students' : 'Build floor plan'}</Text></Pressable>)}</View>
        <View style={styles.dimensionControls}><Text style={styles.controlLabel}>GRID</Text><Pressable accessibilityLabel="Remove column" onPress={() => resize('columns', -1)} style={styles.stepperButton}><Minus size={11} color={colors.forest} /></Pressable><Text style={styles.dimensionValue}>{columns} × {rows}</Text><Pressable accessibilityLabel="Add column" onPress={() => resize('columns', 1)} style={styles.stepperButton}><Plus size={11} color={colors.forest} /></Pressable><View style={styles.dimensionDivider} /><Pressable accessibilityLabel="Remove row" onPress={() => resize('rows', -1)} style={styles.stepperButton}><Minus size={11} color={colors.forest} /></Pressable><Pressable accessibilityLabel="Add row" onPress={() => resize('rows', 1)} style={styles.stepperButton}><Plus size={11} color={colors.forest} /></Pressable><Text style={styles.controlLabel}>COLS / ROWS</Text></View>
      </View>
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text><Pressable accessibilityLabel="Dismiss notice" onPress={() => setNotice('')}><X size={12} color={colors.forest} /></Pressable></View> : null}
      {mode === 'build' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
        <Text style={styles.controlLabel}>PLACE</Text>
        {blockOptions.map((option) => <Pressable key={option.type} onPress={() => setSelectedBlockType(option.type)} style={[styles.paletteItem, selectedBlockType === option.type && styles.paletteItemSelected]}><Text style={styles.paletteIcon}>{option.icon}</Text><Text style={[styles.paletteText, selectedBlockType === option.type && styles.paletteTextSelected]}>{option.label}</Text></Pressable>)}
      </ScrollView> : <View style={styles.autoBar}><Text style={styles.controlLabel}>AUTO-SEAT</Text>{(['Alphabetical', 'Random shuffle', 'Balanced'] as const).map((item) => <Pressable key={item} onPress={() => autoSeat(item)} style={styles.autoButton}>{item === 'Random shuffle' ? <Shuffle size={11} color={colors.forest} /> : item === 'Balanced' ? <Users size={11} color={colors.forest} /> : <BookOpen size={11} color={colors.forest} />}<Text style={styles.autoButtonText}>{item}</Text></Pressable>)}</View>}

      <View style={[styles.mainLayout, narrow && styles.mainLayoutNarrow]}>
        <View style={[styles.rosterPanel, narrow && styles.rosterPanelNarrow]}>
          <View style={styles.panelHeading}><View><Text style={styles.panelTitle}>Student roster</Text><Text style={styles.panelSubtitle}>{demoStudents.length - assignedIds.size} unassigned · {assignedIds.size} seated</Text></View><Users size={14} color={colors.forest} /></View>
          <View style={styles.rosterFilters}>{(['Unassigned', 'All students'] as const).map((item) => <Pressable key={item} onPress={() => setRosterFilter(item)} style={[styles.filterButton, rosterFilter === item && styles.filterButtonActive]}><Text style={[styles.filterText, rosterFilter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>
          <View style={styles.searchBox}><Search size={12} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Find a student" style={styles.searchInput} /></View>
          <ScrollView style={styles.rosterList} nestedScrollEnabled>
            {visibleRoster.map((student) => <Pressable key={student.id} {...webDragProps(student.id)} onPress={() => { setSelectedStudentId(student.id); setNotice(`Selected ${student.name}. Tap an open seat${Platform.OS === 'web' ? ' or drag their card' : ''} to assign.`); }} style={[styles.rosterStudent, selectedStudentId === student.id && styles.rosterStudentSelected]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{student.initials}</Text></View><View style={{ flex: 1 }}><Text style={styles.rosterName}>{student.name}</Text><Text style={styles.rosterMeta}>Grade 5 · {student.language}</Text></View>{student.frontRow ? <Tag tone="blue">FRONT</Tag> : null}
            </Pressable>)}
            {visibleRoster.length === 0 ? <Text style={styles.emptyText}>No students match this roster filter.</Text> : null}
          </ScrollView>
          <Text style={styles.rosterHint}>{Platform.OS === 'web' ? 'Drag a student card to a seat or select a name, then tap a seat.' : 'Select a student, then tap a seat to assign.'}</Text>
        </View>

        <View style={styles.floorPanel}>
          <View style={styles.floorHeading}><View><Text style={styles.panelTitle}>Room 12 · Floor plan</Text><Text style={styles.panelSubtitle}>Front of room ↑ · {columns} columns · {rows} rows</Text></View><Text style={styles.floorModeLabel}>{mode === 'build' ? `PLACING ${blockOption(selectedBlockType).label.toUpperCase()}` : 'SEATING DRAFT'}</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.floorScroll}>
            <View style={{ width: columns * 58 }}>
              <View style={styles.frontMarker}><View style={styles.frontLine} /><Text style={styles.frontText}>FRONT OF CLASS</Text><View style={styles.frontLine} /></View>
              <View style={[styles.grid, { width: columns * 58 }]}>
                {Array.from({ length: columns * rows }, (_, index) => {
                  const x = index % columns;
                  const y = Math.floor(index / columns);
                  const block = blockAt(x, y);
                  const option = block ? blockOption(block.type) : undefined;
                  const studentIds = block ? assignments[block.id] ?? [] : [];
                  const isStructure = option?.structural;
                  return <Pressable key={`${x}-${y}`} {...webDropProps(block)} onPress={() => onGridCellPress(x, y)} style={[styles.gridCell, block && (isStructure ? styles.structureCell : styles.seatCell), selectedStudentDetailId && block && studentIds.includes(selectedStudentDetailId) && styles.seatCellSelected]}>
                    {block ? <>
                      <View style={styles.blockTop}><Text style={styles.blockIcon}>{option?.icon}</Text>{mode === 'build' ? <Pressable accessibilityLabel={`Remove ${block.label}`} onPress={() => removeBlock(block.id)} style={styles.removeBlock}><X size={9} color={colors.orange} /></Pressable> : null}</View>
                      <Text numberOfLines={1} style={styles.blockLabel}>{isStructure ? block.label : `${studentIds.length}/${option?.capacity} · ${block.label}`}</Text>
                      {studentIds.slice(0, 2).map((studentId) => { const student = demoStudents.find((entry) => entry.id === studentId); return <Text key={studentId} numberOfLines={1} onPress={() => setSelectedStudentDetailId(studentId)} style={styles.seatedName}>{student?.initials} {student?.name.split(' ')[0]}</Text>; })}
                      {studentIds.length > 2 ? <Text style={styles.moreStudents}>+{studentIds.length - 2} seated</Text> : null}
                      {studentIds.some((studentId) => demoStudents.find((student) => student.id === studentId)?.accommodation) ? <Text style={styles.tileBadge}>IEP/504</Text> : null}
                    </> : <Text style={styles.cellNumber}>{x + 1},{y + 1}</Text>}
                  </Pressable>;
                })}
              </View>
            </View>
          </ScrollView>
          <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.limeSoft }]} /><Text style={styles.legendText}>Student seat</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.blueSoft }]} /><Text style={styles.legendText}>Room structure</Text></View><Text style={styles.legendText}>{blocks.filter((block) => blockOption(block.type).capacity > 0).length} seat blocks · {Object.values(assignments).flat().length} students placed</Text></View>
        </View>
      </View>

      {selectedStudent ? <View style={[styles.studentDetail, narrow && styles.studentDetailNarrow]}>
        <View style={styles.detailHeader}><View style={styles.avatar}><Text style={styles.avatarText}>{selectedStudent.initials}</Text></View><View style={{ flex: 1 }}><Text style={styles.detailName}>{selectedStudent.name}</Text><Text style={styles.panelSubtitle}>Grade 5 · {selectedStudent.language} home language</Text></View><Pressable accessibilityLabel="Close student details" onPress={() => setSelectedStudentDetailId(null)} style={styles.closeButton}><X size={13} color={colors.muted} /></Pressable></View>
        <View style={styles.badgeRow}>{selectedStudent.accommodation ? <Tag tone="blue">♿ {selectedStudent.accommodation}</Tag> : null}{selectedStudent.frontRow ? <Tag tone="green">🪑 Front row / near board</Tag> : null}{selectedStudent.behaviorAlert ? <Tag tone="orange">⚠️ {selectedStudent.behaviorAlert}</Tag> : null}<Tag tone="neutral">💬 {selectedStudent.language} · translation</Tag></View>
        <View style={styles.detailActions}>
          <View style={styles.quickPoints}><Text style={styles.actionLabel}>PBIS QUICK AWARD</Text><View style={styles.quickPointRow}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setPointAward(value)} style={[styles.pointButton, pointAward === value && styles.pointButtonSelected]}><Text style={[styles.pointText, pointAward === value && styles.pointTextSelected]}>+{value}</Text></Pressable>)}<Pressable onPress={awardBehaviorPoints} style={styles.awardPointButton}><Plus size={11} color="#fff" /><Text style={styles.awardPointText}>Award</Text></Pressable></View><Text style={styles.balanceText}>Preview balance · {pointBalances[selectedStudent.id] ?? 0} points awarded this session</Text></View>
          <View style={styles.quickActions}><Text style={styles.actionLabel}>ATTENDANCE · {attendance[selectedStudent.id] ?? 'Present'}</Text><View style={styles.attendanceButtons}><Pressable onPress={() => applyAttendance('Tardy')} style={styles.attendanceButton}><Clock3 size={11} color={colors.forest} /><Text style={styles.attendanceText}>Mark tardy</Text></Pressable><Pressable onPress={() => applyAttendance('Absent')} style={styles.attendanceButton}><X size={11} color={colors.orange} /><Text style={styles.attendanceText}>Mark absent</Text></Pressable><View style={styles.hattieCard}><BookOpen size={11} color={colors.blue} /><Text style={styles.hattieText}>Hattie self-report · {selectedStudent.predictedGrade}</Text></View></View></View>
        </View>
        <Text style={styles.disclaimer}>Student badges and actions are sample data. Attendance, PBIS, IEP, and Hattie systems are not connected.</Text>
      </View> : null}
      <Text style={styles.footerText}>CLASSROOM MAP DEMO · SAMPLE STUDENTS · LAYOUT AND ASSIGNMENTS ARE LOCAL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 8, minWidth: 0 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 8 },
  headerNarrow: { flexWrap: 'wrap' }, headerIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.limeSoft },
  headerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, headerSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  draftBadge: { paddingHorizontal: 5, paddingVertical: 4, borderRadius: 3, backgroundColor: colors.yellowSoft }, draftText: { color: '#806720', fontSize: 6, fontWeight: '700' }, saveButton: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 3, paddingHorizontal: 7, backgroundColor: colors.forest }, saveButtonText: { color: '#fff', fontSize: 7, fontWeight: '600' },
  toolbar: { minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }, toolbarNarrow: { alignItems: 'flex-start', flexDirection: 'column' }, modeControl: { flexDirection: 'row', padding: 2, borderRadius: 4, backgroundColor: '#e9ede7' }, modeButton: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 3 }, modeButtonActive: { backgroundColor: colors.forest }, modeText: { color: colors.muted, fontSize: 7 }, modeTextActive: { color: '#fff', fontWeight: '700' },
  dimensionControls: { flexDirection: 'row', alignItems: 'center', gap: 4 }, controlLabel: { color: '#89938b', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 }, stepperButton: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 3, backgroundColor: '#fff' }, dimensionValue: { color: colors.ink, minWidth: 32, textAlign: 'center', fontSize: 7, fontWeight: '700' }, dimensionDivider: { width: 1, height: 16, backgroundColor: colors.line, marginHorizontal: 3 },
  notice: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderRadius: 3, paddingHorizontal: 7, backgroundColor: colors.limeSoft }, noticeText: { flex: 1, color: colors.forest, fontSize: 7, lineHeight: 11 },
  palette: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 }, paletteItem: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, backgroundColor: '#fff' }, paletteItemSelected: { borderColor: colors.forest, backgroundColor: colors.limeSoft }, paletteIcon: { fontSize: 10 }, paletteText: { color: colors.muted, fontSize: 6 }, paletteTextSelected: { color: colors.forest, fontWeight: '700' },
  autoBar: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }, autoButton: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, backgroundColor: '#fff' }, autoButtonText: { color: colors.forest, fontSize: 6, fontWeight: '600' },
  mainLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, mainLayoutNarrow: { flexDirection: 'column', alignItems: 'stretch' }, rosterPanel: { width: 230, minHeight: 340, maxHeight: 510, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 8 }, rosterPanelNarrow: { width: '100%' }, floorPanel: { flex: 1, minWidth: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 8 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }, panelTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 6, marginTop: 3 }, rosterFilters: { flexDirection: 'row', gap: 3, marginBottom: 5 }, filterButton: { minHeight: 21, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 3, backgroundColor: '#f0f2ee' }, filterButtonActive: { backgroundColor: colors.limeSoft }, filterText: { color: colors.muted, fontSize: 6 }, filterTextActive: { color: colors.forest, fontWeight: '700' }, searchBox: { height: 26, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5, marginBottom: 5 }, searchInput: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 7 }, rosterList: { flexGrow: 0 }, rosterStudent: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingHorizontal: 2 }, rosterStudentSelected: { backgroundColor: '#f1f6ec' }, avatar: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.blueSoft }, avatarText: { color: colors.forest, fontSize: 6, fontWeight: '700' }, rosterName: { color: colors.ink, fontSize: 7, fontWeight: '600' }, rosterMeta: { color: colors.muted, fontSize: 6, marginTop: 2 }, rosterHint: { color: colors.muted, fontSize: 6, lineHeight: 9, marginTop: 6 }, emptyText: { color: colors.muted, fontSize: 7, paddingVertical: 12 },
  floorHeading: { minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, floorModeLabel: { color: colors.forest, fontSize: 6, fontWeight: '700' }, floorScroll: { paddingBottom: 4 }, frontMarker: { height: 23, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20 }, frontLine: { flex: 1, height: 1, backgroundColor: '#d8e2d5' }, frontText: { color: '#78877b', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 }, grid: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', backgroundColor: '#f7f8f5', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#e9ede7' }, gridCell: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#e9ede7', padding: 2 }, cellNumber: { color: '#d2d8d1', fontSize: 5 }, seatCell: { backgroundColor: '#f0f6eb' }, seatCellSelected: { borderWidth: 2, borderColor: colors.forest }, structureCell: { backgroundColor: colors.blueSoft }, blockTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 13 }, blockIcon: { fontSize: 10 }, removeBlock: { position: 'absolute', right: 0, top: 0, width: 14, height: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: colors.orangeSoft }, blockLabel: { maxWidth: '100%', color: colors.forest, fontSize: 5, fontWeight: '700', textAlign: 'center' }, seatedName: { maxWidth: '100%', color: colors.ink, fontSize: 5, marginTop: 2 }, moreStudents: { color: colors.muted, fontSize: 5 }, tileBadge: { color: '#4f7188', fontSize: 5, fontWeight: '700', marginTop: 2 },
  legend: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap', paddingTop: 4 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 }, legendDot: { width: 7, height: 7, borderRadius: 2 }, legendText: { color: colors.muted, fontSize: 5 },
  studentDetail: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9 }, studentDetailNarrow: { width: '100%' }, detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 }, detailName: { color: colors.ink, fontSize: 9, fontWeight: '700' }, closeButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }, badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 8 }, tag: { overflow: 'hidden', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3, fontSize: 6 }, tagNeutral: { color: '#56645a', backgroundColor: '#f0f2ee' }, tagGreen: { color: colors.forest, backgroundColor: colors.limeSoft }, tagBlue: { color: '#4f7188', backgroundColor: colors.blueSoft }, tagYellow: { color: '#856a2d', backgroundColor: colors.yellowSoft }, tagOrange: { color: '#a8583d', backgroundColor: colors.orangeSoft },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }, quickPoints: { flexGrow: 1, flexBasis: 210 }, quickActions: { flexGrow: 1, flexBasis: 280 }, actionLabel: { color: '#89938b', fontSize: 6, fontWeight: '700', letterSpacing: 0.4, marginBottom: 5 }, quickPointRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, pointButton: { width: 26, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 3 }, pointButtonSelected: { borderColor: colors.forest, backgroundColor: colors.limeSoft }, pointText: { color: colors.muted, fontSize: 7 }, pointTextSelected: { color: colors.forest, fontWeight: '700' }, awardPointButton: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 3, paddingHorizontal: 6, backgroundColor: colors.forest }, awardPointText: { color: '#fff', fontSize: 6, fontWeight: '600' }, balanceText: { color: colors.muted, fontSize: 6, marginTop: 4 }, attendanceButtons: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }, attendanceButton: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5 }, attendanceText: { color: colors.ink, fontSize: 6 }, hattieCard: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 3, paddingHorizontal: 5, backgroundColor: colors.blueSoft }, hattieText: { color: '#4f7188', fontSize: 6, fontWeight: '600' },
  disclaimer: { color: colors.muted, fontSize: 6, lineHeight: 9, marginTop: 8 }, footerText: { color: '#98a198', fontSize: 5, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
});