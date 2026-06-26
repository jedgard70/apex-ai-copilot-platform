const CACHE = 'apex-ai-v3'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/apex-global-logo.png',
]

// Install: cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Never cache API calls, Supabase requests, or non-GET
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('supabase') ||
      request.method !== 'GET') {
    return
  }

  // Network-first for navigation (HTML)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(resp => {
          // Update cache with fresh copy
          const clone = resp.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return resp
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return resp
      })
    })
  )
})
