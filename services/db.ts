import { supabase } from '../lib/supabase';
import { Chapter, Flashcard, Message, UserProfile, MindMapData, FriendRequest, QuizType, LeaderboardEntry, AdminSettings, FeatureFlags, RateLimits, AdminUserRow, UsageLog, WeeklyPoint, FeatureStat, UserTokenStat } from '../types';

export type { UsageLog, WeeklyPoint, FeatureStat, UserTokenStat };

// ── Chapter Explanation types ──────────────────────────────────────────────────
export interface ChapterExplanation {
  id: string;
  user_id: string;
  chapter_id: string;
  chapter_title: string;
  content: string;
  length: string;
  depth: string;
  created_at: string;
}

export interface UserData {
  chapters: Chapter[];
  flashcards: Flashcard[];
  settings: any;
  mind_maps?: { [chapterId: string]: MindMapData[] };
}

export const getUserData = async (userId: string): Promise<UserData | null> => {
  const { data, error } = await supabase
    .from('user_data')
    .select('chapters, flashcards, settings, mind_maps')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user data:', error);
    return null;
  }

  return data as UserData;
};

export const saveUserData = async (userId: string, data: Partial<UserData>) => {
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, ...data })
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving user data:', error);
  }
};

export const getChatHistory = async (userId: string, chapterId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  const allMessages = (data?.messages || {}) as { [key: string]: Message[] };
  return allMessages[chapterId] || [];
};

export const clearChatHistory = async (userId: string, chapterId: string) => {
  const { data: existingData } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('user_id', userId)
    .maybeSingle();

  const allMessages = (existingData?.messages || {}) as { [key: string]: Message[] };
  delete allMessages[chapterId];

  await supabase
    .from('chat_history')
    .upsert({ user_id: userId, messages: allMessages as any })
    .eq('user_id', userId);
};

export const saveChatHistory = async (userId: string, chapterId: string, messages: Message[]) => {
  // First get existing history to merge
  const { data: existingData } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('user_id', userId)
    .maybeSingle();

  const allMessages = (existingData?.messages || {}) as { [key: string]: Message[] };
  allMessages[chapterId] = messages;

  const { error } = await supabase
    .from('chat_history')
    .upsert({ user_id: userId, messages: allMessages as any })
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving chat history:', error);
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, client_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as UserProfile;
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

export const getQuizFromCache = async (
  chapterId: string,
  quizType: string,
  count: number
): Promise<any[]> => {
  const types = quizType === 'MIXED' ? ['MCQ', 'FIB', 'MATCH'] : [quizType];

  const { data, error } = await supabase
    .from('quiz_cache')
    .select('quiz_type, questions')
    .eq('chapter_id', chapterId)
    .in('quiz_type', types);

  if (error || !data || data.length === 0) return [];

  const pool: any[] = data.flatMap(row => row.questions as any[]);

  // Fisher-Yates shuffle then take count
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

export const getFlashcardsFromCache = async (
  chapterId: string,
  count = 5
): Promise<{ front: string; back: string }[]> => {
  const { data, error } = await supabase
    .from('flashcard_cache')
    .select('cards')
    .eq('chapter_id', chapterId)
    .maybeSingle();

  if (error || !data) return [];
  const all = data.cards as { front: string; back: string }[];
  // Fisher-Yates shuffle then take `count`
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
};

export const getMindMapFromCache = async (
  chapterId: string,
  complexity: string,
  detail: string
): Promise<{ rootTitle: string; nodes: any[] } | null> => {
  const { data, error } = await supabase
    .from('mindmap_cache')
    .select('data')
    .eq('chapter_id', chapterId)
    .eq('complexity', complexity)
    .eq('detail', detail)
    .maybeSingle();

  if (error || !data) return null;
  return data.data as { rootTitle: string; nodes: any[] };
};

export const saveMindMap = async (userId: string, chapterId: string, mapData: MindMapData) => {
  const userData = await getUserData(userId);
  const currentMaps = userData?.mind_maps || {};
  const chapterMaps = currentMaps[chapterId] || [];

  // Strip data — only persist config metadata, not the full JSON
  const { data: _omit, ...configOnly } = mapData;
  const newChapterMaps = [configOnly, ...chapterMaps].slice(0, 5);

  await saveUserData(userId, {
    mind_maps: { ...currentMaps, [chapterId]: newChapterMaps },
  });
};

export const getMindMaps = async (userId: string, chapterId: string): Promise<MindMapData[]> => {
  const userData = await getUserData(userId);
  if (!userData || !userData.mind_maps) return [];
  return userData.mind_maps[chapterId] || [];
};

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  const { error } = await supabase
    .from('friend_requests')
    .upsert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'PENDING',
      reason: null // Clear any previous decline reason
    }, { onConflict: 'sender_id,receiver_id' });
  if (error) throw error;
};

export const deleteFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId);
  if (error) throw error;
};

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*, sender:profiles!sender_id(full_name, avatar_url)')
    .eq('receiver_id', userId);
  
  if (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }

  return data.map(req => ({
    ...req,
    sender_name: req.sender?.full_name,
    sender_avatar: req.sender?.avatar_url
  })) as FriendRequest[];
};

export const updateFriendRequestStatus = async (requestId: string, status: 'ACCEPTED' | 'DECLINED', reason?: string) => {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status, reason })
    .eq('id', requestId);
  if (error) throw error;
};

// ── Chapter Explanations (last 5 per chapter, enforced by DB trigger) ──────────

export const saveExplanation = async (
  userId: string,
  chapterId: string,
  chapterTitle: string,
  content: string,
  length: string,
  depth: string
): Promise<void> => {
  const { error } = await supabase
    .from('chapter_explanations')
    .insert({ user_id: userId, chapter_id: chapterId, chapter_title: chapterTitle, content, length, depth });

  if (error) {
    console.error('Error saving explanation:', error);
  }
};

export const getExplanations = async (
  userId: string,
  chapterId: string
): Promise<ChapterExplanation[]> => {
  const { data, error } = await supabase
    .from('chapter_explanations')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching explanations:', error);
    return [];
  }

  return (data ?? []) as ChapterExplanation[];
};

// ── Quiz Results ───────────────────────────────────────────────────────────────

export interface QuizResult {
  id: string;
  user_id: string;
  chapter_id: string;
  chapter_title: string;
  quiz_type: string;
  score: number;
  total: number;
  points_earned: number;
  created_at: string;
}

export const getQuizHistory = async (userId: string, chapterId: string): Promise<QuizResult[]> => {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) { console.error('Error fetching quiz history:', error); return []; }
  return (data ?? []) as QuizResult[];
};

export const saveQuizResult = async (
  userId: string,
  chapterId: string,
  chapterTitle: string,
  quizType: QuizType,
  score: number,
  total: number,
  pointsEarned: number
): Promise<void> => {
  const { error } = await supabase
    .from('quiz_results')
    .insert({ user_id: userId, chapter_id: chapterId, chapter_title: chapterTitle, quiz_type: quizType, score, total, points_earned: pointsEarned });
  if (error) console.error('Error saving quiz result:', error);
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, grade, total_points')
    .order('total_points', { ascending: false })
    .limit(50);
  if (error) { console.error('Error fetching leaderboard:', error?.message); return []; }
  return (data ?? []) as LeaderboardEntry[];
};

// ── Admin Functions ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AdminSettings = {
  feature_flags: {
    doubt_solver: true, mind_map: true, flashcards: true, quiz: true,
    active_recall: true, revision: true, community: true, leaderboard: true, whole_chapter: true,
  },
  rate_limits: {
    chatbot_daily_tokens: 5000,
    mindmap_calls_per_hour: 5,
    quiz_calls_per_hour: 10,
    flashcard_calls_per_hour: 10,
    explanation_calls_per_hour: 5,
  },
  maintenance_mode: false,
  maintenance_message: 'CogniStruct is undergoing maintenance. Back shortly!',
  max_file_upload_mb: 5,
  ai_model: 'gemini-2.5-flash-lite',
};

export const adminGetSettings = async (): Promise<AdminSettings> => {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'app_settings')
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(data.value as AdminSettings) };
};

export const adminSaveSettings = async (settings: AdminSettings): Promise<void> => {
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ key: 'app_settings', value: settings });
  if (error) throw error;
};

export const adminGetAllUsers = async (): Promise<AdminUserRow[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, grade, total_points, is_admin, is_banned, ban_reason, created_at, daily_token_limit');
  if (error) { console.error('adminGetAllUsers:', error.message); return []; }
  return (data ?? []) as AdminUserRow[];
};

export const checkAndLogFeatureCall = async (
  userId: string,
  feature: string,
  limitPerHour: number
): Promise<boolean> => {
  if (limitPerHour <= 0) return true;
  const { data, error } = await supabase.rpc('check_and_log_feature_call', {
    p_user_id: userId,
    p_feature: feature,
    p_limit: limitPerHour,
    p_window_seconds: 3600,
  });
  if (error) { console.error('checkAndLogFeatureCall:', error); return true; }
  return data as boolean;
};

export const adminSetUserTokenLimit = async (userId: string, limit: number): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ daily_token_limit: limit })
    .eq('id', userId);
  if (error) throw error;
};

export const adminBanUser = async (userId: string, ban: boolean, reason?: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: ban, ban_reason: ban ? (reason ?? 'Banned by admin') : null })
    .eq('id', userId);
  if (error) throw error;
};

export const adminSetAdmin = async (userId: string, isAdmin: boolean): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);
  if (error) throw error;
};

export const adminDeleteUserData = async (userId: string): Promise<void> => {
  await Promise.all([
    supabase.from('user_data').delete().eq('user_id', userId),
    supabase.from('chat_history').delete().eq('user_id', userId),
    supabase.from('quiz_results').delete().eq('user_id', userId),
    supabase.from('chapter_explanations').delete().eq('user_id', userId),
  ]);
};

export interface TableStat {
  table: string;
  label: string;
  rows: number;
  size_kb: number;
}

export const adminGetTableStats = async (): Promise<TableStat[]> => {
  const tables = [
    { table: 'profiles',               label: 'Profiles' },
    { table: 'user_data',              label: 'User Data' },
    { table: 'chat_history',           label: 'Chat History' },
    { table: 'quiz_results',           label: 'Quiz Results' },
    { table: 'quiz_cache',             label: 'Quiz Cache' },
    { table: 'flashcard_cache',        label: 'Flashcard Cache' },
    { table: 'mindmap_cache',          label: 'Mind Map Cache' },
    { table: 'tutor_cache',            label: 'Tutor Cache' },
    { table: 'chapter_explanations',   label: 'Chapter Explanations' },
    { table: 'chapter_explanation_cache', label: 'Explanation Cache' },
    { table: 'friend_requests',        label: 'Friend Requests' },
  ];

  const results = await Promise.all(
    tables.map(async ({ table, label }) => {
      const { count } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
      return { table, label, rows: count ?? 0, size_kb: 0 };
    })
  );
  return results;
};

export interface CacheTable {
  table: string;
  label: string;
}

export const adminClearCache = async (table: string): Promise<void> => {
  const { error } = await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getUsageLogs = async (days = 56): Promise<UsageLog[]> => {
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) { console.error('getUsageLogs:', error); return []; }
  return (data ?? []) as UsageLog[];
};

export const buildWeeklyStats = (logs: UsageLog[]): WeeklyPoint[] => {
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter(l => l.created_at.slice(0, 10) === dateStr);
    return { name: DAY[d.getDay()], users: new Set(dayLogs.map(l => l.user_id)).size, calls: dayLogs.length };
  });
};

export const buildFeatureStats = (logs: UsageLog[]): FeatureStat[] => {
  const map = new Map<string, { calls: number; tokens: number }>();
  for (const l of logs) {
    const s = map.get(l.feature) ?? { calls: 0, tokens: 0 };
    map.set(l.feature, { calls: s.calls + 1, tokens: s.tokens + l.tokens_in + l.tokens_out });
  }
  return Array.from(map.entries())
    .map(([feature, s]) => ({ feature, calls: s.calls, tokens: s.tokens }))
    .sort((a, b) => b.calls - a.calls);
};

export const buildUserTokenStats = (logs: UsageLog[], users: AdminUserRow[]): UserTokenStat[] => {
  const map = new Map<string, { tokens: number; calls: number }>();
  for (const l of logs) {
    const s = map.get(l.user_id) ?? { tokens: 0, calls: 0 };
    map.set(l.user_id, { tokens: s.tokens + l.tokens_in + l.tokens_out, calls: s.calls + 1 });
  }
  return Array.from(map.entries())
    .map(([user_id, s]) => {
      const u = users.find(u => u.id === user_id);
      return { user_id, full_name: u?.full_name || 'Unknown', daily_limit: u?.daily_token_limit ?? 100000, ...s };
    })
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 15);
};

// ── Chapter Explanation Cache ──────────────────────────────────────────────────

export const getExplanationFromCache = async (
  chapterId: string,
  length: string,
  depth: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('chapter_explanation_cache')
    .select('content')
    .eq('chapter_id', chapterId)
    .eq('length', length)
    .eq('depth', depth)
    .maybeSingle();

  if (error || !data) return null;
  return data.content as string;
};

// ── Avatar Upload ──────────────────────────────────────────────────────────────
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'avatars';

export type UploadAvatarResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<UploadAvatarResult> => {
  // ── Client-side validation ───────────────────────────────────────────────
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPG, PNG, WebP or GIF images are allowed.' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Image must be smaller than 5 MB.' };
  }

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  // ── Upload (upsert so re-uploads overwrite) ──────────────────────────────
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadErr) {
    console.error('Avatar upload error:', uploadErr);
    return { ok: false, error: uploadErr.message };
  }

  // ── Get public URL ───────────────────────────────────────────────────────
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the browser shows the new image immediately
  const url = `${data.publicUrl}?t=${Date.now()}`;

  // ── Persist to profile ───────────────────────────────────────────────────
  await updateUserProfile(userId, { avatar_url: url });

  return { ok: true, url };
};
