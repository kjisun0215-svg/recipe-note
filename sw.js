const CACHE_NAME = 'recipe-note-v1';
const ASSETS = [
  '/recipe-note/',
  '/recipe-note/index.html',
  '/recipe-note/style.css',
  '/recipe-note/script.js',
  '/recipe-note/manifest.json',
  '/recipe-note/icon-192.png',
  '/recipe-note/icon-512.png',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 오래된 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // API 요청은 캐시 안 함
  if (e.request.url.includes('groq.com') ||
      e.request.url.includes('allorigins') ||
      e.request.url.includes('googleapis')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 유효한 응답이면 캐시에 저장
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/recipe-note/index.html'));
    })
  );
});
