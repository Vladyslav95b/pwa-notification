const staticCacheName = 's-app-v3';
const dynamicCacheName = 'd-app-v3';

const assetUrls = [
  'index.html',
  '/js/app.js',
  '/css/styles.css',
  'offline.html',
];

self.addEventListener('install', async (event) => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls);
});

self.addEventListener('activate', async (event) => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== staticCacheName)
      .filter((name) => name !== dynamicCacheName)
      .map((name) => caches.delete(name))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  console.log('cacheFirst', request);
  const cached = await caches.match(request);
  return cached ?? (await fetch(request));
}

async function networkFirst(request) {
  console.log('networkfirst', request);

  const cache = await caches.open(dynamicCacheName);
  try {
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    return cached ?? (await caches.match('/offline.html'));
  }
}

// Notification

const applicationServerPublicKey =
  'BDovpdhMc90DTpX9iCt2d2JmcQDdrmr3aCsS7Ve8UAFfFmrfKM7_F2XEP1PYqIncjpip6YWVCK3wY_OMRtNwcpk';

self.addEventListener('notificationclick', function (event) {
  // close the notification
  event.notification.close();

  // see if the current is open and if it is focus it
  // otherwise open new tab
  event.waitUntil(
    self.clients.matchAll().then(function (clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }

      return self.clients.openWindow('/');
    })
  );
});
self.addEventListener('push', function (event) {
  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Default title',
      body: 'Default message',
      icon: '/default-icon.png',
    };
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
    })
  );
});

// service
const urlB64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
