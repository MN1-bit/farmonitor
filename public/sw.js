// 농도원 목장 모니터 — Service Worker (Web Push + Offline Cache)

const CACHE_NAME = 'farmonitor-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/tokens.css',
    '/aurora-vfx.css',
    '/app.js',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json',
];

// ─── Install: 정적 자산 캐시 ─────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] 정적 자산 캐싱');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── Activate: 이전 캐시 정리 ────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// ─── Fetch: Network-first (API), Cache-first (static) ──
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API 요청은 항상 네트워크 우선
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 정적 자산은 캐시 우선, 실패 시 네트워크
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // 성공한 응답 캐시 업데이트
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});

// ─── Push: 알림 표시 ─────────────────────────────
self.addEventListener('push', (event) => {
    let data = { title: '농도원 목장 모니터', body: '알림' };

    try {
        data = event.data.json();
    } catch {
        data.body = event.data?.text() || '새 알림';
    }

    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'farmonitor-alert',
        renotify: true,
        requireInteraction: true,
        data: data.data || {},
        actions: [
            { action: 'open', title: '📱 앱 열기' },
            { action: 'dismiss', title: '닫기' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ─── Notification Click ─────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    // 취소 물량 링크가 있으면 해당 페이지로, 없으면 앱으로
    const slots = event.notification.data?.slots;
    const firstLink = slots?.[0]?.link;
    const url = firstLink || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // 이미 열린 탭이 있으면 포커스
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin)) {
                    client.focus();
                    return;
                }
            }
            // 없으면 새 탭
            return clients.openWindow(url);
        })
    );
});
