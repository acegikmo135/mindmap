import OneSignal from 'react-onesignal';
import { supabase } from '../lib/supabase';

export const initOneSignal = async () => {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
  if (!appId) return; // skip if not configured

  try {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    });

    // Request push notification permission (required for notifications to work)
    const os = OneSignal as any;
    if (os.Notifications?.requestPermission) {
      await os.Notifications.requestPermission();
    } else if (os.User?.pushSubscription?.optIn) {
      await os.User.pushSubscription.optIn();
    } else if (os.showNativePrompt) {
      await os.showNativePrompt();
    }
  } catch (err) {
    console.error('Error initializing OneSignal:', err);
  }
};

export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  message: string
): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: 'send-notification', targetUserId, title, message }),
    });
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
};

export const setOneSignalExternalId = async (userId: string) => {
  try {
    // Use any to bypass version-specific type issues in react-onesignal
    const os = OneSignal as any;
    if (os.setExternalUserId) {
      await os.setExternalUserId(userId);
    } else if (os.login) {
      await os.login(userId);
    }
  } catch (err) {
    console.error('Error setting OneSignal External ID:', err);
  }
};
