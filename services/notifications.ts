import { supabase } from '../lib/supabase';

const TUTOR_API = (import.meta as any).env?.VITE_TUTOR_API_URL ?? 'http://localhost:8000';

export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  message: string
): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: 'send-notification', targetUserId, title, message }),
    });
    const data = await res.json();
    console.log('[OneSignal] sendPushNotification response:', data);
    if (data?.error) console.error('[OneSignal] send error:', data.error);
  } catch (err) {
    console.error('[OneSignal] sendPushNotification failed:', err);
  }
};

export const scheduleFlashcardReminder = async (
  userId: string,
  chapterTitle: string,
  delayDays: number
): Promise<void> => {
  if (!userId || delayDays <= 0) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    await fetch(`${TUTOR_API}/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_user_id: userId,
        title: 'Time to Review! 🧠',
        message: `Your flashcards for "${chapterTitle}" are due ${delayDays === 1 ? 'tomorrow' : `in ${delayDays} days`}. Keep the streak going!`,
        send_after_seconds: delayDays * 24 * 60 * 60,
        token,
      }),
    });
  } catch (err) {
    console.error('[OneSignal] scheduleFlashcardReminder failed:', err);
  }
};
