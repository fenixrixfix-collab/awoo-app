// This file is intentionally minimal - OneSignal handles push notifications
// via OneSignalSDKWorker.js

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
