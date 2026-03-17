import OneSignal from 'react-onesignal';

export const initOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID || '',
      allowLocalhostAsSecureOrigin: true,
      // By default, the notify button is disabled. 
      // We don't include it here to avoid showing any OneSignal UI.
    });
    console.log('OneSignal Initialized');
  } catch (err) {
    console.error('Error initializing OneSignal:', err);
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
