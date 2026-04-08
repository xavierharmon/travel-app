// sw.js — Xavier & Kylie's Adventures PWA Service Worker
const CACHE_NAME = "adventures-v1";

// Core app shell files to cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/logo.png",
  "/memorieslogo.png",
  "/favicon.svg",
];

// Install: cache the app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for assets
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go network-first for Google APIs and external resources
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("espncdn.com") ||
    url.hostname.includes("accounts.google.com") ||
    url.hostname.includes("maps.googleapis.com")
  ) {
    return; // let browser handle it normally
  }

  // For navigation requests (HTML), network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For app assets (JS, CSS, images), cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && response.type !== "opaque") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});