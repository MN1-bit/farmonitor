// 농도원 목장 모니터 — Service Worker (Web Push)

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
