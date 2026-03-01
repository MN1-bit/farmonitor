// 농도원 목장 모니터 — 프론트엔드 로직

const API = '';
let selectedMonth = getCurrentMonth();
let monitoredMonths = [];

function getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(ym) {
    return `${ym.substring(0, 4)}년 ${parseInt(ym.substring(4))}월`;
}

function shiftMonth(ym, delta) {
    const y = parseInt(ym.substring(0, 4));
    const m = parseInt(ym.substring(4)) - 1 + delta;
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
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
        const running = monitor.isRunning ? '🟢 모니터링 중' : '🔴 중지';
        const tg = monitor.telegramActive ? '📱 연결' : '📱 미연결';
        const count = monitor.checkCount || 0;
        const time = monitor.lastCheckTime
            ? new Date(monitor.lastCheckTime).toLocaleTimeString('ko-KR')
            : '-';
        el.textContent = `${running} | ${tg} | 체크 #${count} | 마지막: ${time}`;

        document.getElementById('telegram-status').textContent =
            monitor.telegramActive ? '✅ 텔레그램 봇 연결됨' : '⚠️ 텔레그램 미설정 (.env 확인)';
    } catch {
        document.getElementById('monitor-status').textContent = '⚠️ 서버 연결 실패';
    }
}

// ─── 설정 ─────────────────────────────

async function loadSettings() {
    const { settings } = await apiGet('/api/settings');
    monitoredMonths = settings.targetMonths || [];
    renderMonthTags();
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
    renderMonthTags();
}

function renderMonthTags() {
    const el = document.getElementById('month-tags');
    if (monitoredMonths.length === 0) {
        el.innerHTML = '<span style="color:#666;font-size:0.8rem">모니터링 대상 월을 추가하세요</span>';
        return;
    }
    el.innerHTML = monitoredMonths.map(m =>
        `<span class="tag active" onclick="toggleMonth('${m}')">${formatMonth(m)} <span class="remove">×</span></span>`
    ).join('');
}

// ─── 캘린더 ───────────────────────────

async function renderCalendar(ym) {
    const el = document.getElementById('calendar-view');
    el.innerHTML = '<div style="text-align:center;color:#666;padding:20px">로딩중...</div>';

    try {
        const { slots } = await apiGet(`/api/status?month=${ym}`);

        if (!slots || slots.length === 0) {
            // 캐시 없으면 실시간 조회
            const fetched = await apiGet(`/api/fetch?month=${ym}`);
            renderCalendarGrid(el, fetched.slots, ym);
        } else {
            renderCalendarGrid(el, slots, ym);
        }
    } catch {
        el.innerHTML = '<div style="color:#ef5350">조회 실패</div>';
    }
}

function renderCalendarGrid(container, slots, ym) {
    if (!slots || slots.length === 0) {
        container.innerHTML = '<div style="color:#666;text-align:center;padding:20px">데이터 없음</div>';
        return;
    }

    const headers = ['일', '월', '화', '수', '목', '금', '토'];
    let html = '<div class="cal-grid">';
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

    html += '</div>';
    container.innerHTML = html;
}

// ─── 이력 ─────────────────────────────

async function loadHistory() {
    try {
        const { history } = await apiGet('/api/history?limit=20');
        const el = document.getElementById('history-list');

        if (!history || history.length === 0) {
            el.innerHTML = '<div style="color:#666;font-size:0.8rem;padding:8px">아직 변경 이력이 없습니다</div>';
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
        document.getElementById('history-list').innerHTML = '<div style="color:#666">조회 실패</div>';
    }
}

// ─── Web Push ─────────────────────────

let pushSubscription = null;

async function initPushNotifications() {
    const pushStatus = document.getElementById('push-status');
    const pushBtn = document.getElementById('btn-push-toggle');

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        pushStatus.textContent = '❌ 이 브라우저는 Push 미지원';
        pushBtn.style.display = 'none';
        return;
    }

    try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const existing = await reg.pushManager.getSubscription();

        if (existing) {
            pushSubscription = existing;
            pushStatus.textContent = '✅ 푸시 알림 활성화됨';
            pushBtn.textContent = '푸시 알림 끄기';
        } else {
            pushStatus.textContent = '⚠️ 푸시 알림 미활성화';
            pushBtn.textContent = '푸시 알림 켜기';
        }
    } catch {
        pushStatus.textContent = '❌ Service Worker 등록 실패';
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
        pushStatus.textContent = '⚠️ 푸시 알림 미활성화';
        pushBtn.textContent = '푸시 알림 켜기';
    } else {
        // 구독 등록
        try {
            const { key } = await apiGet('/api/push/vapid-key');
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: key,
            });
            await apiPost('/api/push/subscribe', sub.toJSON());
            pushSubscription = sub;
            pushStatus.textContent = '✅ 푸시 알림 활성화됨';
            pushBtn.textContent = '푸시 알림 끄기';
        } catch (err) {
            pushStatus.textContent = `❌ 권한 거부됨 (${err.message})`;
        }
    }
}

// ─── 이벤트 바인딩 ────────────────────

function init() {
    // 월 네비게이션
    document.getElementById('current-month-label').textContent = formatMonth(selectedMonth);

    document.getElementById('prev-month').addEventListener('click', () => {
        selectedMonth = shiftMonth(selectedMonth, -1);
        document.getElementById('current-month-label').textContent = formatMonth(selectedMonth);
        renderCalendar(selectedMonth);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        selectedMonth = shiftMonth(selectedMonth, +1);
        document.getElementById('current-month-label').textContent = formatMonth(selectedMonth);
        renderCalendar(selectedMonth);
    });

    // 현재 보는 월 추가/제거
    document.getElementById('current-month-label').addEventListener('click', () => {
        toggleMonth(selectedMonth);
    });

    // 즉시 체크
    document.getElementById('btn-check-now').addEventListener('click', async () => {
        const btn = document.getElementById('btn-check-now');
        btn.textContent = '⏳ 체크 중...';
        btn.disabled = true;
        await apiPost('/api/check-now');
        btn.textContent = '🔍 즉시 체크';
        btn.disabled = false;
        renderCalendar(selectedMonth);
        refreshStatus();
        loadHistory();
    });

    // 실시간 조회
    document.getElementById('btn-fetch').addEventListener('click', () => {
        renderCalendar(selectedMonth);
    });

    // 텔레그램 테스트
    document.getElementById('btn-telegram-test').addEventListener('click', async () => {
        const btn = document.getElementById('btn-telegram-test');
        btn.textContent = '전송 중...';
        const res = await apiPost('/api/telegram-test');
        btn.textContent = res.ok ? '✅ 전송 완료!' : '❌ 전송 실패';
        setTimeout(() => btn.textContent = '텔레그램 테스트', 2000);
    });

    // 푸시 테스트
    document.getElementById('btn-push-test').addEventListener('click', async () => {
        const btn = document.getElementById('btn-push-test');
        btn.textContent = '전송 중...';
        const res = await apiPost('/api/push/test');
        btn.textContent = res.ok && res.sent > 0 ? '✅ 전송 완료!' : '❌ 전송 실패 (구독 필요)';
        setTimeout(() => btn.textContent = '푸시 테스트', 2000);
    });

    // 푸시 토글
    document.getElementById('btn-push-toggle').addEventListener('click', togglePush);

    // 초기 로드
    refreshStatus();
    loadSettings();
    renderCalendar(selectedMonth);
    loadHistory();
    initPushNotifications();

    // 30초마다 자동 갱신
    setInterval(() => {
        refreshStatus();
        renderCalendar(selectedMonth);
    }, 30000);
}

// 글로벌 함수 노출
window.toggleMonth = toggleMonth;

document.addEventListener('DOMContentLoaded', init);
