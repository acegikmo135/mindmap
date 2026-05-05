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
        serviceWorkerPath:            'OneSignalSDKWorker.js',
        serviceWorkerParam:           { scope: '/' },
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

      // If OneSignal thinks user is opted-in but the browser's push subscription
      // is missing or stale (e.g. from a different app ID or reinstalled SW),
      // force a fresh registration so the FCM token is valid.
      try {
        if (OneSignal.User.PushSubscription.optedIn) {
          const sw = await navigator.serviceWorker.ready;
          const browserSub = await sw.pushManager.getSubscription();
          if (!browserSub) {
            console.log('[OneSignal] Stale subscription detected — re-registering...');
            await OneSignal.User.PushSubscription.optOut();
            await new Promise(r => setTimeout(r, 300));
            await OneSignal.User.PushSubscription.optIn();
          }
        }
      } catch { /* ignore */ }

      console.log('[OneSignal] ✅ ready | optedIn:', OneSignal.User.PushSubscription.optedIn);
      _resolveOS(OneSignal);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('AppID') || msg.includes('match') || msg.includes('existing')) {
        if (!sessionStorage.getItem('os_cleaned')) {
          console.warn('[OneSignal] Stale app — cleaning and reloading once…');
          sessionStorage.setItem('os_cleaned', '1');
          try {
            // 1. Unregister all service workers
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
            // 2. Delete every IndexedDB EXCEPT Supabase (which stores auth session)
            if ('databases' in indexedDB) {
              const dbs = await indexedDB.databases();
              console.log('[OneSignal] Deleting IndexedDB:', dbs.map(d => d.name));
              for (const db of dbs) {
                const n = (db.name ?? '').toLowerCase();
                if (!n.includes('supabase')) {
                  indexedDB.deleteDatabase(db.name!);
                }
              }
            }
            // 3. Clear all localStorage EXCEPT Supabase auth token
            for (const k of Object.keys(localStorage)) {
              if (!k.toLowerCase().includes('supabase')) localStorage.removeItem(k);
            }
          } catch { /* ignore */ }
          window.location.reload();
          return;
        }
        console.warn('[OneSignal] Push notifications unavailable on this browser.');
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
      if (os.User.PushSubscription.optedIn) return true;
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
