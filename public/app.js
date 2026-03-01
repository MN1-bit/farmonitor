// 농도원 목장 모니터 — 프론트엔드 로직

const API = '';
let monitoredMonths = [];

// ─── 유틸리티 ─────────────────────────

function getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(ym) {
    return `${ym.substring(0, 4)}년 ${parseInt(ym.substring(4))}월`;
}

function formatMonthShort(ym) {
    return `${parseInt(ym.substring(4))}월`;
}

/** 현재월부터 N개월 후까지의 YYYYMM 배열 */
function getMonthRange(count) {
    const months = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
}

// ─── API 호출 ─────────────────────────

async function apiGet(path) {
    const res = await fetch(`${API}${path}`);
    return res.json();
}
async function apiPost(path, body) {
    const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

// ─── 상태 표시 ────────────────────────

async function refreshStatus() {
    try {
        const { monitor } = await apiGet('/api/status');
        const el = document.getElementById('monitor-status');
        const lastUpdatedEl = document.getElementById('last-updated');
        const dot = monitor.isRunning
            ? '<span class="pulse-dot pulse-dot--active"></span>'
            : '<span class="pulse-dot pulse-dot--stopped"></span>';
        const running = monitor.isRunning ? '모니터링 중' : '중지';
        const tgDot = monitor.telegramActive
            ? '<span class="pulse-dot pulse-dot--active"></span>'
            : '<span class="pulse-dot pulse-dot--dim"></span>';
        const tg = monitor.telegramActive ? '연결' : '미연결';
        const count = monitor.checkCount || 0;
        const time = monitor.lastCheckTime
            ? new Date(monitor.lastCheckTime).toLocaleTimeString('ko-KR')
            : '-';
        const interval = monitor.intervalSeconds || 10;
        el.innerHTML = `${dot}${running} | ${tgDot}${tg} | 체크 #${count} | ✅Polling : ${interval}초간격`;
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = `마지막: ${time}`;
        }
    } catch {
        document.getElementById('monitor-status').textContent = '⚠️ 서버 연결 실패';
    }
}

// ─── 텔레그램 상태 ────────────────────

async function refreshTelegramStatus() {
    try {
        const data = await apiGet('/api/telegram/status');
        const statusEl = document.getElementById('telegram-status');
        const connectBtn = document.getElementById('btn-telegram-connect');
        const testBtn = document.getElementById('btn-telegram-test');
        const shortcutBtn = document.getElementById('btn-tg-shortcut');

        if (data.botLink) {
            connectBtn.href = data.botLink;
            if (shortcutBtn) shortcutBtn.href = data.botLink;
        }

        if (data.connected) {
            statusEl.textContent = `✅ 연결됨 (ID: ${data.maskedChatId})`;
            statusEl.className = 'connect-status connected';
            connectBtn.textContent = '💬 봇 채팅 열기';
            testBtn.disabled = false;
            if (shortcutBtn) shortcutBtn.textContent = '📱 텔레그램';
        } else if (data.botUsername) {
            statusEl.textContent = '⚠️ 봇에게 /start를 보내주세요';
            statusEl.className = 'connect-status disconnected';
            connectBtn.textContent = '💬 봇 채팅 열기';
            testBtn.disabled = true;
            if (shortcutBtn) shortcutBtn.textContent = '📱 텔레그램';
        } else {
            statusEl.textContent = '❌ 텔레그램 봇 미설정 (.env 확인)';
            statusEl.className = 'connect-status disconnected';
            connectBtn.style.display = 'none';
            testBtn.disabled = true;
            if (shortcutBtn) shortcutBtn.style.display = 'none';
        }
    } catch {
        // ignore
    }
}

// ─── 다중 월 선택 ─────────────────────

async function loadSettings() {
    const { settings } = await apiGet('/api/settings');
    monitoredMonths = settings.targetMonths || [];
    renderMonthGrid();
    renderAllCalendars();
}

async function toggleMonth(ym) {
    const idx = monitoredMonths.indexOf(ym);
    if (idx >= 0) {
        monitoredMonths.splice(idx, 1);
    } else {
        monitoredMonths.push(ym);
        monitoredMonths.sort();
    }
    await apiPost('/api/settings', { targetMonths: monitoredMonths });
    renderMonthGrid();
    renderAllCalendars();
}

function renderMonthGrid() {
    const el = document.getElementById('month-grid');
    const range = getMonthRange(7); // 현재월 ~ +6개월

    el.innerHTML = range.map(ym => {
        const isActive = monitoredMonths.includes(ym);
        const isCurrent = ym === getCurrentMonth();
        const classes = ['month-btn'];
        if (isActive) classes.push('active');
        if (isCurrent) classes.push('current');

        const yearLabel = parseInt(ym.substring(0, 4)) !== new Date().getFullYear()
            ? `<span class="month-btn-year">${ym.substring(2, 4)}</span>` : '';

        return `<button class="${classes.join(' ')}" onclick="toggleMonth('${ym}')">
            ${yearLabel}${formatMonthShort(ym)}
        </button>`;
    }).join('');
}

// ─── 캘린더 ───────────────────────────

async function renderAllCalendars() {
    const container = document.getElementById('calendar-view');

    if (monitoredMonths.length === 0) {
        container.innerHTML = '<div class="empty-state">위에서 모니터링할 월을 선택하세요</div>';
        return;
    }

    container.innerHTML = '<div class="loading-state">로딩중...</div>';

    const fragments = [];

    for (const ym of monitoredMonths) {
        try {
            const { slots } = await apiGet(`/api/status?month=${ym}`);
            fragments.push(buildCalendarSection(ym, slots));
        } catch {
            fragments.push(`<div class="calendar-section">
                <h3 class="calendar-month-header">${formatMonth(ym)}</h3>
                <div class="error-state">조회 실패</div>
            </div>`);
        }
    }

    container.innerHTML = fragments.join('');
}

function buildCalendarSection(ym, slots) {
    let html = `<div class="calendar-section">`;
    html += `<h3 class="calendar-month-header">${formatMonth(ym)}</h3>`;

    if (!slots || slots.length === 0) {
        html += '<div class="empty-state">데이터 없음 — 즉시 체크를 실행하세요</div>';
        html += '</div>';
        return html;
    }

    const headers = ['일', '월', '화', '수', '목', '금', '토'];
    html += '<div class="cal-grid">';
    html += headers.map(h => `<div class="cal-header">${h}</div>`).join('');

    // 첫날 요일 offset
    const firstSlot = slots[0];
    if (firstSlot) {
        for (let i = 0; i < firstSlot.dayIndex; i++) {
            html += '<div class="cal-cell"></div>';
        }
    }

    slots.forEach(s => {
        const dayNum = parseInt(s.date.split('-')[2]);
        let cls = 'cal-cell';
        let statusText = '';

        if (s.status === '마감') {
            cls += ' closed';
            statusText = '마감';
        } else if (s.status === '가능') {
            cls += ' available';
            statusText = '가능!';
        } else {
            cls += ' not-operating';
        }

        if (s.dayIndex === 0) cls += ' sunday';
        if (s.dayIndex === 6) cls += ' saturday';

        const content = s.status === '가능' && s.link
            ? `<a href="${s.link}" target="_blank"><span class="day-num">${dayNum}</span><span class="day-status">${statusText}</span></a>`
            : `<span class="day-num">${dayNum}</span><span class="day-status">${statusText}</span>`;

        html += `<div class="${cls}">${content}</div>`;
    });

    html += '</div></div>';
    return html;
}

// ─── 이력 ─────────────────────────────

async function loadHistory() {
    try {
        const { history } = await apiGet('/api/history?limit=20');
        const el = document.getElementById('history-list');

        if (!history || history.length === 0) {
            el.innerHTML = '<div class="empty-state">아직 변경 이력이 없습니다</div>';
            return;
        }

        el.innerHTML = history.map(h => {
            const time = new Date(h.timestamp).toLocaleString('ko-KR');
            const slotTexts = (h.slots || []).map(s => `${s.date}(${s.day})`).join(', ');
            return `<div class="history-item">
                <div class="time">${time}</div>
                <div class="slots">🟢 ${slotTexts}</div>
            </div>`;
        }).join('');
    } catch {
        document.getElementById('history-list').innerHTML = '<div class="error-state">조회 실패</div>';
    }
}

// ─── Web Push ─────────────────────────

let pushSubscription = null;
let deferredInstallPrompt = null;

// PWA 설치 프롬프트 캡처
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
});

async function initPushNotifications() {
    const pushStatus = document.getElementById('push-status');
    const pushBtn = document.getElementById('btn-push-toggle');

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (pushStatus) pushStatus.textContent = '❌ 미지원 브라우저';
        if (pushBtn) pushBtn.style.display = 'none';
        return;
    }

    try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const existing = await reg.pushManager.getSubscription();

        if (existing) {
            pushSubscription = existing;
            if (pushStatus) pushStatus.textContent = '✅ 푸시 알림 활성화됨';
            if (pushBtn) pushBtn.textContent = '🔔 푸시알림 끄기';
        } else {
            if (pushStatus) pushStatus.textContent = '⚠️ 푸시 알림 비활성';
            if (pushBtn) pushBtn.textContent = '🔔 푸시알림 켜기';
        }
    } catch {
        if (pushStatus) pushStatus.textContent = '❌ Service Worker 등록 실패';
    }
}

async function togglePush() {
    const pushStatus = document.getElementById('push-status');
    const pushBtn = document.getElementById('btn-push-toggle');

    if (pushSubscription) {
        // 구독 해제
        await apiPost('/api/push/unsubscribe', { endpoint: pushSubscription.endpoint });
        await pushSubscription.unsubscribe();
        pushSubscription = null;
        if (pushStatus) pushStatus.textContent = '⚠️ 푸시 알림 비활성';
        if (pushBtn) pushBtn.textContent = '🔔 푸시알림 켜기';
    } else {
        // PWA 설치 프롬프트가 있으면 먼저 홈화면 추가 안내
        if (deferredInstallPrompt) {
            const yes = confirm(
                '📱 홈 화면에 추가하면 앱을 닫아도 알림을 받을 수 있습니다.\n\n추가하시겠습니까?'
            );
            if (yes) {
                deferredInstallPrompt.prompt();
                const { outcome } = await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                if (outcome === 'dismissed') {
                    // 설치 거부해도 푸시 구독은 진행
                }
            }
        } else if (isIOS() && !isStandalone()) {
            // iOS Safari: 수동 안내
            alert(
                '📱 홈 화면에 추가하면 앱을 닫아도 알림을 받을 수 있습니다.\n\n' +
                'Safari 하단의 공유 버튼(⬆️) → "홈 화면에 추가"를 눌러주세요.'
            );
        }

        // 푸시 구독 진행
        try {
            const { key } = await apiGet('/api/push/vapid-key');
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: key,
            });
            await apiPost('/api/push/subscribe', sub.toJSON());
            pushSubscription = sub;
            if (pushStatus) pushStatus.textContent = '✅ 푸시 알림 활성화됨';
            if (pushBtn) pushBtn.textContent = '🔔 푸시알림 끄기';
        } catch (err) {
            if (pushStatus) pushStatus.textContent = `❌ 권한 거부 (${err.message})`;
        }
    }
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
}

// ─── 이벤트 바인딩 ────────────────────

function init() {
    // 텔레그램 등록 숏컷 (설정 저장 후 봇 링크 열기)
    document.getElementById('btn-tg-shortcut')?.addEventListener('click', async (e) => {
        // 현재 선택된 월 설정을 먼저 저장
        if (monitoredMonths.length > 0) {
            await apiPost('/api/settings', { targetMonths: monitoredMonths });
        }
        // href는 refreshTelegramStatus에서 설정됨 → 기본 링크 동작 허용
    });

    // 푸시 알림 토글 (설정 저장 후 구독)
    document.getElementById('btn-push-toggle')?.addEventListener('click', async () => {
        // 현재 선택된 월 설정을 먼저 저장
        if (monitoredMonths.length > 0) {
            await apiPost('/api/settings', { targetMonths: monitoredMonths });
        }
        await togglePush();
    });

    // 텔레그램 테스트
    document.getElementById('btn-telegram-test').addEventListener('click', async () => {
        const btn = document.getElementById('btn-telegram-test');
        btn.textContent = '전송 중...';
        btn.disabled = true;
        const res = await apiPost('/api/telegram-test');
        btn.textContent = res.ok ? '✅ 전송 완료!' : `❌ ${res.error || '전송 실패'}`;
        setTimeout(() => {
            btn.textContent = '테스트 메시지';
            btn.disabled = false;
        }, 2000);
    });

    // Mock 알림 (4월 5일 취소 물량 시뮬레이션)
    document.getElementById('btn-mock-alert')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-mock-alert');
        btn.textContent = '전송 중...';
        btn.disabled = true;
        const res = await apiPost('/api/mock-alert');
        btn.textContent = res.ok ? '✅ 전송 완료!' : '❌ 실패';
        setTimeout(() => {
            btn.textContent = 'Mock 알림';
            btn.disabled = false;
        }, 2000);
    });

    // Full Log 토글
    let logVisible = false;
    document.getElementById('btn-full-log')?.addEventListener('click', async () => {
        const logEl = document.getElementById('server-log');
        const historyEl = document.getElementById('history-list');
        const btn = document.getElementById('btn-full-log');

        if (logVisible) {
            logEl.style.display = 'none';
            historyEl.style.display = '';
            btn.textContent = 'Full Log';
            logVisible = false;
        } else {
            btn.textContent = '로딩...';
            const { logs } = await apiGet('/api/logs');
            logEl.innerHTML = [...logs].reverse().map(e => {
                const t = new Date(e.t).toLocaleTimeString('ko-KR');
                const cls = e.l === 'error' ? 'log-error' : e.l === 'warn' ? 'log-warn' : '';
                return `<div class="log-line ${cls}"><span class="log-time">${t}</span>${e.m}</div>`;
            }).join('');
            logEl.style.display = 'block';
            historyEl.style.display = 'none';
            btn.textContent = '변경 이력';
            logEl.scrollTop = 0;
            logVisible = true;
        }
    });

    // 푸시 테스트

    // 초기 로드
    refreshStatus();
    refreshTelegramStatus();
    loadSettings();
    renderAllCalendars(); // Assuming renderCalendar(selectedMonth) was a typo and should be renderAllCalendars()
    loadHistory();
    if (document.getElementById('push-status')) initPushNotifications();

    // 10초마다 자동 갱신
    setInterval(() => {
        refreshStatus();
        renderAllCalendars();
    }, 10000);

    // 10초마다 텔레그램 상태 체크 (연결 대기 시)
    setInterval(refreshTelegramStatus, 10000);
}

// 글로벌 함수 노출
window.toggleMonth = toggleMonth;

document.addEventListener('DOMContentLoaded', init);
