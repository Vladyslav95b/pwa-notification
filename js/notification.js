let serviceWorker = null;
const applicationServerPublicKey =
  'BDovpdhMc90DTpX9iCt2d2JmcQDdrmr3aCsS7Ve8UAFfFmrfKM7_F2XEP1PYqIncjpip6YWVCK3wY_OMRtNwcpk';

window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator) {
    try {
      const sw = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker register success', sw);
      serviceWorker = sw;
      serviceWorker.pushManager
        .getSubscription()
        .then((res) =>
          res ? updateSubscriptionStatus(true) : updateSubscriptionStatus(false)
        );
    } catch (e) {
      console.log('Service worker register fail');
    }
  }
  checkSubscription();
});

const req_notification_perm = document.getElementById('req_notification_perm');
const notification__status = document.getElementById('notification__status');
const subscription_status = document.querySelector('.subscription_status');
const notification_msg = document.querySelector('.notification__msg');
const send_notification = document.getElementById('send_notification');
const notification__msg__all = document.querySelector(
  '.notification__msg__all'
);

notification__status.textContent = Notification.permission;
req_notification_perm.addEventListener('click', () => {
  Notification.requestPermission().then((res) => {
    notification__status.textContent = Notification.permission;
  });
});

send_notification.addEventListener('click', () => {
  serviceWorker.showNotification('Title of notification', {
    body: notification_msg.value,
  });
});

function checkSubscription() {
  serviceWorker.pushManager.getSubscription().then((sub) => {
    if (sub) {
      updateSubscriptionStatus(true);
    } else {
      updateSubscriptionStatus(false);
    }
  });
}

function sendNotificationToAll() {
  try {
    fetch('http://localhost:5000/push/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: notification__msg__all.value }),
    });
  } catch (e) {
    console.error(e);
  }
}

// subscribe
function subscribeUser() {
  serviceWorker.pushManager
    .subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(applicationServerPublicKey),
    })
    .then(function (subscription) {
      fetch('http://localhost:5000/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })
        .then(function (response) {
          console.log('User is subscribed.');
          updateSubscriptionStatus(true);
        })
        .catch(function (error) {
          console.error('error fetching subscribe', error);
        });
    })
    .catch(function (err) {
      console.log('Failed to subscribe the user: ', err);
    });
}

function unsubscribeUser() {
  serviceWorker.pushManager.getSubscription().then(function (subscription) {
    if (subscription) {
      let subscriptionData = {
        endpoint: subscription.endpoint,
      };

      fetch('http://localhost:5000/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      })
        .then(function (response) {
          updateSubscriptionStatus(false);
          subscription.unsubscribe();
          return response;
        })
        .catch(function (error) {
          console.error('error fetching subscribe', error);
        });
    }
  });
}

//helpers

function updateSubscriptionStatus(subscription) {
  subscription_status.textContent = subscription
    ? 'User is subscribed'
    : 'User is unsubscribed';
}

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
