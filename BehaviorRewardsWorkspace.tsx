import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  Minus,
  Monitor,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Star,
  Timer,
  Trophy,
  Users,
  Wallet,
  Zap,
} from 'lucide-react-native';

type Tab = 'Points' | 'Categories' | 'Class store' | 'Live auction';
type Student = { id: string; name: string; grade: string; room: string; initials: string; tokens: number };
type Category = { id: string; title: string; points: number; tone: 'green' | 'blue' | 'yellow' | 'red'; icon: string; flag?: boolean; custom?: boolean };
type StoreItem = { id: string; title: string; tokenCost: number; remaining: number };
type Order = { id: string; studentId: string; itemId: string; title: string; tokensSpent: number; status: 'Pending fulfillment' | 'Fulfilled' };
type Transaction = { id: string; studentId: string; title: string; points: number; time: string; note?: string; categoryId?: string | null };
type CustomGroup = { id: string; name: string; studentIds: string[] };
type Auction = { id: string; itemId: string; itemTitle: string; startingBid: number; highestBid: number; winnerId: string | null; secondsRemaining: number; status: 'live' | 'sold' | 'ended'; checkoutApplied: boolean };

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c', forestDeep: '#20392f',
  lime: '#c5e889', limeSoft: '#eef6e3', blue: '#6e94b1', blueSoft: '#eaf1f6',
  orange: '#d8774d', orangeSoft: '#fff0e9', yellow: '#d4a944', yellowSoft: '#fbf4df',
};

const seedStudents: Student[] = [
  { id: 'maya', name: 'Maya Thompson', grade: '4', room: '12', initials: 'MT', tokens: 46 },
  { id: 'ethan', name: 'Ethan Chen', grade: '2', room: '08', initials: 'EC', tokens: 28 },
  { id: 'sofia', name: 'Sofia Martinez', grade: '7', room: '18', initials: 'SM', tokens: 63 },
  { id: 'noah', name: 'Noah Williams', grade: '6', room: '21', initials: 'NW', tokens: 45 },
  { id: 'ava', name: 'Ava Johnson', grade: 'K', room: '03', initials: 'AJ', tokens: 32 },
  { id: 'lucas', name: 'Lucas Brooks', grade: '3', room: '14', initials: 'LB', tokens: 74 },
];

const districtCategories: Category[] = [
  { id: 'helping', title: 'Helping Others', points: 2, tone: 'blue', icon: '🤝' },
  { id: 'kindness', title: 'Kindness', points: 1, tone: 'green', icon: '💖' },
  { id: 'safe', title: 'Safe', points: 1, tone: 'blue', icon: '🛡️' },
  { id: 'respectful', title: 'Respectful', points: 2, tone: 'yellow', icon: '🌟' },
  { id: 'responsible', title: 'Responsible', points: 3, tone: 'green', icon: '🎯' },
  { id: 'growth', title: 'Showing Growth', points: 5, tone: 'green', icon: '🚀' },
  { id: 'on-task', title: 'On task', points: 1, tone: 'green', icon: '✅' },
  { id: 'participation', title: 'Active participation', points: 2, tone: 'blue', icon: '🙋' },
  { id: 'completion', title: 'Work completion', points: 1, tone: 'yellow', icon: '📚' },
  { id: 'off-task', title: 'Off task', points: -1, tone: 'red', icon: '⏸️' },
  { id: 'unprepared', title: 'Unprepared', points: -1, tone: 'red', icon: '📝' },
  { id: 'out-of-turn', title: 'Talking out of turn', points: 0, tone: 'yellow', icon: '💬' },
  { id: 'disruptive', title: 'Disruptive', points: -2, tone: 'red', icon: '⚠️' },
  { id: 'needs-work', title: 'Needs Work flag', points: 0, tone: 'yellow', icon: '🚩', flag: true },
];

const categoryIcons = ['🤝', '💖', '🛡️', '🌟', '🎯', '🚀', '📚', '🙋', '✅', '💡'];

const initialItems: StoreItem[] = [
  { id: 'chair', title: 'Sit in teacher chair', tokenCost: 50, remaining: -1 },
  { id: 'homework', title: 'Homework pass', tokenCost: 100, remaining: -1 },
  { id: 'leader', title: 'Line leader for a week', tokenCost: 75, remaining: -1 },
];

const timestamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function BehaviorRewardsWorkspace({ narrow }: { narrow: boolean }) {
  const [tab, setTab] = useState<Tab>('Points');
  const [students, setStudents] = useState(seedStudents);
  const [selectedIds, setSelectedIds] = useState<string[]>(['maya']);
  const [categories, setCategories] = useState(districtCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(districtCategories[0].id);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryPoints, setNewCategoryPoints] = useState(2);
  const [newCategoryIcon, setNewCategoryIcon] = useState(categoryIcons[0]);
  const [quickPoints, setQuickPoints] = useState(1);
  const [quickNote, setQuickNote] = useState('');
  const negativeEnabled = false;
  const [minorFlags, setMinorFlags] = useState<Record<string, number>>({});
  const [odrs, setOdrs] = useState<{ id: string; studentId: string; count: number; status: string }[]>([]);
  const [groups, setGroups] = useState<CustomGroup[]>([]);
  const [groupName, setGroupName] = useState('');
  const [notice, setNotice] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState(initialItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStudentId, setOrderStudentId] = useState(seedStudents[0].id);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'Pending fulfillment' | 'Fulfilled'>('Pending fulfillment');
  const [auction, setAuction] = useState<Auction | null>(null);
  const [lockedBids, setLockedBids] = useState<Record<string, number>>({});
  const [bidderId, setBidderId] = useState(seedStudents[0].id);
  const [customBid, setCustomBid] = useState('');
  const [projectorMode, setProjectorMode] = useState(false);

  const selectedStudents = students.filter((student) => selectedIds.includes(student.id));
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  const allSelected = selectedIds.length === students.length;
  const filteredOrders = orders.filter((order) => order.status === fulfillmentFilter);
  const pendingOrders = orders.filter((order) => order.status === 'Pending fulfillment').length;
  const highestBidder = students.find((student) => student.id === auction?.winnerId);

  useEffect(() => {
    if (!auction || auction.status !== 'live') return;
    const timer = setInterval(() => {
      setAuction((current) => {
        if (!current || current.status !== 'live') return current;
        if (current.secondsRemaining <= 1) return { ...current, secondsRemaining: 0, status: current.winnerId ? 'sold' : 'ended' };
        return { ...current, secondsRemaining: current.secondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auction?.id, auction?.status]);

  useEffect(() => {
    if (!auction || auction.status !== 'sold' || auction.checkoutApplied || !auction.winnerId) return;
    setStudents((current) => current.map((student) => student.id === auction.winnerId
      ? { ...student, tokens: student.tokens - auction.highestBid }
      : student));
    setLockedBids((current) => ({ ...current, [auction.winnerId as string]: 0 }));
    setTransactions((current) => [{ id: `auction-${auction.id}`, studentId: auction.winnerId as string, title: `Auction win · ${auction.itemTitle}`, points: -auction.highestBid, time: timestamp() }, ...current]);
    setAuction((current) => current?.id === auction.id ? { ...current, checkoutApplied: true } : current);
    setNotice(`${students.find((student) => student.id === auction.winnerId)?.name} won ${auction.itemTitle}. ${auction.highestBid} tokens were checked out automatically.`);
  }, [auction, students]);

  const toggleStudent = (studentId: string) => setSelectedIds((current) => current.includes(studentId)
    ? current.filter((id) => id !== studentId)
    : [...current, studentId]);

  const selectGroup = (studentIds: string[]) => setSelectedIds(studentIds);

  const awardPoints = (category: Category = selectedCategory, note = '') => {
    if (selectedIds.length === 0) { setNotice('Select one or more students first.'); return; }
    if (category.points < 0 && !negativeEnabled) { setNotice('Negative point deductions are disabled by the district setting.'); return; }
    const targets = students.filter((student) => selectedIds.includes(student.id));
    const blocked = targets.find((student) => category.points < 0 && student.tokens < Math.abs(category.points));
    if (blocked) { setNotice(`${blocked.name} does not have enough tokens for this deduction.`); return; }
    setStudents((current) => current.map((student) => selectedIds.includes(student.id)
      ? { ...student, tokens: Math.max(0, student.tokens + category.points) }
      : student));
    setTransactions((current) => {
      const entries: Transaction[] = targets.map((student) => ({ id: `${Date.now()}-${student.id}`, studentId: student.id, title: category.title, points: category.points, time: timestamp(), note: note || undefined, categoryId: category.id === 'quick-points' ? null : category.id }));
      return [...entries, ...current];
    });

    if (category.flag) {
      const triggered: { id: string; studentId: string; count: number; status: string }[] = [];
      const nextFlags = { ...minorFlags };
      targets.forEach((student) => {
        nextFlags[student.id] = (nextFlags[student.id] ?? 0) + 1;
        if (nextFlags[student.id] >= 3 && !odrs.some((odr) => odr.studentId === student.id)) {
          triggered.push({ id: `odr-${student.id}`, studentId: student.id, count: nextFlags[student.id], status: 'Draft · review required' });
        }
      });
      setMinorFlags(nextFlags);
      if (triggered.length) {
        setOdrs((current) => [...triggered, ...current]);
        setNotice(`3 minor flags reached. Draft Minor ODR created for ${triggered.map((item) => students.find((student) => student.id === item.studentId)?.name).join(', ')}. Teacher review required.`);
      } else {
        setNotice(`Needs Work flag recorded for ${targets.length} student${targets.length === 1 ? '' : 's'}.`);
      }
      return;
    }
    if (category.points > 0) playAwardSound();
    setNotice(`${category.points > 0 ? '+' : ''}${category.points} ${category.points === 1 || category.points === -1 ? 'token' : 'tokens'} · ${category.title}${note ? ` · ${note}` : ''} · ${targets.length} student${targets.length === 1 ? '' : 's'}`);
  };

  const awardQuickPoints = () => {
    const quickCategory: Category = { id: 'quick-points', title: 'Quick points', points: quickPoints, tone: 'green', icon: '✨' };
    awardPoints(quickCategory, quickNote.trim());
    setQuickNote('');
  };

  const addCategory = () => {
    const title = newCategoryTitle.trim();
    if (!title) { setNotice('Enter a category title first.'); return; }
    if (categories.some((category) => category.title.toLowerCase() === title.toLowerCase())) { setNotice('That category already exists.'); return; }
    const category: Category = { id: `custom-${Date.now()}`, title, points: newCategoryPoints, tone: 'green', icon: newCategoryIcon, custom: true };
    setCategories((current) => [...current, category]);
    setNewCategoryTitle('');
    setNotice(`${title} added to this classroom catalog.`);
  };

  const updateCategory = (categoryId: string, update: Partial<Category>) => {
    setCategories((current) => current.map((category) => category.id === categoryId ? { ...category, ...update } : category));
  };

  const playAwardSound = () => {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const context = new window.AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.16);
      oscillator.onended = () => { void context.close(); };
    } catch {
      // Audio feedback is optional when the platform blocks Web Audio.
    }
  };

  const saveGroup = () => {
    if (!groupName.trim() || selectedIds.length < 2) { setNotice('Select at least two students and name the custom group.'); return; }
    setGroups((current) => [{ id: `group-${Date.now()}`, name: groupName.trim(), studentIds: selectedIds }, ...current]);
    setNotice(`Custom group “${groupName.trim()}” saved locally.`);
    setGroupName('');
  };

  const addStoreItem = () => {
    const cost = Number(newItemCost);
    if (!newItemTitle.trim() || !Number.isInteger(cost) || cost < 1) { setNotice('Add a reward title and a positive whole-token cost.'); return; }
    setItems((current) => [{ id: `item-${Date.now()}`, title: newItemTitle.trim(), tokenCost: cost, remaining: -1 }, ...current]);
    setNewItemTitle(''); setNewItemCost(''); setNotice('Reward added to the local classroom catalog.');
  };

  const redeemItem = (studentId: string, item: StoreItem) => {
    const student = students.find((itemStudent) => itemStudent.id === studentId);
    const available = (student?.tokens ?? 0) - (lockedBids[studentId] ?? 0);
    if (!student || available < item.tokenCost) { setNotice('Not enough available tokens to redeem this reward.'); return; }
    if (item.remaining === 0) { setNotice('This reward is out of stock.'); return; }
    setStudents((current) => current.map((itemStudent) => itemStudent.id === studentId ? { ...itemStudent, tokens: itemStudent.tokens - item.tokenCost } : itemStudent));
    setItems((current) => current.map((currentItem) => currentItem.id === item.id && currentItem.remaining > 0 ? { ...currentItem, remaining: currentItem.remaining - 1 } : currentItem));
    setOrders((current) => [{ id: `order-${Date.now()}`, studentId, itemId: item.id, title: item.title, tokensSpent: item.tokenCost, status: 'Pending fulfillment' }, ...current]);
    setTransactions((current) => [{ id: `store-${Date.now()}`, studentId, title: `Store · ${item.title}`, points: -item.tokenCost, time: timestamp() }, ...current]);
    setNotice(`${item.title} redeemed for ${student.name}. Added to pending fulfillment.`);
  };

  const fulfillOrder = (orderId: string) => setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: 'Fulfilled' } : order));

  const startAuction = (item: StoreItem) => {
    setAuction({ id: `auction-${Date.now()}`, itemId: item.id, itemTitle: item.title, startingBid: Math.max(5, Math.ceil(item.tokenCost / 10)), highestBid: 0, winnerId: null, secondsRemaining: 30, status: 'live', checkoutApplied: false });
    setNotice(`Bidding is open for ${item.title}. Starting bid: ${Math.max(5, Math.ceil(item.tokenCost / 10))} tokens.`);
    setProjectorMode(false);
  };

  const placeBid = (amount: number) => {
    if (!auction || auction.status !== 'live') { setNotice('Start a live auction before placing bids.'); return; }
    const minimumBid = auction.highestBid > 0 ? auction.highestBid + 5 : auction.startingBid;
    const student = students.find((item) => item.id === bidderId);
    const available = (student?.tokens ?? 0) - (lockedBids[bidderId] ?? 0) + (auction.winnerId === bidderId ? auction.highestBid : 0);
    if (!student || !Number.isInteger(amount) || amount < minimumBid) { setNotice(`The next valid bid is at least ${minimumBid} tokens.`); return; }
    if (available < amount) { setNotice(`${student.name} has ${available} available tokens and cannot bid ${amount}.`); return; }
    setLockedBids((current) => ({ ...current, ...(auction.winnerId ? { [auction.winnerId]: 0 } : {}), [bidderId]: amount }));
    setAuction((current) => current ? { ...current, highestBid: amount, winnerId: bidderId } : current);
    setCustomBid('');
    setNotice(`${student.name} is now the highest bidder at ${amount} tokens.`);
  };

  const setAuctionLength = (seconds: number) => setAuction((current) => current?.status === 'live' ? { ...current, secondsRemaining: seconds } : current);

  const displayedStudent = students.find((student) => student.id === bidderId) ?? students[0];
  const bidderAvailable = displayedStudent.tokens - (lockedBids[bidderId] ?? 0) + (auction?.winnerId === bidderId ? auction.highestBid : 0);

  const tabs: Tab[] = ['Points', 'Categories', 'Class store', 'Live auction'];
  const positiveCategories = categories.filter((category) => category.points > 0);
  const teachableCategories = categories.filter((category) => category.points <= 0);
  const groupsToShow = [
    { id: 'reading-buddies', name: 'Reading buddies', studentIds: ['maya', 'ethan', 'ava'] },
    { id: 'table-one', name: 'Table one', studentIds: ['sofia', 'noah', 'lucas'] },
    ...groups,
  ];

  if (projectorMode && auction) return (
    <View style={styles.projectorScreen}>
      <View style={styles.projectorHeader}><View style={styles.projectorBrand}><Zap size={18} color={colors.lime} /><Text style={styles.projectorBrandText}>LIVE CLASS AUCTION</Text></View><Pressable onPress={() => setProjectorMode(false)} style={styles.projectorExit}><Text style={styles.projectorExitText}>Exit display</Text></Pressable></View>
      <View style={styles.projectorCenter}>
        <Text style={styles.projectorEyebrow}>{auction.status === 'live' ? 'NOW ON THE BLOCK' : auction.status === 'sold' ? 'SOLD!' : 'AUCTION ENDED'}</Text>
        <Text style={styles.projectorItem}>{auction.itemTitle}</Text>
        <View style={styles.projectorStats}><View style={styles.projectorStat}><Text style={styles.projectorStatLabel}>{auction.highestBid > 0 ? 'HIGH BID' : 'STARTING BID'}</Text><Text style={styles.projectorBid}>{auction.highestBid > 0 ? auction.highestBid : auction.startingBid}</Text><Text style={styles.projectorTokenLabel}>TOKENS</Text></View><View style={styles.projectorTimer}><Timer size={21} color={auction.secondsRemaining <= 10 && auction.status === 'live' ? colors.orange : colors.lime} /><Text style={styles.projectorClock}>{auction.status === 'live' ? `00:${String(auction.secondsRemaining).padStart(2, '0')}` : auction.status === 'sold' ? 'SOLD' : 'DONE'}</Text></View></View>
        <View style={styles.projectorBidder}><Trophy size={18} color={colors.lime} /><View><Text style={styles.projectorBidderLabel}>{highestBidder ? 'CURRENT HIGH BIDDER' : 'OPEN FOR BIDS'}</Text><Text style={styles.projectorBidderName}>{highestBidder?.name ?? 'Raise your hand to join'}</Text></View></View>
      </View>
      <Text style={styles.projectorFooter}>CLASSROOM DISPLAY · SAMPLE AUCTION · WINNER CHECKOUT IS LOCAL</Text>
    </View>
  );

  return (
    <View style={styles.workspace}>
      <View style={styles.workspaceHeader}><View style={styles.headerIcon}><Award size={17} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.workspaceTitle}>Classroom rewards</Text><Text style={styles.workspaceSubtitle}>Evergreen Elementary · Room 12 · PBIS wallet</Text></View><View style={styles.sampleBadge}><Text style={styles.sampleBadgeText}>SAMPLE LEDGER</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => { setTab(item); setNotice(''); }} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      {tab === 'Points' ? <View style={[styles.pointsLayout, narrow && styles.pointsLayoutNarrow]}>
        <View style={styles.pointsMain}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Award points</Text><Text style={styles.panelSubtitle}>{selectedIds.length} student{selectedIds.length === 1 ? '' : 's'} selected</Text></View><View style={styles.selectionActions}><Pressable onPress={() => setSelectedIds(allSelected ? [] : students.map((student) => student.id))} style={styles.smallOutline}><Text style={styles.smallOutlineText}>{allSelected ? 'Clear all' : 'Select all'}</Text></Pressable><Pressable onPress={() => setSelectedIds([])} style={styles.smallOutline}><Text style={styles.smallOutlineText}>Clear</Text></Pressable></View></View>
            <View style={styles.groupStrip}><Text style={styles.inlineLabel}>GROUPS</Text>{groupsToShow.map((group) => <Pressable key={group.id} onPress={() => selectGroup(group.studentIds)} style={styles.groupChip}><Users size={10} color={colors.forest} /><Text style={styles.groupChipText}>{group.name}</Text></Pressable>)}</View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rosterStrip}>{students.map((student) => { const selected = selectedIds.includes(student.id); const locked = lockedBids[student.id] ?? 0; return <Pressable key={student.id} onPress={() => toggleStudent(student.id)} style={[styles.studentCard, selected && styles.studentCardSelected]}><View style={styles.studentAvatar}><Text style={styles.studentInitials}>{student.initials}</Text></View><Text numberOfLines={1} style={styles.studentName}>{student.name.split(' ')[0]}</Text><Text style={styles.studentToken}>{student.tokens - locked}<Text style={styles.tokenSuffix}> ◈</Text></Text>{selected ? <View style={styles.selectedMark}><Check size={8} color="#fff" /></View> : null}</Pressable>; })}</ScrollView>
            {selectedIds.length >= 2 ? <View style={styles.saveGroupRow}><TextInput value={groupName} onChangeText={setGroupName} placeholder="Name this group" style={styles.groupNameInput} /><Pressable onPress={saveGroup} style={styles.saveGroupButton}><Plus size={11} color="#fff" /><Text style={styles.saveGroupText}>Save group</Text></Pressable></View> : null}
            <View style={styles.categoryHeader}><Text style={styles.panelTitle}>Positive behaviors</Text><Text style={styles.categoryHint}>Tap a category to award its default value</Text></View>
            <View style={styles.categoryGrid}>{positiveCategories.map((category) => { const selected = selectedCategory.id === category.id; return <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`Award ${category.points} points for ${category.title}`} onPress={() => { setSelectedCategoryId(category.id); awardPoints(category); }} style={[styles.categoryCard, toneStyle(category.tone), selected && styles.categoryCardSelected]}><Text style={styles.categoryTitle}><Text>{category.icon}  </Text>{category.title}</Text><Text style={styles.categoryPoints}>+{category.points} <Text style={styles.tokenSuffix}>◈</Text></Text></Pressable>; })}</View>
            <View style={styles.categoryHeader}><Text style={styles.panelTitle}>Teachable moments</Text><Text style={styles.negativeSettingLabel}>District policy: deductions disabled</Text></View>
            <View style={styles.categoryGrid}>{teachableCategories.map((category) => { const selected = selectedCategory.id === category.id; const disabled = category.points < 0 && !negativeEnabled; return <Pressable key={category.id} onPress={() => { if (disabled) { setNotice('Negative point deductions are disabled by the district setting.'); return; } setSelectedCategoryId(category.id); }} style={[styles.categoryCard, toneStyle(category.tone), selected && styles.categoryCardSelected, disabled && styles.categoryCardDisabled]}><Text style={styles.categoryTitle}><Text>{category.icon}  </Text>{category.title}</Text><Text style={[styles.categoryPoints, category.points < 0 && styles.negativePoints]}>{category.points > 0 ? '+' : ''}{category.points} <Text style={styles.tokenSuffix}>◈</Text></Text></Pressable>; })}</View>
            {selectedCategory.points <= 0 ? <Pressable onPress={() => awardPoints()} style={styles.awardButton}><Plus size={14} color="#fff" /><Text style={styles.awardButtonText}>{selectedCategory.flag ? 'Log Needs Work flag' : `Record ${selectedCategory.points < 0 ? `${selectedCategory.points} token${selectedCategory.points === -1 ? '' : 's'}` : selectedCategory.title}`}</Text><ArrowRight size={13} color="#fff" /></Pressable> : null}
            <View style={styles.quickAwardPanel}>
              <View style={styles.categoryHeader}><Text style={styles.panelTitle}>Quick points · no category</Text><Text style={styles.categoryHint}>Optional note</Text></View>
              <View style={styles.quickPointRow}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: quickPoints === value }} onPress={() => setQuickPoints(value)} style={[styles.quickPointButton, quickPoints === value && styles.quickPointButtonSelected]}><Text style={[styles.quickPointText, quickPoints === value && styles.quickPointTextSelected]}>+{value}</Text></Pressable>)}</View>
              <TextInput value={quickNote} onChangeText={setQuickNote} maxLength={280} placeholder="Brief note (optional)" style={styles.quickNoteInput} />
              <Pressable onPress={awardQuickPoints} style={styles.awardButton}><Zap size={13} color="#fff" /><Text style={styles.awardButtonText}>Award +{quickPoints} quick point{quickPoints === 1 ? '' : 's'} to {selectedIds.length} student{selectedIds.length === 1 ? '' : 's'}</Text><ArrowRight size={13} color="#fff" /></Pressable>
            </View>
          </View>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Recent point activity</Text><Text style={styles.panelSubtitle}>Latest classroom ledger entries</Text></View><Wallet size={15} color={colors.forest} /></View>
            {transactions.slice(0, 5).map((transaction) => <View key={transaction.id} style={styles.transactionRow}><View style={[styles.transactionIcon, transaction.points < 0 && styles.transactionIconDeduction]}>{transaction.points < 0 ? <Minus size={11} color={colors.orange} /> : transaction.points === 0 ? <ShieldAlert size={11} color={colors.yellow} /> : <Plus size={11} color={colors.forest} />}</View><View style={{ flex: 1 }}><Text style={styles.transactionTitle}>{students.find((student) => student.id === transaction.studentId)?.name} · {transaction.title}</Text><Text style={styles.transactionTime}>{transaction.time}{transaction.note ? ` · ${transaction.note}` : ''}</Text></View><Text style={[styles.transactionPoints, transaction.points < 0 && styles.negativePoints]}>{transaction.points > 0 ? '+' : ''}{transaction.points} ◈</Text></View>)}
            {transactions.length === 0 ? <Text style={styles.emptyText}>No new transactions in this demo session.</Text> : null}
          </View>
        </View>
        <View style={[styles.pointsRail, narrow && styles.pointsRailNarrow]}>
          <View style={styles.summaryPanel}><Text style={styles.summaryEyebrow}>TODAY · ROOM 12</Text><Text style={styles.summaryBig}>{students.reduce((total, student) => total + student.tokens, 0)}</Text><Text style={styles.summaryCaption}>tokens across {students.length} students</Text><View style={styles.summaryDivider} /><Text style={styles.summarySmall}>{odrs.length} Minor ODR draft{odrs.length === 1 ? '' : 's'}</Text></View>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Minor ODR drafts</Text><Text style={styles.panelSubtitle}>3 Needs Work flags in a day</Text></View><View style={styles.odrCounter}><Text style={styles.odrCounterText}>{odrs.length}</Text></View></View>
            {odrs.map((odr) => <View key={odr.id} style={styles.odrRow}><ShieldAlert size={13} color={colors.orange} /><View style={{ flex: 1 }}><Text style={styles.odrStudent}>{students.find((student) => student.id === odr.studentId)?.name}</Text><Text style={styles.odrStatus}>{odr.count} minor flags · {odr.status}</Text></View></View>)}
            {odrs.length === 0 ? <Text style={styles.emptyText}>No drafts. Three flags create a draft for teacher review.</Text> : null}
          </View>
          <Text style={styles.disclaimer}>Sample wallet ledger only. Points and ODR drafts are not saved or sent to Pillar 2.</Text>
        </View>
      </View> : null}

      {tab === 'Categories' ? <View style={styles.categoryManager}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Classroom behavior categories</Text><Text style={styles.panelSubtitle}>Edit this room’s copy of the district PBIS matrix</Text></View><Pressable onPress={() => { setCategories(districtCategories); setSelectedCategoryId(districtCategories[0].id); setNotice('District matrix defaults restored for this classroom.'); }} style={styles.smallOutline}><Text style={styles.smallOutlineText}>Use district defaults</Text></Pressable></View>
          {categories.filter((category) => !category.flag).map((category) => <View key={category.id} style={styles.categoryEditRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Change ${category.title} icon`} onPress={() => { const index = categoryIcons.indexOf(category.icon); updateCategory(category.id, { icon: categoryIcons[(index + 1) % categoryIcons.length] }); }} style={styles.categoryIconButton}><Text style={styles.categoryIconText}>{category.icon}</Text></Pressable>
            <TextInput value={category.title} onChangeText={(title) => updateCategory(category.id, { title })} style={styles.categoryNameInput} maxLength={50} />
            <View style={styles.pointValueOptions}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: category.points === value }} onPress={() => updateCategory(category.id, { points: value })} style={[styles.pointValueOption, category.points === value && styles.pointValueOptionSelected]}><Text style={[styles.pointValueText, category.points === value && styles.pointValueTextSelected]}>{value}</Text></Pressable>)}</View>
            {category.custom ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${category.title}`} onPress={() => { setCategories((current) => current.filter((item) => item.id !== category.id)); if (selectedCategoryId === category.id) setSelectedCategoryId(districtCategories[0].id); }} style={styles.removeCategoryButton}><Minus size={12} color={colors.orange} /></Pressable> : null}
          </View>)}
        </View>
        <View style={styles.panel}>
          <View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Add a custom category</Text><Text style={styles.panelSubtitle}>Use a short expectation students recognize</Text></View><Plus size={14} color={colors.forest} /></View>
          <TextInput value={newCategoryTitle} onChangeText={setNewCategoryTitle} maxLength={50} placeholder="e.g. Library Quiet" style={styles.formInput} />
          <View style={styles.categoryCreatorRow}><View style={styles.pointValueOptions}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: newCategoryPoints === value }} onPress={() => setNewCategoryPoints(value)} style={[styles.pointValueOption, newCategoryPoints === value && styles.pointValueOptionSelected]}><Text style={[styles.pointValueText, newCategoryPoints === value && styles.pointValueTextSelected]}>{value}</Text></Pressable>)}</View><Text style={styles.categoryHint}>default points</Text></View>
          <View style={styles.categoryIconPicker}>{categoryIcons.map((icon) => <Pressable key={icon} accessibilityRole="button" accessibilityState={{ selected: newCategoryIcon === icon }} onPress={() => setNewCategoryIcon(icon)} style={[styles.categoryIconButton, newCategoryIcon === icon && styles.categoryIconButtonSelected]}><Text style={styles.categoryIconText}>{icon}</Text></Pressable>)}</View>
          <Pressable onPress={addCategory} style={styles.awardButton}><Plus size={13} color="#fff" /><Text style={styles.awardButtonText}>Add classroom category</Text></Pressable>
        </View>
        <Text style={styles.disclaimer}>Category and point changes are local to this demo. District policy controls whether negative awards may be recorded.</Text>
      </View> : null}

      {tab === 'Class store' ? <View style={[styles.storeLayout, narrow && styles.storeLayoutNarrow]}>
        <View style={styles.storeMain}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Classroom store</Text><Text style={styles.panelSubtitle}>Select a student, then redeem a reward</Text></View><ShoppingBag size={16} color={colors.forest} /></View>
          <View style={styles.studentPicker}>{students.map((student) => <Pressable key={student.id} onPress={() => setOrderStudentId(student.id)} style={[styles.pickerStudent, orderStudentId === student.id && styles.pickerStudentSelected]}><Text style={styles.pickerStudentName}>{student.name.split(' ')[0]}</Text><Text style={styles.pickerStudentBalance}>{student.tokens - (lockedBids[student.id] ?? 0)} ◈</Text></Pressable>)}</View>
          <View style={styles.storeGrid}>{items.map((item) => { const student = students.find((entry) => entry.id === orderStudentId); const canRedeem = (student?.tokens ?? 0) - (lockedBids[orderStudentId] ?? 0) >= item.tokenCost && item.remaining !== 0; return <View key={item.id} style={styles.storeItem}><View style={styles.storeItemIcon}><Star size={17} color={colors.yellow} /></View><Text style={styles.storeItemName}>{item.title}</Text><Text style={styles.storeCost}>{item.tokenCost} ◈</Text><Text style={styles.storeStock}>{item.remaining < 0 ? 'Unlimited' : `${item.remaining} remaining`}</Text><Pressable disabled={!canRedeem} onPress={() => redeemItem(orderStudentId, item)} style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}><Text style={styles.redeemButtonText}>Redeem</Text></Pressable><Pressable onPress={() => startAuction(item)} style={styles.auctionItemLink}><Zap size={10} color={colors.forest} /><Text style={styles.auctionItemLinkText}>Put up for auction</Text></Pressable></View>; })}</View>
        </View>
        <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Add a reward</Text><Text style={styles.panelSubtitle}>Configure this classroom catalog</Text></View><Plus size={15} color={colors.forest} /></View><TextInput value={newItemTitle} onChangeText={setNewItemTitle} placeholder="Reward name" style={styles.formInput} /><TextInput value={newItemCost} onChangeText={setNewItemCost} keyboardType="numeric" placeholder="Token cost" style={styles.formInput} /><Pressable onPress={addStoreItem} style={styles.awardButton}><Plus size={13} color="#fff" /><Text style={styles.awardButtonText}>Add to store</Text></Pressable></View></View>
        <View style={[styles.ordersRail, narrow && styles.ordersRailNarrow]}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Fulfillment queue</Text><Text style={styles.panelSubtitle}>{pendingOrders} pending</Text></View><ShoppingBag size={15} color={colors.forest} /></View><View style={styles.filterTabs}>{(['Pending fulfillment', 'Fulfilled'] as const).map((filter) => <Pressable key={filter} onPress={() => setFulfillmentFilter(filter)} style={[styles.filterTab, fulfillmentFilter === filter && styles.filterTabActive]}><Text style={[styles.filterTabText, fulfillmentFilter === filter && styles.filterTabTextActive]}>{filter === 'Pending fulfillment' ? 'Pending' : 'Done'}</Text></Pressable>)}</View>
          {filteredOrders.map((order) => <View key={order.id} style={styles.orderRow}><View style={{ flex: 1 }}><Text style={styles.orderTitle}>{order.title}</Text><Text style={styles.orderStudent}>{students.find((student) => student.id === order.studentId)?.name} · {order.tokensSpent} tokens</Text></View>{order.status === 'Pending fulfillment' ? <Pressable onPress={() => fulfillOrder(order.id)} style={styles.fulfillButton}><Check size={10} color="#fff" /><Text style={styles.fulfillText}>Fulfill</Text></Pressable> : <BadgeCheck size={15} color={colors.forest} />}</View>)}
          {filteredOrders.length === 0 ? <Text style={styles.emptyText}>No {fulfillmentFilter.toLowerCase()} orders.</Text> : null}
        </View><Text style={styles.disclaimer}>Redemptions are local previews; no shared wallet ledger or fulfillment message is connected.</Text></View>
      </View> : null}

      {tab === 'Live auction' ? <View style={[styles.auctionLayout, narrow && styles.auctionLayoutNarrow]}>
        <View style={styles.auctionMain}><View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Live class auction</Text><Text style={styles.panelSubtitle}>Select a reward, open the projector view, and accept bids</Text></View><Zap size={16} color={colors.yellow} /></View>
          {!auction || auction.status !== 'live' ? <View style={styles.auctionStartGrid}>{items.map((item) => <Pressable key={item.id} onPress={() => startAuction(item)} style={styles.auctionStartItem}><Star size={17} color={colors.yellow} /><Text style={styles.auctionStartName}>{item.title}</Text><Text style={styles.auctionStartCost}>Start at {Math.max(5, Math.ceil(item.tokenCost / 10))} tokens</Text><Text style={styles.auctionStartAction}>{auction?.status === 'sold' || auction?.status === 'ended' ? 'Start another auction' : 'Start auction'} →</Text></Pressable>)}</View> : null}
          {auction ? <View style={styles.auctionLiveCard}><View style={styles.auctionLiveHeader}><View><Text style={styles.auctionLiveEyebrow}>{auction.status === 'live' ? 'ON THE BLOCK' : auction.status === 'sold' ? 'SOLD' : 'AUCTION ENDED'}</Text><Text style={styles.auctionItemTitle}>{auction.itemTitle}</Text></View><View style={[styles.timerBadge, auction.secondsRemaining <= 10 && auction.status === 'live' && styles.timerBadgeUrgent]}><Timer size={13} color={auction.secondsRemaining <= 10 ? colors.orange : colors.forest} /><Text style={styles.timerText}>{auction.status === 'live' ? `00:${String(auction.secondsRemaining).padStart(2, '0')}` : auction.status === 'sold' ? 'SOLD' : 'ENDED'}</Text></View></View>
            <View style={styles.highBidRow}><View><Text style={styles.highBidLabel}>{auction.highestBid ? 'HIGHEST BID' : 'STARTING BID'}</Text><Text style={styles.highBidValue}>{auction.highestBid || auction.startingBid} <Text style={styles.tokenSuffix}>◈</Text></Text></View><View><Text style={styles.highBidLabel}>LEADING BIDDER</Text><Text style={styles.highBidName}>{highestBidder?.name ?? 'Open to all students'}</Text></View></View>
            <Pressable onPress={() => setProjectorMode(true)} style={styles.projectorButton}><Monitor size={13} color={colors.forest} /><Text style={styles.projectorButtonText}>Open projector display</Text><ArrowRight size={12} color={colors.forest} /></Pressable>
            {auction.status === 'live' ? <View style={styles.bidPanel}><Text style={styles.bidPanelTitle}>Student bidding device</Text><View style={styles.studentPicker}>{students.map((student) => <Pressable key={student.id} onPress={() => setBidderId(student.id)} style={[styles.pickerStudent, bidderId === student.id && styles.pickerStudentSelected]}><Text style={styles.pickerStudentName}>{student.name.split(' ')[0]}</Text><Text style={styles.pickerStudentBalance}>{student.tokens - (lockedBids[student.id] ?? 0)} ◈</Text></Pressable>)}</View><Text style={styles.bidAvailable}>{displayedStudent.name} · {bidderAvailable} tokens available</Text><View style={styles.bidActions}><Pressable onPress={() => placeBid(auction.highestBid > 0 ? auction.highestBid + 5 : auction.startingBid)} style={styles.bidButton}><Plus size={13} color="#fff" /><Text style={styles.bidButtonText}>{auction.highestBid > 0 ? 'Raise bid +5' : `Opening bid ${auction.startingBid}`}</Text></Pressable><TextInput value={customBid} onChangeText={setCustomBid} keyboardType="numeric" placeholder="Custom bid" style={styles.customBidInput} /><Pressable onPress={() => placeBid(Number(customBid))} style={styles.customBidButton}><Text style={styles.customBidButtonText}>Bid</Text></Pressable></View></View> : null}
          </View> : null}
        </View></View>
        <View style={[styles.auctionRail, narrow && styles.auctionRailNarrow]}><View style={styles.panel}><Text style={styles.panelTitle}>Auction rules</Text><View style={styles.ruleRow}><CheckCircle2 size={13} color={colors.forest} /><Text style={styles.ruleText}>Bids increase by at least 5 tokens</Text></View><View style={styles.ruleRow}><Wallet size={13} color={colors.forest} /><Text style={styles.ruleText}>Available balance is checked before every bid</Text></View><View style={styles.ruleRow}><Clock3 size={13} color={colors.forest} /><Text style={styles.ruleText}>30-second countdown · winner checked out at close</Text></View><Text style={styles.disclaimer}>Auction bids reserve tokens locally; checkout does not persist beyond this demo session.</Text></View></View>
      </View> : null}
      <Text style={styles.footerText}>PBIS DEMO · SAMPLE STUDENTS · LOCAL POINTS, ORDERS, AND BIDS</Text>
    </View>
  );
}

function toneStyle(tone: Category['tone']) {
  if (tone === 'green') return styles.categoryGreen;
  if (tone === 'blue') return styles.categoryBlue;
  if (tone === 'yellow') return styles.categoryYellow;
  return styles.categoryRed;
}

const styles = StyleSheet.create({
  workspace: { gap: 10 },
  label: { color: '#79847b', fontSize: 6, fontWeight: '700', letterSpacing: 0.5, marginTop: 7, marginBottom: 4 },
  workspaceHeader: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 9 },
  headerIcon: { width: 29, height: 29, borderRadius: 5, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  workspaceTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' }, workspaceSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  sampleBadge: { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#f0f2ee' }, sampleBadgeText: { color: '#808a82', fontSize: 6, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 4 }, tab: { minHeight: 29, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#e9ede7', borderRadius: 4 }, tabActive: { backgroundColor: colors.forest }, tabText: { color: '#667269', fontSize: 8, fontWeight: '600' }, tabTextActive: { color: '#fff' },
  notice: { backgroundColor: colors.limeSoft, borderRadius: 4, padding: 8 }, noticeText: { color: colors.forest, fontSize: 8, lineHeight: 12 },
  pointsLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, pointsLayoutNarrow: { flexDirection: 'column' }, pointsMain: { flex: 1, minWidth: 0 }, pointsRail: { width: 225, gap: 9 }, pointsRailNarrow: { width: '100%' },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 11, marginBottom: 9 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }, panelTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' }, panelSubtitle: { color: colors.muted, fontSize: 7, marginTop: 3 },
  selectionActions: { flexDirection: 'row', gap: 4 }, smallOutline: { minHeight: 23, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6 }, smallOutlineText: { color: '#667269', fontSize: 6 },
  groupStrip: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 7 }, inlineLabel: { color: '#89938b', fontSize: 6, fontWeight: '700', marginRight: 2 }, groupChip: { minHeight: 21, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 3, backgroundColor: '#edf3e9', paddingHorizontal: 5 }, groupChipText: { color: colors.forest, fontSize: 6 },
  rosterStrip: { flexDirection: 'row', gap: 5, paddingBottom: 3 }, studentCard: { width: 62, minHeight: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', padding: 5, position: 'relative' }, studentCardSelected: { borderColor: colors.forest, backgroundColor: '#f1f6ec' }, studentAvatar: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft }, studentInitials: { color: colors.forest, fontSize: 7, fontWeight: '700' }, studentName: { color: colors.ink, fontSize: 6, fontWeight: '600', marginTop: 4 }, studentToken: { color: colors.forest, fontSize: 7, fontWeight: '700', marginTop: 2 }, tokenSuffix: { color: '#8da469', fontSize: 6 }, selectedMark: { position: 'absolute', top: 3, right: 3, width: 12, height: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest },
  saveGroupRow: { flexDirection: 'row', gap: 5, marginTop: 7 }, groupNameInput: { flex: 1, minHeight: 25, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 6, fontSize: 7 }, saveGroupButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 3, paddingHorizontal: 6, backgroundColor: colors.forest }, saveGroupText: { color: '#fff', fontSize: 6, fontWeight: '600' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginTop: 12, marginBottom: 6 }, categoryHint: { color: colors.muted, fontSize: 6 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  categoryCard: { flexGrow: 1, flexBasis: '30%', minWidth: 92, minHeight: 49, justifyContent: 'space-between', borderRadius: 4, borderWidth: 1, borderColor: 'transparent', padding: 7 }, categoryCardSelected: { borderColor: colors.forest, borderWidth: 2 }, categoryCardDisabled: { opacity: 0.43 }, categoryGreen: { backgroundColor: colors.limeSoft }, categoryBlue: { backgroundColor: colors.blueSoft }, categoryYellow: { backgroundColor: colors.yellowSoft }, categoryRed: { backgroundColor: colors.orangeSoft }, categoryTitle: { color: colors.ink, fontSize: 7, fontWeight: '600' }, categoryPoints: { color: colors.forest, fontSize: 9, fontWeight: '700', marginTop: 4 }, negativePoints: { color: colors.orange },
  quickAwardPanel: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 12, paddingTop: 2 }, quickPointRow: { flexDirection: 'row', gap: 5 }, quickPointButton: { width: 35, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' }, quickPointButtonSelected: { borderColor: colors.forest, backgroundColor: colors.limeSoft }, quickPointText: { color: colors.muted, fontSize: 8, fontWeight: '600' }, quickPointTextSelected: { color: colors.forest, fontWeight: '700' }, quickNoteInput: { minHeight: 30, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7, fontSize: 7, marginTop: 6 },
  categoryManager: { gap: 2 }, categoryEditRow: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, categoryIconButton: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#f0f2ee' }, categoryIconButtonSelected: { backgroundColor: colors.limeSoft, borderWidth: 1, borderColor: colors.forest }, categoryIconText: { fontSize: 12 }, categoryNameInput: { flex: 1, minWidth: 70, height: 28, color: colors.ink, fontSize: 7, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 3 }, pointValueOptions: { flexDirection: 'row', gap: 2 }, pointValueOption: { width: 20, height: 23, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: '#f0f2ee' }, pointValueOptionSelected: { backgroundColor: colors.forest }, pointValueText: { color: colors.muted, fontSize: 7, fontWeight: '600' }, pointValueTextSelected: { color: '#fff' }, removeCategoryButton: { width: 22, height: 25, alignItems: 'center', justifyContent: 'center' }, categoryCreatorRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }, categoryIconPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  negativeSetting: { flexDirection: 'row', alignItems: 'center', gap: 5 }, negativeSettingLabel: { color: colors.muted, fontSize: 6 }, toggleTrack: { width: 27, height: 15, borderRadius: 8, padding: 2, justifyContent: 'center', backgroundColor: '#d8dfd7' }, toggleTrackActive: { backgroundColor: colors.forest }, toggleThumb: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#fff' }, toggleThumbActive: { alignSelf: 'flex-end' },
  awardButton: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, borderRadius: 4, paddingHorizontal: 9, backgroundColor: colors.forest }, awardButtonText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  transactionRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, transactionIcon: { width: 21, height: 21, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.limeSoft }, transactionIconDeduction: { backgroundColor: colors.orangeSoft }, transactionTitle: { color: colors.ink, fontSize: 7, fontWeight: '600' }, transactionTime: { color: colors.muted, fontSize: 6, marginTop: 2 }, transactionPoints: { color: colors.forest, fontSize: 8, fontWeight: '700' }, emptyText: { color: colors.muted, fontSize: 7, lineHeight: 11, paddingVertical: 5 },
  summaryPanel: { borderRadius: 5, backgroundColor: colors.forestDeep, padding: 13 }, summaryEyebrow: { color: '#c0d0c5', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 }, summaryBig: { color: '#fff', fontSize: 25, fontWeight: '700', marginTop: 5 }, summaryCaption: { color: '#c0d0c5', fontSize: 7, marginTop: 2 }, summaryDivider: { height: 1, backgroundColor: '#42604d', marginVertical: 8 }, summarySmall: { color: colors.lime, fontSize: 7, fontWeight: '600' },
  odrCounter: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.orangeSoft }, odrCounterText: { color: colors.orange, fontSize: 7, fontWeight: '700' }, odrRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#edf0eb' }, odrStudent: { color: colors.ink, fontSize: 7, fontWeight: '600' }, odrStatus: { color: colors.orange, fontSize: 6, marginTop: 3 }, disclaimer: { color: '#89938b', fontSize: 6, lineHeight: 10, marginTop: 7 },
  storeLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, storeLayoutNarrow: { flexDirection: 'column' }, storeMain: { flex: 1, minWidth: 0 }, ordersRail: { width: 235 }, ordersRailNarrow: { width: '100%' },
  studentPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 9 }, pickerStudent: { minHeight: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: '#f0f2ee', paddingHorizontal: 7 }, pickerStudentSelected: { backgroundColor: '#e4efdd' }, pickerStudentName: { color: '#536057', fontSize: 6, fontWeight: '600' }, pickerStudentBalance: { color: colors.forest, fontSize: 6, marginTop: 2 },
  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, storeItem: { flexGrow: 1, flexBasis: '30%', minWidth: 110, minHeight: 132, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 9 }, storeItemIcon: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.yellowSoft }, storeItemName: { color: colors.ink, fontSize: 7, fontWeight: '600', marginTop: 7 }, storeCost: { color: colors.forest, fontSize: 8, fontWeight: '700', marginTop: 5 }, storeStock: { color: colors.muted, fontSize: 6, marginTop: 2 }, redeemButton: { minHeight: 24, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: colors.forest, marginTop: 7 }, redeemButtonDisabled: { opacity: 0.4 }, redeemButtonText: { color: '#fff', fontSize: 6, fontWeight: '600' }, auctionItemLink: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 }, auctionItemLinkText: { color: colors.forest, fontSize: 6 },
  formInput: { minHeight: 31, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 7, fontSize: 7, marginTop: 5 }, filterTabs: { flexDirection: 'row', gap: 4, marginBottom: 7 }, filterTab: { minHeight: 22, justifyContent: 'center', borderRadius: 3, paddingHorizontal: 7, backgroundColor: '#f0f2ee' }, filterTabActive: { backgroundColor: colors.limeSoft }, filterTabText: { color: colors.muted, fontSize: 6 }, filterTabTextActive: { color: colors.forest, fontWeight: '700' }, orderRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#edf0eb' }, orderTitle: { color: colors.ink, fontSize: 7, fontWeight: '600' }, orderStudent: { color: colors.muted, fontSize: 6, marginTop: 3 }, fulfillButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 5, borderRadius: 3, backgroundColor: colors.forest }, fulfillText: { color: '#fff', fontSize: 6 },
  auctionLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, auctionLayoutNarrow: { flexDirection: 'column' }, auctionMain: { flex: 1, minWidth: 0 }, auctionRail: { width: 220 }, auctionRailNarrow: { width: '100%' }, auctionStartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }, auctionStartItem: { flexGrow: 1, flexBasis: '30%', minWidth: 112, minHeight: 100, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 8 }, auctionStartName: { color: colors.ink, fontSize: 7, fontWeight: '600', marginTop: 6 }, auctionStartCost: { color: colors.muted, fontSize: 6, marginTop: 3 }, auctionStartAction: { color: colors.forest, fontSize: 6, fontWeight: '600', marginTop: 7 },
  auctionLiveCard: { borderWidth: 1, borderColor: '#dfe8d8', borderRadius: 4, backgroundColor: '#fbfcfa', padding: 10 }, auctionLiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, auctionLiveEyebrow: { color: colors.forest, fontSize: 6, fontWeight: '700', letterSpacing: 0.5 }, auctionItemTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 4 }, timerBadge: { minWidth: 55, minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 4, backgroundColor: colors.limeSoft, paddingHorizontal: 6 }, timerBadgeUrgent: { backgroundColor: colors.orangeSoft }, timerText: { color: colors.forest, fontSize: 8, fontWeight: '700' }, highBidRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf0eb', borderBottomWidth: 1, borderBottomColor: '#edf0eb', paddingVertical: 8, marginTop: 9 }, highBidLabel: { color: colors.muted, fontSize: 6, fontWeight: '700' }, highBidValue: { color: colors.forest, fontSize: 16, fontWeight: '700', marginTop: 2 }, highBidName: { color: colors.ink, fontSize: 8, fontWeight: '600', marginTop: 4 }, projectorButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }, projectorButtonText: { color: colors.forest, flex: 1, fontSize: 7, fontWeight: '600' }, bidPanel: { borderTopWidth: 1, borderTopColor: '#edf0eb', marginTop: 4, paddingTop: 8 }, bidPanelTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' }, bidAvailable: { color: colors.muted, fontSize: 6, marginBottom: 5 }, bidActions: { flexDirection: 'row', alignItems: 'center', gap: 4 }, bidButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 3, backgroundColor: colors.forest, paddingHorizontal: 6 }, bidButtonText: { color: '#fff', fontSize: 6, fontWeight: '600' }, customBidInput: { width: 64, height: 28, borderWidth: 1, borderColor: colors.line, borderRadius: 3, paddingHorizontal: 5, fontSize: 7 }, customBidButton: { minHeight: 28, justifyContent: 'center', borderRadius: 3, backgroundColor: colors.limeSoft, paddingHorizontal: 7 }, customBidButtonText: { color: colors.forest, fontSize: 7, fontWeight: '700' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 9 }, ruleText: { color: '#637067', flex: 1, fontSize: 7, lineHeight: 11 },
  projectorScreen: { minHeight: 540, alignItems: 'stretch', justifyContent: 'space-between', borderRadius: 7, backgroundColor: colors.forestDeep, padding: 22 }, projectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, projectorBrand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, projectorBrandText: { color: colors.lime, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 }, projectorExit: { paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: '#557062', borderRadius: 4 }, projectorExitText: { color: '#d0ddd3', fontSize: 7 }, projectorCenter: { alignItems: 'center', justifyContent: 'center' }, projectorEyebrow: { color: '#c4d3c8', fontSize: 8, fontWeight: '700', letterSpacing: 1 }, projectorItem: { color: '#fff', fontSize: 27, lineHeight: 35, fontWeight: '700', textAlign: 'center', marginTop: 10 }, projectorStats: { flexDirection: 'row', alignItems: 'center', gap: 35, marginTop: 25 }, projectorStat: { alignItems: 'center' }, projectorStatLabel: { color: '#c4d3c8', fontSize: 7, fontWeight: '700', letterSpacing: 0.6 }, projectorBid: { color: colors.lime, fontSize: 42, lineHeight: 48, fontWeight: '700', marginTop: 4 }, projectorTokenLabel: { color: '#c4d3c8', fontSize: 7, fontWeight: '700' }, projectorTimer: { alignItems: 'center', gap: 5 }, projectorClock: { color: '#fff', fontSize: 23, fontWeight: '700' }, projectorBidder: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 22, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 5, backgroundColor: '#2b4939' }, projectorBidderLabel: { color: '#c4d3c8', fontSize: 6, fontWeight: '700', letterSpacing: 0.5 }, projectorBidderName: { color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 3 }, projectorFooter: { color: '#a7b8ac', fontSize: 6, textAlign: 'center', letterSpacing: 0.4 },
  footerText: { color: '#99a198', fontSize: 6, fontWeight: '700', textAlign: 'center', marginTop: 2, letterSpacing: 0.4 },
});