/**
 * Ritual — Habit Tracker
 * Service Worker
 *
 * Strategy:
 *  - App-shell (HTML/CSS/JS/icons/manifest) is precached on install.
 *  - Navigation requests use Network First (fresh content when online,
 *    cached shell / offline page when not).
 *  - Static assets (css, js, images, fonts) use Cache First for speed.
 *  - Old caches are purged on activate so updates roll out cleanly.
 */

// Bump this version string on every deploy that changes cached files.
// Because the filename never changes, browsers always re-check sw.js for
// updates, and a version bump here is what triggers a fresh install/activate.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `ritual-cache-${CACHE_VERSION}`;
const FONT_CACHE_NAME = `ritual-fonts-${CACHE_VERSION}`;

const OFFLINE_URL = 'offline.html';

// Core app shell — everything needed for the app to boot and render offline.
const APP_SHELL = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'css/style.css',
  'js/icons.js',
  'js/storage.js',
  'js/theme.js',
  'js/dateutils.js',
  'js/statistics.js',
  'js/ui.js',
  'js/app.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'favicon.ico'
];

// ---------- INSTALL ----------
// Precache the app shell. skipWaiting() lets a new SW activate immediately
// instead of waiting for all tabs to close, which is what makes updates
// roll out automatically the next time the app loads.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ---------- ACTIVATE ----------
// Remove any caches from previous versions and take control of open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== FONT_CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests; let everything else (POST etc.) pass through.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests (address bar load, link click, reload) -> Network First.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Google Fonts (cross-origin) -> Cache First, runtime cached.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE_NAME));
    return;
  }

  // Same-origin static assets (css, js, images, icons, manifest) -> Cache First.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }
});

// ---------- STRATEGIES ----------

/**
 * Cache First: serve from cache when available, otherwise fetch from the
 * network and store a copy for next time. Ideal for static assets that
 * rarely change and benefit from instant, offline-capable loading.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // No cache, no network — nothing we can do for this asset.
    return cached || Response.error();
  }
}

/**
 * Network First: try the network for the freshest content; fall back to
 * the cached shell, and finally to the offline page if nothing is cached.
 * Ideal for navigation/HTML so users always get the latest deploy when online.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const shell = await caches.match('index.html');
    if (shell) return shell;

    return caches.match(OFFLINE_URL);
  }
}

// ---------- MESSAGE ----------
// Allows the page to request an immediate activation of a waiting SW
// (used by the "update available" flow if the UI chooses to prompt).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
