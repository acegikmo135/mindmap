declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: ((os: any) => void | Promise<void>)[];
    __osInitialized__: boolean;
  }
}

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let _resolveOS!: (os: any) => void;
let _rejectOS!:  (err: any) => void;
const _osReady = new Promise<any>((res, rej) => { _resolveOS = res; _rejectOS = rej; });
const getOS = () => _osReady;

// Wipe all service workers + all IndexedDB, then reload.
// Called when OneSignal detects a stale/mismatched app ID.
async function _nukeAndReload(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    if ('databases' in indexedDB) {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    }
  } catch { /* ignore */ }
  window.location.reload();
}

export const initOneSignal = (): void => {
  if (window.__osInitialized__) {
    if (window.OneSignal) _resolveOS(window.OneSignal);
    return;
  }
  window.__osInitialized__ = true;

  if (!APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID not set');
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId:                        APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton:                 { enable: false },
        welcomeNotification:          { disable: true },
        promptOptions: {
          slidedown: {
            enabled:    true,
            autoPrompt: true,
            timeDelay:  3,
            pageViews:  1,
          },
        },
      });

      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (e: any) => {
        try { e.notification.display(); } catch { /* ignore */ }
      });

      console.log('[OneSignal] ✅ ready | optedIn:', OneSignal.User.PushSubscription.optedIn);
      _resolveOS(OneSignal);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      // Stale service worker from a previous OneSignal app on this domain.
      // Nuke everything and reload — init will succeed on the clean page.
      if (msg.includes('AppID') || msg.includes('match') || msg.includes('existing')) {
        console.warn('[OneSignal] Stale app — clearing service workers and reloading…');
        await _nukeAndReload();
        return;
      }
      console.error('[OneSignal] init failed:', err);
      _rejectOS(err);
    }
  });
};

export const loginOneSignal = async (userId: string): Promise<void> => {
  try {
    const os = await getOS();
    await os.login(userId);
    console.log('[OneSignal] ✅ login | externalId:', userId);
  } catch (err) {
    console.error('[OneSignal] login failed:', err);
  }
};

export const logoutOneSignal = async (): Promise<void> => {
  try { await (await getOS()).logout(); } catch { /* ignore */ }
};

export const requestOneSignalPermission = async (): Promise<boolean> => {
  try {
    const os = await getOS();
    if (os.User.PushSubscription.optedIn) return true;

    os.Slidedown.promptPush({ force: true });

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (os.User.PushSubscription.optedIn) {
        console.log('[OneSignal] ✅ optedIn after', i + 1, 's');
        return true;
      }
      if (Notification.permission === 'denied') return false;
    }

    if (Notification.permission === 'granted') {
      await os.User.PushSubscription.optIn();
    }

    return os.User.PushSubscription.optedIn === true;
  } catch (err) {
    console.error('[OneSignal] subscribe failed:', err);
    return false;
  }
};

export const onSubscriptionChange = async (cb: (subscribed: boolean) => void): Promise<void> => {
  try {
    const os = await getOS();
    cb(Notification.permission === 'granted' || os.User.PushSubscription.optedIn === true);
    os.User.PushSubscription.addEventListener('change', (e: any) => {
      cb(e.current.optedIn === true);
    });
  } catch { /* ignore */ }
};

export const isNotificationGranted = (): boolean =>
  typeof Notification !== 'undefined' && Notification.permission === 'granted';

export const autoPromptIfNeeded = async (): Promise<void> => { /* handled by autoPrompt: true */ };
