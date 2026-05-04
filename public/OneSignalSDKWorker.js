importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

self.addEventListener('push', function(event) {
  if (!event.data) return;

  var data = {};
  try { data = event.data.json(); } catch(e) { return; }

  // OneSignal push payload uses 'content' not 'body'
  var title = data.title || (data.headings && data.headings.en) || 'CogniStruct';
  var body  = data.content || data.body || data.alert
           || (data.contents && data.contents.en) || '';
  var icon  = data.icon || '/favicon.ico';

  event.waitUntil(
    self.registration.showNotification(title, {
      body:  body,
      icon:  icon,
      badge: '/favicon.ico',
      tag:   data.i || 'onesignal',
      data:  data,
    }).catch(function(err) {
      console.error('[SW] showNotification failed:', err);
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
