export enum AppMode {
  SUBJECT_SELECTION = 'SUBJECT_SELECTION',
  DASHBOARD = 'DASHBOARD',
  WHOLE_CHAPTER = 'WHOLE_CHAPTER',
  MIND_MAP = 'MIND_MAP',
  ACTIVE_RECALL = 'ACTIVE_RECALL',
  FLASHCARDS = 'FLASHCARDS',
  DOUBT_SOLVER = 'DOUBT_SOLVER',
  REVISION = 'REVISION',
  QUIZ = 'QUIZ',
  LEADERBOARD = 'LEADERBOARD',
  ADMIN = 'ADMIN',
  PROFILE = 'PROFILE',
  COMMUNITY = 'COMMUNITY',
  CONTACT = 'CONTACT',
  TIMELINE = 'TIMELINE',
  INDIA_MAP = 'INDIA_MAP'
}

export type QuizType = 'MCQ' | 'FIB' | 'MATCH' | 'MIXED';

export interface QuizQuestion {
  type: 'MCQ' | 'FIB' | 'MATCH';
  question: string;
  options?: string[];                          // MCQ: 4 choices
  answer?: string;                             // MCQ & FIB correct answer
  pairs?: { left: string; right: string }[];   // MATCH pairs (3)
}

export interface LeaderboardEntry {
  id: string;
  full_name?: string;
  avatar_url?: string;
  grade?: string;
  total_points: number;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  READING = 'reading'
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  hobbies?: string;
  grade?: string;
  total_points?: number;
  is_admin?: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  created_at?: string;
  daily_token_limit?: number;
  client_id?: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  feature: string;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
}

export interface WeeklyPoint {
  name: string;
  users: number;
  calls: number;
}

export interface FeatureStat {
  feature: string;
  calls: number;
  tokens: number;
}

export interface UserTokenStat {
  user_id: string;
  full_name: string;
  tokens: number;
  calls: number;
  daily_limit: number;
}

export interface FeatureFlags {
  doubt_solver: boolean;
  mind_map: boolean;
  flashcards: boolean;
  quiz: boolean;
  active_recall: boolean;
  revision: boolean;
  community: boolean;
  leaderboard: boolean;
  whole_chapter: boolean;
}

export interface RateLimits {
  chatbot_daily_tokens: number;
  mindmap_calls_per_hour: number;
  quiz_calls_per_hour: number;
  flashcard_calls_per_hour: number;
  explanation_calls_per_hour: number;
}

export interface AdminSettings {
  feature_flags: FeatureFlags;
  rate_limits: RateLimits;
  maintenance_mode: boolean;
  maintenance_message: string;
  max_file_upload_mb: number;
  ai_model: string;
}

export interface AdminUserRow extends UserProfile {
  data_size_kb?: number;
  chat_count?: number;
  quiz_count?: number;
  last_active?: string;
}

export interface MindMapData {
  id: string;
  chapterId: string;
  timestamp: number;
  config: { complexity: string; detail: string };
  data?: { rootTitle: string; nodes: any[] }; // not persisted in history — fetched from mindmap_cache
}

export interface Concept {
  id: string;
  title: string;
  description: string;
  dependencyNote?: string;
  estimatedMinutes: number;
  status: 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
  masteryLevel: number; // 0-100
  prerequisites: string[];
}

export interface Chapter {
  id: string;
  title: string;
  subject: string;
  concepts: Concept[];
  createdAt?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
  nextReviewDate: Date;
  conceptId: string;
  chapterId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  reason?: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}
