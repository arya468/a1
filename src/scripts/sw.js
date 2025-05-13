const CACHE_NAME = "story-app-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles/main.css",
  "/scripts/app.js",
  "/scripts/auth.js",
  "/scripts/story.js",
  "/scripts/db.js",
  "/scripts/notification.js",
  "/public/icons/icon-192x192.png",
  "/public/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/public/icons/icon-192x192.png",
    badge: "/public/icons/icon-192x192.png",
  };

  event.waitUntil(self.registration.showNotification("Story App", options));
});
