const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const { v4: uuidv4 } = require('uuid');
const app = express();

// const VapidKeys = webpush.generateVAPIDKeys();
const VapidKeys = {
  publicKey:
    'BDovpdhMc90DTpX9iCt2d2JmcQDdrmr3aCsS7Ve8UAFfFmrfKM7_F2XEP1PYqIncjpip6YWVCK3wY_OMRtNwcpk',
  privateKey: 'FvDoN2HQxp2Hqx1istinoL3GQFh3hQ7KJy4_kciorRg',
};
webpush.setVapidDetails(
  'mailto:dev.vladyslavb@gmail.com',
  VapidKeys.publicKey,
  VapidKeys.privateKey
);

app.use(cors());
app.use(bodyParser.json());
const port = 5000;

app.get('/getAllSubscriptions', (req, res) => {
  fs.readFile('./db.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log('File read failed:', err);
      return;
    }
    res.send(JSON.parse(jsonString));
  });
});
app.post('/addSub', (req, res) => {});

const dummyDb = { subscription: null };
app.get('/send-notification', (req, res) => {
  const subscription = dummyDb.subscription;
  const message = 'Hello World';
  sendNotification(subscription, message);
  res.json({ message: 'message sent' });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

//service
const sendNotification = (subscription, dataToSend = '') => {
  webpush.sendNotification(subscription, dataToSend);
};

//new code
app.post('/push/subscribe', function (req, res) {
  const subscription = {
    endpoint: req.body.endpoint,
    keys: {
      p256dh: req.body.keys.p256dh,
      auth: req.body.keys.auth,
    },
  };
  const payload = JSON.stringify({
    title: 'Welcome',
    body: 'Thank you for enabling push notifications',
  });

  fs.readFile('db.json', function (err, data) {
    var json = JSON.parse(data);
    let existedSub = json.find((el) => el?.endpoint === subscription.endpoint);

    if (existedSub) {
      res.status(401).send('Already exist');
    } else {
      webpush
        .sendNotification(subscription, payload)
        .then(function () {
          console.log('Send welcome push notification');
          res.status(200).send('subscribe');
          console.log('sub', subscription);
          json.push(subscription);
          fs.writeFile('db.json', JSON.stringify(json), function (err) {
            if (err) throw err;
            console.log('The "data to append" was appended to file!');
          });
          return;
        })
        .catch((err) => {
          console.error('Unable to send welcome push notification', err);
          res.status(500).send('subscription not possible');
          return;
        });
    }
  });
});

app.post('/push/testPush', (req, res) => {
  webpush
    .sendNotification(
      {
        endpoint:
          'https://fcm.googleapis.com/fcm/send/cVmyM2t2Tag:APA91bEv7NsCI3lijd-M78ITXWXTvmZSzOCJwu6D7gGAWhnnG-hvNluyQzZYoufuu9FzddT9Ns4nXoRvM5_uieT_DT0zN5TR2uJJGZOetE8cmquivqUhakYhEfDumKq_GcbnF4LqKDdv',
        keys: {
          p256dh:
            'BPLDw0xaRTUwR-ykrs2fep6yyiq1WvNpdTTcdgkIMSjbMVDc5lVOmRlEyPF2g2b462aTlj3ohe7JOPHL1PgZN18',
          auth: 'r_NNT2U-l652OvZyMNvZ4g',
        },
      },
      "{ title: 'test', body: 'test' }"
    )
    .then(function () {
      res.status(200).send('subscribe');
      return;
    })
    .catch((err) => {
      console.error('Unable to send welcome push notification', err);
      res.status(500).send('subscription not possible');
      return;
    });
});

app.post('/push/unsubscribe', function (req, res) {
  const subscription = {
    endpoint: req.body.endpoint,
  };
  fs.readFile('db.json', function (err, data) {
    var json = JSON.parse(data);
    let existedSub = json.findIndex(
      (el) => el?.endpoint === subscription.endpoint
    );

    if (existedSub > -1) {
      json.splice(existedSub, 1);
      fs.writeFile('db.json', JSON.stringify(json), function (err) {
        if (err) throw err;
        console.log('The "data to append" was appended to file!');
        res.send('done');
      });
    } else {
      res.status(404).send('Soubscription not found');
    }
  });
});

app.post('/push/all', (req, res) => {
  console.log(req.body);
  fs.readFile('db.json', function (err, data) {
    var json = JSON.parse(data);
    const payload = JSON.stringify({
      title: req?.body?.title || 'Default title',
      body: req?.body?.body || 'Default body',
    });
    json.map((item) => {
      webpush
        .sendNotification(item, payload, { TTL: 1 })
        .then(function () {
          return;
        })
        .catch((err) => {
          console.error('Unable to send  push notification', err);
          res.status(500).send('subscription not possible');
          return;
        });
    });
  });
  res.send();
});
