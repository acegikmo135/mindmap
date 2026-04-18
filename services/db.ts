import { supabase } from '../lib/supabase';
import { Chapter, Flashcard, Message, UserProfile, MindMapData, FriendRequest, QuizType, LeaderboardEntry } from '../types';

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
    .select('*')
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

export const saveMindMap = async (userId: string, chapterId: string, mapData: MindMapData) => {
  const userData = await getUserData(userId);
  // If no user data exists yet, we'll create it
  const currentMaps = userData?.mind_maps || {};
  const chapterMaps = currentMaps[chapterId] || [];
  
  // Add new map to beginning, limit to 5
  const newChapterMaps = [mapData, ...chapterMaps].slice(0, 5);
  
  const newMaps = {
    ...currentMaps,
    [chapterId]: newChapterMaps
  };

  await saveUserData(userId, { mind_maps: newMaps });
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
