import { supabase } from '../lib/supabase';
import { Chapter, Flashcard, Message, UserProfile, MindMapData, FriendRequest } from '../types';

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
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'PENDING'
    });
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
