import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronDown,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Megaphone,
  Phone,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Users,
  GraduationCap,
  Home,
} from 'lucide-react-native';
import { supabase } from './lib/supabase';

const colors = {
  ink: '#182820', muted: '#758078', line: '#e6e9e3', forest: '#284b3c',
  orange: '#d8774d', orangeSoft: '#fff0e9', limeSoft: '#eef6e3',
};

type FeedScope = 'Classroom' | 'School' | 'District';
type CommunicationMode = 'Feed' | 'Messages' | 'Emergency broadcast';
type CommunityPost = { id: number; scope: FeedScope; author: string; location: string; time: string; category: string; title: string; message: string; media?: string };

const communityPosts: CommunityPost[] = [
  { id: 1, scope: 'Classroom', author: 'Avery Brooks', location: 'Evergreen Elementary · Room 12', time: '12 min ago', category: 'Classroom highlight', title: 'Our bridge builders put their designs to the test', message: 'Students planned, built, and revised paper bridges together. Ask your learner which design held the most weight.', media: 'PHOTO HIGHLIGHT · STEM LAB' },
  { id: 2, scope: 'Classroom', author: 'Avery Brooks', location: 'Evergreen Elementary · Room 12', time: '1 hr ago', category: 'Class reminder', title: 'Library books are due tomorrow', message: 'Please return library books in your backpack so we can exchange them during our morning visit.' },
  { id: 3, scope: 'School', author: 'Principal Elena Ruiz', location: 'Evergreen Elementary', time: '35 min ago', category: 'Schoolwide event', title: 'Family reading night · Thursday at 5:30 PM', message: 'Join us in the library for read-alouds, book swaps, and a student art walk. Families are welcome.', media: 'EVENT · ALL FAMILIES' },
  { id: 4, scope: 'School', author: 'Cedar Valley Office', location: 'Evergreen Elementary', time: 'Yesterday', category: 'Weekly newsletter', title: 'The Evergreen week ahead', message: 'This week: family reading night, grade 3 field study, and Friday spirit wear. See the school calendar for details.' },
  { id: 5, scope: 'District', author: 'District Communications', location: 'Cedar Valley USD', time: '18 min ago', category: 'District announcement', title: 'October board meeting: agenda and livestream', message: 'The regular board meeting begins at 6:00 PM on Tuesday. Review the public agenda and watch through the district website.', media: 'DISTRICT UPDATE · PUBLIC' },
  { id: 6, scope: 'District', author: 'Superintendent’s Office', location: 'Cedar Valley USD', time: 'Monday', category: 'Calendar update', title: 'Reminder: early release next Friday', message: 'All schools will dismiss two hours early next Friday for staff professional learning. Bus routes will follow the adjusted schedule.' },
];

function FeedLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.feedLabel}>{children}</Text>;
}

export function CommunityFeed({ narrow }: { narrow: boolean }) {
  const [scope, setScope] = useState<FeedScope>('Classroom');
  const [posts, setPosts] = useState(communityPosts);
  const [composerOpen, setComposerOpen] = useState(false);
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const destinations: Record<FeedScope, string[]> = {
    Classroom: ['Class feed', 'Family feed'],
    School: ['School website', 'Family app', 'Weekly newsletter'],
    District: ['District website', 'School micro-sites', 'Mobile push', 'SMS alert', 'Social media'],
  };
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(destinations.Classroom);
  const scopeDetails: Record<FeedScope, { title: string; owner: string; description: string }> = {
    Classroom: { title: 'Classroom feed', owner: 'Teacher & student managed', description: 'Moments, student work, and the small reminders that make tomorrow easier.' },
    School: { title: 'School building feed', owner: 'Principal & office managed', description: 'Events, community spotlights, and a ready-to-share weekly school update.' },
    District: { title: 'District-wide feed', owner: 'Superintendent & communications team', description: 'One district announcement, prepared once for every approved channel.' },
  };
  const scopePosts = posts.filter((post) => post.scope === scope);
  const changeScope = (nextScope: FeedScope) => {
    setScope(nextScope);
    setSelectedDestinations(destinations[nextScope]);
    setComposerOpen(false);
    setNotice('');
  };
  const toggleDestination = (destination: string) => setSelectedDestinations((current) => current.includes(destination)
    ? current.filter((item) => item !== destination)
    : [...current, destination]);
  const publishDemoPost = () => {
    if (!headline.trim() || !message.trim()) { setNotice('Add a headline and message before publishing.'); return; }
    setPosts((current) => [{ id: Date.now(), scope, author: 'Jordan Davis', location: scope === 'Classroom' ? 'Evergreen Elementary · Room 12' : scope === 'School' ? 'Evergreen Elementary' : 'Cedar Valley USD', time: 'Just now', category: scope === 'Classroom' ? 'Class update' : scope === 'School' ? 'School announcement' : 'District announcement', title: headline.trim(), message: message.trim() }, ...current]);
    setHeadline(''); setMessage(''); setComposerOpen(false);
    setNotice('Demo post added locally. No external channels were contacted.');
  };

  return (
    <View style={[styles.communityLayout, narrow && styles.communityLayoutNarrow]}>
      <View style={styles.communityMain}>
        <View style={styles.communityScopeTabs}>{(['Classroom', 'School', 'District'] as FeedScope[]).map((item) => {
          const selected = scope === item;
          const Icon = item === 'Classroom' ? GraduationCap : item === 'School' ? Home : Megaphone;
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => changeScope(item)} style={[styles.communityScopeTab, selected && styles.communityScopeTabSelected]}><Icon size={15} color={selected ? colors.forest : colors.muted} /><Text style={[styles.communityScopeText, selected && styles.communityScopeTextSelected]}>{item}</Text></Pressable>;
        })}</View>
        <View style={styles.communityHeadingRow}><View style={styles.communityHeadingCopy}><FeedLabel>{scopeDetails[scope].owner.toUpperCase()}</FeedLabel><Text style={styles.communityHeading}>{scopeDetails[scope].title}</Text><Text style={styles.communityDescription}>{scopeDetails[scope].description}</Text></View><Pressable onPress={() => { setComposerOpen(!composerOpen); setNotice(''); }} style={styles.createPostButton}><Plus size={15} color="#fff" /><Text style={styles.createPostText}>Create post</Text></Pressable></View>
        {scope === 'District' ? <View style={styles.publishBanner}><View style={styles.publishBannerIcon}><Megaphone size={17} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.publishBannerTitle}>Create once, publish everywhere</Text><Text style={styles.publishBannerText}>Prepare a district update for the website, school micro-sites, mobile push, SMS, and social channels.</Text></View><Text style={styles.previewTag}>PREVIEW</Text></View> : null}
        {notice ? <View style={styles.feedNotice}><Text style={styles.feedNoticeText}>{notice}</Text></View> : null}
        {composerOpen ? <View style={styles.feedComposer}>
          <Text style={styles.composerTitle}>New {scope.toLowerCase()} post</Text>
          <TextInput value={headline} onChangeText={setHeadline} placeholder="Write a clear headline" placeholderTextColor="#9ca59d" style={styles.feedHeadlineInput} />
          <TextInput value={message} onChangeText={setMessage} placeholder="What should families know?" placeholderTextColor="#9ca59d" multiline textAlignVertical="top" style={styles.feedMessageInput} />
          <Text style={styles.destinationLabel}>PUBLISH TO</Text>
          <View style={styles.destinationList}>{destinations[scope].map((destination) => { const selected = selectedDestinations.includes(destination); return <Pressable key={destination} onPress={() => toggleDestination(destination)} style={styles.destinationItem}><View style={[styles.destinationCheck, selected && styles.destinationCheckSelected]}>{selected ? <Check size={11} color="#fff" /> : null}</View><Text style={styles.destinationText}>{destination}</Text></Pressable>; })}</View>
          <View style={styles.composerFooter}><Text style={styles.localOnlyNote}>Demo only · Destinations are not connected</Text><Pressable onPress={publishDemoPost} style={styles.publishButton}><Text style={styles.publishButtonText}>Publish demo post</Text><ArrowRight size={14} color="#fff" /></Pressable></View>
        </View> : null}
        <View style={styles.feedListHeader}><View><Text style={styles.feedListTitle}>Latest updates</Text><Text style={styles.feedListSubtitle}>{scopePosts.length} posts · Visible to the selected audience</Text></View><Text style={styles.sampleBadge}>SAMPLE FEED</Text></View>
        {scopePosts.map((post) => <View key={post.id} style={styles.postCard}>
          <View style={styles.postAuthorRow}><View style={[styles.postAvatar, { backgroundColor: scope === 'Classroom' ? '#e6eedf' : scope === 'School' ? '#f4ead9' : '#e3ebf1' }]}><Text style={styles.postAvatarText}>{post.author.split(' ').map((part) => part[0]).slice(0, 2).join('')}</Text></View><View style={{ flex: 1 }}><Text style={styles.postAuthor}>{post.author}</Text><Text style={styles.postMeta}>{post.location} · {post.time}</Text></View><View style={styles.postCategory}><Text style={styles.postCategoryText}>{post.category}</Text></View></View>
          <Text style={styles.postTitle}>{post.title}</Text><Text style={styles.postMessage}>{post.message}</Text>
          {post.media ? <View style={styles.postMedia}><View style={styles.postMediaIcon}><Camera size={17} color={colors.forest} /></View><View style={{ flex: 1 }}><Text style={styles.postMediaTitle}>{post.media}</Text><Text style={styles.postMediaHint}>Media preview · Sample content</Text></View><ArrowRight size={14} color={colors.forest} /></View> : null}
          <View style={styles.postFooter}><Text style={styles.postFooterText}>{scope === 'Classroom' ? 'Class and family audience' : scope === 'School' ? 'School community audience' : 'District community audience'}</Text><Text style={styles.postFooterText}>Comments enabled</Text></View>
        </View>)}
      </View>
      <View style={[styles.communityRail, narrow && styles.communityRailNarrow]}>
        <View style={styles.railPanel}><Text style={styles.railTitle}>Feed ownership</Text><Text style={styles.railBody}>{scopeDetails[scope].owner}</Text><View style={styles.railDivider} /><Text style={styles.railTitle}>This feed includes</Text>
          {(scope === 'Classroom' ? ['Photo & video highlights', 'Student artifact showcases', 'Micro-announcements'] : scope === 'School' ? ['Schoolwide events', 'Principal spotlights', 'Digital newsletter broadcasts'] : ['District announcements', 'Website & school sites', 'Push, SMS & social channels']).map((feature) => <View key={feature} style={styles.railFeature}><View style={styles.railFeatureDot} /><Text style={styles.railFeatureText}>{feature}</Text></View>)}
        </View>
        <View style={styles.railNotice}><Text style={styles.railNoticeTitle}>Publishing status</Text><Text style={styles.railNoticeBody}>Posts in this preview are stored only in local screen state. No family accounts, web CMS, push, SMS, or social integrations are connected.</Text></View>
      </View>
    </View>
  );
}

export function CommunicationCenter({ narrow }: { narrow: boolean }) {
  const [mode, setMode] = useState<CommunicationMode>('Feed');
  const modes: { label: CommunicationMode; icon: typeof MessageCircle }[] = [
    { label: 'Feed', icon: LayoutDashboard }, { label: 'Messages', icon: MessageCircle }, { label: 'Emergency broadcast', icon: Megaphone },
  ];
  return <View>
    <View style={styles.communicationModeBar}>{modes.map(({ label, icon: Icon }) => {
      const selected = mode === label;
      return <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setMode(label)} style={[styles.communicationMode, selected && styles.communicationModeSelected]}><Icon size={15} color={selected ? colors.forest : colors.muted} /><Text style={[styles.communicationModeText, selected && styles.communicationModeTextSelected]}>{label === 'Feed' ? 'Community feed' : label}</Text></Pressable>;
    })}</View>
    {mode === 'Feed' ? <CommunityFeed narrow={narrow} /> : mode === 'Messages' ? <DirectMessaging narrow={narrow} /> : <EmergencyBroadcast narrow={narrow} />}
  </View>;
}

type ChatMessage = { id: number; author: string; body: string; time: string; mine?: boolean };
type MessageThread = {
  id: number;
  title: string;
  student: string;
  studentId: string;
  guardianContactId: string;
  schoolId: string;
  kind: string;
  participants: string[];
  phone: string;
  messages: ChatMessage[];
};

const initialThreads: MessageThread[] = [
  {
    id: 1, title: 'Thompson family', student: 'Maya Thompson · Grade 4', kind: 'Parent–teacher',
    studentId: 'a1111111-1111-4111-8111-111111111111', guardianContactId: 'b1111111-1111-4111-8111-111111111111', schoolId: 'c1111111-1111-4111-8111-111111111111',
    participants: ['Avery Brooks', 'Pat Thompson'], phone: '(555) 014-8821',
    messages: [
      { id: 1, author: 'Avery Brooks', body: 'Maya had a wonderful breakthrough with her bridge design today. I added a photo to the classroom feed.', time: '9:42 AM' },
      { id: 2, author: 'Pat Thompson', body: 'She has been talking about that project all week. Thank you for sharing!', time: '9:51 AM' },
    ],
  },
  {
    id: 2, title: 'Maya · support team', student: 'Maya Thompson · Grade 4', kind: 'Student support · 4 staff',
    studentId: 'a1111111-1111-4111-8111-111111111111', guardianContactId: 'b1111111-1111-4111-8111-111111111111', schoolId: 'c1111111-1111-4111-8111-111111111111',
    participants: ['Avery Brooks', 'Renee Cole, SPED', 'Sam Patel, Counselor'], phone: '(555) 014-8821',
    messages: [
      { id: 1, author: 'Renee Cole, SPED', body: 'The visual schedule is ready for next week. I shared the updated accommodation checklist with the team.', time: '8:25 AM' },
      { id: 2, author: 'Sam Patel, Counselor', body: 'Thanks. I can check in after lunch and add the observation notes here.', time: '8:37 AM' },
    ],
  },
  {
    id: 3, title: 'Bus pass question', student: 'Front office · General inquiry', kind: 'Office inquiry',
    studentId: 'a1111111-1111-4111-8111-111111111111', guardianContactId: 'b1111111-1111-4111-8111-111111111111', schoolId: 'c1111111-1111-4111-8111-111111111111',
    participants: ['Cedar Valley Office', 'Pat Thompson'], phone: '(555) 014-8821',
    messages: [
      { id: 1, author: 'Pat Thompson', body: 'Could you confirm whether Maya’s updated bus pass is ready for pickup?', time: '10:04 AM' },
      { id: 2, author: 'Cedar Valley Office', body: 'We have your request. The office team will confirm the pass status shortly.', time: '10:12 AM', mine: true },
    ],
  },
];

export function DirectMessaging({ narrow }: { narrow: boolean }) {
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState(1);
  const [draft, setDraft] = useState('');
  const [gatewayNotice, setGatewayNotice] = useState('');
  const [callPending, setCallPending] = useState(false);
  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? threads[0];

  const sendMessage = () => {
    if (!draft.trim()) return;
    setThreads((current: MessageThread[]) => current.map((thread) => thread.id === activeThreadId
      ? { ...thread, messages: [...thread.messages, { id: Date.now(), author: 'Jordan Davis', body: draft.trim(), time: 'Now', mine: true }] }
      : thread));
    setDraft('');
    setGatewayNotice('Message added to the local thread preview. No SMS was sent.');
  };

  const previewSms = () => setGatewayNotice(`Masked SMS preview to ${activeThread.phone}. Replies would return through the school proxy number; no message was sent.`);

  const startMaskedCall = async () => {
    setGatewayNotice('');
    if (!supabase) {
      setGatewayNotice('Voice gateway is not configured. Add the Supabase public URL and anon key, then sign in.');
      return;
    }
    setCallPending(true);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setGatewayNotice('Sign in with an authorized staff account before calling a guardian.');
      setCallPending(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke('masked-voice', {
      body: {
        action: 'initiate',
        studentId: activeThread.studentId,
        guardianContactId: activeThread.guardianContactId,
        schoolId: activeThread.schoolId,
      },
    });
    setCallPending(false);
    if (error) {
      setGatewayNotice('The call could not be started. Confirm staff authorization and school voice setup.');
      return;
    }
    setGatewayNotice(`${data.message} School caller ID: ${data.schoolCallerId ?? 'verified office number'}. No audio is recorded.`);
  };

  return (
    <View style={[styles.messagingLayout, narrow && styles.messagingLayoutNarrow]}>
      <View style={styles.threadList}>
        <View style={styles.threadListHeader}>
          <View><Text style={styles.heading}>Direct messages</Text><Text style={styles.subheading}>Private school conversations</Text></View>
          <View style={styles.secureMark}><ShieldAlert size={13} color={colors.forest} /></View>
        </View>
        <View style={styles.threadSearch}><Search size={14} color={colors.muted} /><Text style={styles.threadSearchText}>Search conversations</Text></View>
        {threads.map((thread) => {
          const selected = thread.id === activeThreadId;
          const latest = thread.messages[thread.messages.length - 1];
          return <Pressable key={thread.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { setActiveThreadId(thread.id); setGatewayNotice(''); }} style={[styles.threadItem, selected && styles.threadItemSelected]}>
            <View style={[styles.threadAvatar, selected && styles.threadAvatarSelected]}><Text style={styles.threadAvatarText}>{thread.title.split(' ').map((part) => part[0]).slice(0, 2).join('')}</Text></View>
            <View style={styles.threadCopy}><Text style={styles.threadTitle}>{thread.title}</Text><Text style={styles.threadStudent}>{thread.student} · {thread.kind}</Text><Text numberOfLines={1} style={styles.threadPreview}>{latest.body}</Text></View>
            {thread.id === 3 ? <View style={styles.unreadDot} /> : null}
          </Pressable>;
        })}
        <Pressable style={styles.newInquiryButton} onPress={() => { setActiveThreadId(3); setGatewayNotice('Office inquiry selected. Routing is a local demo.'); }}><MessageCircle size={14} color={colors.forest} /><Text style={styles.newInquiryText}>Open office inquiry</Text></Pressable>
      </View>

      <View style={styles.chatPanel}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderCopy}><Text style={styles.chatTitle}>{activeThread.title}</Text><Text style={styles.chatSubtitle}>{activeThread.student} · {activeThread.kind}</Text></View>
          <View style={styles.chatActions}>
            <Pressable accessibilityRole="button" onPress={previewSms} style={styles.gatewayButton}><MessageCircle size={14} color={colors.forest} /><Text style={styles.gatewayButtonText}>Masked SMS</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Call guardian using school caller ID" disabled={callPending} onPress={startMaskedCall} style={[styles.gatewayButton, callPending && styles.gatewayButtonDisabled]}><Phone size={14} color={colors.forest} /><Text style={styles.gatewayButtonText}>{callPending ? 'Starting…' : 'Call guardian'}</Text></Pressable>
          </View>
        </View>
        <View style={styles.participantStrip}><Users size={13} color={colors.muted} /><Text style={styles.participantText}>{activeThread.participants.join(' · ')}</Text></View>
        <ScrollView style={styles.messageHistory} contentContainerStyle={styles.messageHistoryContent}>
          <Text style={styles.threadDate}>TODAY · MESSAGES ARE PRIVATE TO THIS THREAD</Text>
          {activeThread.messages.map((item) => <View key={item.id} style={[styles.messageLine, item.mine && styles.messageLineMine]}>
            {!item.mine ? <Text style={styles.messageAuthor}>{item.author}</Text> : null}
            <View style={[styles.messageBubble, item.mine ? styles.messageBubbleMine : styles.messageBubbleOther]}><Text style={[styles.messageBody, item.mine && styles.messageBodyMine]}>{item.body}</Text></View>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>)}
        </ScrollView>
        {gatewayNotice ? <View style={styles.gatewayNotice}><ShieldAlert size={13} color="#567447" /><Text style={styles.gatewayNoticeText}>{gatewayNotice}</Text></View> : null}
        <View style={styles.composerRow}><TextInput value={draft} onChangeText={setDraft} placeholder="Write a private message..." placeholderTextColor="#9ca59d" multiline style={styles.messageInput} /><Pressable accessibilityRole="button" accessibilityLabel="Send local demo message" onPress={sendMessage} style={styles.sendButton}><Send size={15} color="#fff" /></Pressable></View>
        <Text style={styles.compliance}>Demo inbox · No student records or phone gateway connected</Text>
      </View>
    </View>
  );
}

export function EmergencyBroadcast({ narrow }: { narrow: boolean }) {
  const [priority, setPriority] = useState<'Urgent safety alert' | 'Weather closure'>('Urgent safety alert');
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<string[]>(['SMS', 'Voice call', 'Email', 'App push']);
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState('');
  const availableChannels = ['SMS', 'Voice call', 'Email', 'App push'];
  const toggleChannel = (channel: string) => setChannels((current: string[]) => current.includes(channel)
    ? current.filter((item) => item !== channel)
    : [...current, channel]);

  return (
    <View style={[styles.broadcastLayout, narrow && styles.broadcastLayoutNarrow]}>
      <View style={styles.broadcastMain}>
        <View style={styles.broadcastHeader}>
          <View><Text style={styles.eyebrow}>DISTRICT COMMUNICATIONS</Text><Text style={styles.heading}>Emergency broadcast</Text><Text style={styles.subheading}>Prepare one urgent update for district families and staff.</Text></View>
          <View style={styles.broadcastStatus}><View style={styles.broadcastStatusDot} /><Text style={styles.broadcastStatusText}>DRAFT</Text></View>
        </View>
        <View style={styles.broadcastCaution}><ShieldAlert size={15} color="#a9543c" /><Text style={styles.broadcastCautionText}>Emergency messages can cause alarm. Verify details and authorization before any real dispatch.</Text></View>
        <View style={styles.broadcastForm}>
          <Text style={styles.fieldLabel}>ALERT TYPE</Text>
          <View style={styles.priorityChoices}>{(['Urgent safety alert', 'Weather closure'] as const).map((item) => <Pressable key={item} onPress={() => setPriority(item)} style={[styles.priorityChoice, priority === item && styles.priorityChoiceSelected]}><View style={[styles.checkbox, priority === item && styles.priorityCheckSelected]}>{priority === item ? <Check size={11} color="#fff" /> : null}</View><Text style={styles.priorityText}>{item}</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>AUDIENCE</Text>
          <View style={styles.audienceSummary}><Users size={15} color={colors.forest} /><View style={{ flex: 1 }}><Text style={styles.audienceTitle}>Cedar Valley USD · All schools</Text><Text style={styles.audienceSubtitle}>Families and staff · Audience preview</Text></View><ChevronDown size={15} color={colors.muted} /></View>
          <Text style={styles.fieldLabel}>HEADLINE</Text>
          <TextInput value={headline} onChangeText={setHeadline} placeholder="Short, clear alert title" placeholderTextColor="#9ca59d" style={styles.textInput} />
          <Text style={styles.fieldLabel}>MESSAGE</Text>
          <TextInput value={message} onChangeText={setMessage} placeholder="Share confirmed information and next steps" placeholderTextColor="#9ca59d" multiline textAlignVertical="top" style={styles.broadcastMessage} />
          <Text style={styles.fieldLabel}>DELIVERY CHANNELS</Text>
          <View style={styles.channelGrid}>{availableChannels.map((channel) => <Pressable key={channel} onPress={() => toggleChannel(channel)} style={styles.channelOption}>
            <View style={[styles.checkbox, channels.includes(channel) && styles.checkboxSelected]}>{channels.includes(channel) ? <Check size={11} color="#fff" /> : null}</View>
            {channel === 'Voice call' ? <Phone size={14} color={colors.muted} /> : channel === 'App push' ? <Bell size={14} color={colors.muted} /> : channel === 'Email' ? <Mail size={14} color={colors.muted} /> : <MessageCircle size={14} color={colors.muted} />}
            <Text style={styles.channelText}>{channel}</Text>
          </Pressable>)}</View>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: bannerEnabled }} onPress={() => { setBannerEnabled(!bannerEnabled); setDispatchNotice('Website banner preview only. No district or school website was changed.'); }} style={styles.bannerToggleRow}>
            <View style={[styles.toggleTrack, bannerEnabled && styles.toggleTrackActive]}><View style={[styles.toggleThumb, bannerEnabled && styles.toggleThumbActive]} /></View>
            <View style={{ flex: 1 }}><Text style={styles.bannerToggleTitle}>Website banner override</Text><Text style={styles.bannerToggleText}>Show a priority banner preview across district and school sites</Text></View>
            <Text style={styles.previewTag}>PREVIEW</Text>
          </Pressable>
          {bannerEnabled ? <View style={styles.websiteBannerPreview}><ShieldAlert size={16} color="#fff" /><View style={{ flex: 1 }}><Text style={styles.websiteBannerEyebrow}>EMERGENCY NOTICE · PREVIEW ONLY</Text><Text style={styles.websiteBannerTitle}>{headline || 'Your alert headline will appear here'}</Text><Text style={styles.websiteBannerMessage}>{message || 'Your approved message will appear here.'}</Text></View></View> : null}
          {dispatchNotice ? <View style={styles.broadcastNotice}><Text style={styles.broadcastNoticeText}>{dispatchNotice}</Text></View> : null}
          <View style={styles.dispatchFooter}><Text style={styles.localOnlyNote}>No messages sent · Gateway not connected</Text><Pressable onPress={() => setDispatchNotice(headline.trim() && message.trim() ? `Preview ready for ${channels.length} channels. No messages or website changes were sent.` : 'Enter a headline and message before preparing this preview.')} style={styles.dispatchButton}><Text style={styles.dispatchButtonText}>Prepare preview</Text><ArrowRight size={14} color="#fff" /></Pressable></View>
        </View>
      </View>
      {!narrow ? <View style={styles.broadcastRail}><View style={styles.railPanel}><Text style={styles.railTitle}>Dispatch checklist</Text>{['Confirm alert authority', 'Verify the message and audience', 'Check every selected channel', 'Keep a delivery audit record'].map((item, index) => <View key={item} style={styles.railFeature}><View style={styles.checklistIndex}><Text style={styles.checklistIndexText}>{index + 1}</Text></View><Text style={styles.railFeatureText}>{item}</Text></View>)}<View style={styles.railDivider} /><Text style={styles.railTitle}>Gateway status</Text><Text style={styles.railBody}>Twilio, email, push, and website banner services are not connected in this preview.</Text></View></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  communityLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 }, communityLayoutNarrow: { flexDirection: 'column' }, communityMain: { flex: 1, minWidth: 0 },
  communityScopeTabs: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, gap: 3, backgroundColor: '#e9ede7', borderRadius: 5 },
  communityScopeTab: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 4 },
  communityScopeTabSelected: { backgroundColor: '#fff', shadowColor: '#1b3225', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  communityScopeText: { color: '#66736a', fontSize: 10, fontWeight: '500' }, communityScopeTextSelected: { color: colors.forest, fontWeight: '700' },
  communityHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 14 }, communityHeadingCopy: { flex: 1, minWidth: 0 },
  feedLabel: { color: colors.forest, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  communityHeading: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '700', marginTop: 5 }, communityDescription: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  createPostButton: { minHeight: 36, borderRadius: 5, backgroundColor: colors.forest, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, createPostText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  publishBanner: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, backgroundColor: '#eaf0e8', borderRadius: 5, marginBottom: 12 },
  publishBannerIcon: { width: 32, height: 32, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dce9d7' }, publishBannerTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, publishBannerText: { color: '#647168', fontSize: 9, lineHeight: 13, marginTop: 3 },
  previewTag: { color: '#718073', fontSize: 7, fontWeight: '700', letterSpacing: 0.5 }, feedNotice: { padding: 9, backgroundColor: colors.limeSoft, borderRadius: 4, marginBottom: 10 }, feedNoticeText: { color: colors.forest, fontSize: 9 },
  feedComposer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfe5dc', borderRadius: 5, padding: 13, marginBottom: 12 }, composerTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  feedHeadlineInput: { minHeight: 36, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 9, color: colors.ink, fontSize: 10, marginBottom: 8 }, feedMessageInput: { minHeight: 78, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 9, paddingTop: 8, color: colors.ink, fontSize: 10, lineHeight: 15 },
  destinationLabel: { color: '#637068', fontSize: 8, fontWeight: '700', letterSpacing: 0.6, marginTop: 11, marginBottom: 7 }, destinationList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  destinationItem: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 6 },
  destinationCheck: { width: 13, height: 13, borderWidth: 1, borderColor: '#c8d1c8', borderRadius: 3, alignItems: 'center', justifyContent: 'center' }, destinationCheckSelected: { backgroundColor: colors.forest, borderColor: colors.forest }, destinationText: { color: '#5f6b62', fontSize: 8 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 }, localOnlyNote: { color: '#929c94', fontSize: 8, flex: 1 },
  publishButton: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 4, backgroundColor: colors.forest }, publishButtonText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  feedListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, feedListTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' }, feedListSubtitle: { color: colors.muted, fontSize: 9, marginTop: 3 },
  sampleBadge: { color: '#879188', fontSize: 7, fontWeight: '700', letterSpacing: 0.5, backgroundColor: '#e9ede7', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4 },
  postCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 13, marginBottom: 9 }, postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, postAvatarText: { color: colors.forest, fontSize: 8, fontWeight: '700' }, postAuthor: { color: colors.ink, fontSize: 9, fontWeight: '700' }, postMeta: { color: '#8b958d', fontSize: 8, marginTop: 3 },
  postCategory: { backgroundColor: '#f0f3ee', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 3 }, postCategoryText: { color: '#617066', fontSize: 7, fontWeight: '600' }, postTitle: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 11 }, postMessage: { color: '#69756c', fontSize: 9, lineHeight: 15, marginTop: 5 },
  postMedia: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 9, marginTop: 10, borderRadius: 4, backgroundColor: '#f1f5ed' }, postMediaIcon: { width: 28, height: 28, backgroundColor: '#e2ecd9', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }, postMediaTitle: { color: colors.forest, fontSize: 8, fontWeight: '700' }, postMediaHint: { color: '#89938b', fontSize: 7, marginTop: 3 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingTop: 8, marginTop: 10 }, postFooterText: { color: '#8b958d', fontSize: 7 },
  communityRail: { width: 220, gap: 10 }, communityRailNarrow: { width: '100%' }, railNotice: { backgroundColor: '#f1f3ef', borderRadius: 5, padding: 12 }, railNoticeTitle: { color: '#5f6a62', fontSize: 9, fontWeight: '700' }, railNoticeBody: { color: '#79837b', fontSize: 8, lineHeight: 13, marginTop: 5 }, railFeatureDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#88a96d' },
  communicationModeBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 11, marginBottom: 12 },
  communicationMode: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 4 }, communicationModeSelected: { backgroundColor: '#e9f0e5' },
  communicationModeText: { color: '#68746b', fontSize: 9, fontWeight: '500' }, communicationModeTextSelected: { color: colors.forest, fontWeight: '700' },
  messagingLayout: { flexDirection: 'row', alignItems: 'stretch', gap: 10, minHeight: 480 },
  messagingLayoutNarrow: { flexDirection: 'column' },
  threadList: { width: 250, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 11 },
  threadListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  heading: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '700', marginTop: 4 },
  subheading: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  secureMark: { width: 27, height: 27, borderRadius: 5, backgroundColor: '#e9f0e5', alignItems: 'center', justifyContent: 'center' },
  threadSearch: { height: 31, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 4, marginBottom: 6 },
  threadSearchText: { color: '#929c94', fontSize: 8 },
  threadItem: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, borderRadius: 4, borderBottomWidth: 1, borderBottomColor: '#edf0eb' },
  threadItemSelected: { backgroundColor: '#f0f5ec' },
  threadAvatar: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff1ed' },
  threadAvatarSelected: { backgroundColor: '#dce9d7' },
  threadAvatarText: { color: colors.forest, fontSize: 8, fontWeight: '700' },
  threadCopy: { flex: 1, minWidth: 0 }, threadTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  threadStudent: { color: '#7d887f', fontSize: 7, marginTop: 3 }, threadPreview: { color: '#849087', fontSize: 7, marginTop: 4 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  newInquiryButton: { minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 4 },
  newInquiryText: { color: colors.forest, fontSize: 8, fontWeight: '600' },
  chatPanel: { flex: 1, minWidth: 0, minHeight: 480, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 12 },
  chatHeader: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: '#edf0eb', paddingBottom: 9 },
  chatHeaderCopy: { flex: 1, minWidth: 0 }, chatTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' }, chatSubtitle: { color: '#7e8980', fontSize: 8, marginTop: 4 },
  chatActions: { flexDirection: 'row', alignItems: 'center', gap: 5 }, gatewayButton: { height: 29, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 4 },
  gatewayButtonText: { color: colors.forest, fontSize: 8, fontWeight: '600' }, gatewayButtonDisabled: { opacity: 0.5 }, participantStrip: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#edf0eb' },
  participantText: { color: '#7e8980', fontSize: 7, flex: 1, lineHeight: 11 }, messageHistory: { flex: 1, minHeight: 170, maxHeight: 270 }, messageHistoryContent: { paddingVertical: 12, gap: 10 },
  threadDate: { color: '#98a198', fontSize: 7, textAlign: 'center', marginBottom: 4 }, messageLine: { alignSelf: 'flex-start', maxWidth: '84%' }, messageLineMine: { alignSelf: 'flex-end' },
  messageAuthor: { color: '#778279', fontSize: 7, marginBottom: 3, marginLeft: 3 }, messageBubble: { borderRadius: 5, paddingHorizontal: 9, paddingVertical: 7 },
  messageBubbleOther: { backgroundColor: '#f0f3ee' }, messageBubbleMine: { backgroundColor: colors.forest }, messageBody: { color: '#39473e', fontSize: 9, lineHeight: 14 }, messageBodyMine: { color: '#fff' },
  messageTime: { color: '#929b94', fontSize: 7, marginTop: 3, alignSelf: 'flex-end' }, gatewayNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 8, backgroundColor: colors.limeSoft, borderRadius: 4, marginBottom: 7 },
  gatewayNoticeText: { color: '#587449', fontSize: 8, lineHeight: 12, flex: 1 }, composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, borderTopWidth: 1, borderTopColor: '#edf0eb', paddingTop: 8 },
  messageInput: { flex: 1, minHeight: 34, maxHeight: 74, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 7, color: colors.ink, fontSize: 9 },
  sendButton: { width: 33, height: 33, borderRadius: 4, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }, compliance: { color: '#929b94', fontSize: 7, marginTop: 7 },
  broadcastLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, broadcastLayoutNarrow: { flexDirection: 'column' },
  broadcastMain: { flex: 1, minWidth: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 15 },
  broadcastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }, eyebrow: { color: colors.orange, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  broadcastStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f3eee0', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 5 },
  broadcastStatusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#b18c39' }, broadcastStatusText: { color: '#886d30', fontSize: 7, fontWeight: '700' },
  broadcastCaution: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 9, borderRadius: 4, backgroundColor: colors.orangeSoft, marginBottom: 13 }, broadcastCautionText: { color: '#95533d', fontSize: 8, lineHeight: 12, flex: 1 },
  broadcastForm: { gap: 7 }, fieldLabel: { color: '#637068', fontSize: 8, fontWeight: '700', letterSpacing: 0.6 }, priorityChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 5 },
  priorityChoice: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 8 }, priorityChoiceSelected: { backgroundColor: '#fff7f3', borderColor: '#e8c6b8' },
  checkbox: { width: 13, height: 13, borderWidth: 1, borderColor: '#c8d1c8', borderRadius: 3, alignItems: 'center', justifyContent: 'center' }, checkboxSelected: { backgroundColor: colors.forest, borderColor: colors.forest }, priorityCheckSelected: { backgroundColor: colors.orange, borderColor: colors.orange }, priorityText: { color: '#59655c', fontSize: 8 },
  audienceSummary: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 9, marginBottom: 5 }, audienceTitle: { color: colors.ink, fontSize: 9, fontWeight: '600' }, audienceSubtitle: { color: '#89938b', fontSize: 7, marginTop: 3 },
  textInput: { minHeight: 36, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 9, color: colors.ink, fontSize: 9, marginBottom: 3 }, broadcastMessage: { minHeight: 70, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 9, paddingTop: 8, color: colors.ink, fontSize: 9, lineHeight: 14, marginBottom: 4 },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }, channelOption: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingHorizontal: 7 }, channelText: { color: '#58645b', fontSize: 8 },
  bannerToggleRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#edf0eb', borderBottomWidth: 1, borderBottomColor: '#edf0eb', paddingVertical: 7 },
  toggleTrack: { width: 29, height: 17, borderRadius: 9, backgroundColor: '#d8dfd7', padding: 2, justifyContent: 'center' }, toggleTrackActive: { backgroundColor: colors.forest }, toggleThumb: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#fff' }, toggleThumbActive: { alignSelf: 'flex-end' },
  bannerToggleTitle: { color: colors.ink, fontSize: 8, fontWeight: '700' }, bannerToggleText: { color: '#89938b', fontSize: 7, marginTop: 3 },
  websiteBannerPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 11, backgroundColor: '#a53e32', borderRadius: 4, marginTop: 8 }, websiteBannerEyebrow: { color: '#f6d7d1', fontSize: 7, fontWeight: '700', letterSpacing: 0.5 }, websiteBannerTitle: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 }, websiteBannerMessage: { color: '#fff1ee', fontSize: 8, lineHeight: 12, marginTop: 3 },
  broadcastNotice: { padding: 8, backgroundColor: '#f3f5f0', borderRadius: 4, marginTop: 8 }, broadcastNoticeText: { color: '#647168', fontSize: 8, lineHeight: 12 }, dispatchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  dispatchButton: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 4, backgroundColor: colors.forest }, dispatchButtonText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  broadcastRail: { width: 205 }, railPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 13 }, railTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  railFeature: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 }, railFeatureText: { color: '#68756c', fontSize: 8, flex: 1 }, checklistIndex: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#edf2e9', alignItems: 'center', justifyContent: 'center' }, checklistIndexText: { color: colors.forest, fontSize: 7, fontWeight: '700' },
  railDivider: { height: 1, backgroundColor: '#edf0eb', marginVertical: 11 }, railBody: { color: '#68756c', fontSize: 9, lineHeight: 14, marginTop: 5 },
});