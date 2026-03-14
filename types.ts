export enum AppMode {
  SUBJECT_SELECTION = 'SUBJECT_SELECTION',
  DASHBOARD = 'DASHBOARD',
  WHOLE_CHAPTER = 'WHOLE_CHAPTER',
  MIND_MAP = 'MIND_MAP',
  ACTIVE_RECALL = 'ACTIVE_RECALL',
  FLASHCARDS = 'FLASHCARDS',
  DOUBT_SOLVER = 'DOUBT_SOLVER',
  REVISION = 'REVISION',
  ADMIN = 'ADMIN',
  PROFILE = 'PROFILE',
  COMMUNITY = 'COMMUNITY'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  READING = 'reading'
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  hobbies?: string;
  grade?: string;
}

export interface MindMapData {
  id: string;
  chapterId: string;
  timestamp: number;
  config: { complexity: string; detail: string };
  data: { rootTitle: string; nodes: any[] };
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
