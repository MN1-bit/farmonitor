import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    performCheck,
    getMonitorStatus,
    getMonthStatus,
    loadHistory,
    loadSettings,
    saveSettings,
} from './monitor.js';

import { sendAlert, sendTestMessage, isTelegramActive, updateChatId, getChatId, getMaskedChatId, getBotUsername } from './telegram.js';
import { addSubscription, removeSubscription, getVapidPublicKey, isWebPushActive, sendPushNotification } from './webpush.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ──────────────────────────────────

/**
 * GET /api/status
 * 모니터링 상태 + 특정 월 예약 현황
 */
app.get('/api/status', async (req, res) => {
    try {
        const month = req.query.month;
        const monitor = getMonitorStatus();

        let slots = null;
        if (month) {
            slots = await getMonthStatus(month);
        }

        res.json({
            ok: true,
            monitor,
            month,
            slots,
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/fetch?month=YYYYMM
 * 특정 월의 예약 상태를 실시간으로 가져옴 (캐시 아님)
 */
app.get('/api/fetch', async (req, res) => {
    try {
        const month = req.query.month;
        if (!month || !/^\d{6}$/.test(month)) {
            return res.status(400).json({ ok: false, error: 'month 파라미터 필요 (YYYYMM)' });
        }

        const slots = await getReservationStatus(month);
        res.json({ ok: true, month, slots });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/history
 * 변경 이력 조회
 */
app.get('/api/history', async (req, res) => {
    try {
        const history = await loadHistory();
        const limit = parseInt(req.query.limit) || 50;
        res.json({ ok: true, history: history.slice(0, limit) });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/check-now
 * 즉시 체크 트리거
 */
app.post('/api/check-now', async (req, res) => {
    try {
        const result = await performCheck();
        res.json({
            ok: true,
            newlyAvailable: result?.newlyAvailable?.length || 0,
            result: result ? 'checked' : 'skipped (already checking)',
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/settings
 * 현재 설정 조회
 */
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await loadSettings();
        res.json({ ok: true, settings });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/settings
 * 설정 변경 (모니터링 대상 월 목록)
 */
app.post('/api/settings', async (req, res) => {
    try {
        const { targetMonths, intervalSeconds } = req.body;
        const current = await loadSettings();

        if (targetMonths && Array.isArray(targetMonths)) {
            current.targetMonths = targetMonths.filter(m => /^\d{6}$/.test(m));
        }
        if (intervalSeconds && typeof intervalSeconds === 'number' && intervalSeconds >= 10) {
            current.intervalSeconds = intervalSeconds;
        }

        await saveSettings(current);
        res.json({ ok: true, settings: current });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ─── Telegram Routes ─────────────────────────────

/**
 * GET /api/telegram/status
 * 텔레그램 봇 연결 상태 + 봇 링크
 */
app.get('/api/telegram/status', (req, res) => {
    const username = getBotUsername();
    res.json({
        ok: true,
        active: isTelegramActive(),
        connected: !!getChatId(),
        maskedChatId: getMaskedChatId(),
        botUsername: username,
        botLink: username ? `https://t.me/${username}` : null,
    });
});

/**
 * POST /api/telegram-test
 * 텔레그램 테스트 메시지 전송
 */
app.post('/api/telegram-test', async (req, res) => {
    try {
        if (!isTelegramActive()) {
            return res.json({ ok: false, error: '텔레그램 봇이 연결되지 않았습니다. 봇에게 /start를 보내주세요.' });
        }
        const result = await sendTestMessage();
        res.json({ ok: result });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/mock-alert
 * Mock 취소 알림 전송 (4월 5일 예약 가능 가정)
 */
app.post('/api/mock-alert', async (req, res) => {
    try {
        const mockSlots = [{
            date: '2026-04-05',
            day: '일',
            status: '가능',
            link: 'https://nongdowon.com/reservation',
        }];

        let tgResult = false;
        let pushResult = 0;

        if (isTelegramActive()) {
            tgResult = await sendAlert(mockSlots);
        }
        if (isWebPushActive()) {
            pushResult = await sendPushNotification(
                '🚨 농도원 목장 예약 취소 알림!',
                '🟢 2026-04-05 (일) — 예약 가능! ⚡ 빠르게 예약하세요!'
            );
        }

        console.log(`🧪 Mock 알림 전송: TG=${tgResult}, Push=${pushResult}`);
        res.json({ ok: true, telegram: tgResult, push: pushResult });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ─── Web Push Routes ─────────────────────────────

/**
 * GET /api/push/vapid-key
 * VAPID 공개키 조회 (클라이언트 구독 시 필요)
 */
app.get('/api/push/vapid-key', (req, res) => {
    res.json({ ok: true, key: getVapidPublicKey() });
});

/**
 * POST /api/push/subscribe
 * Web Push 구독 등록
 */
app.post('/api/push/subscribe', async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription?.endpoint) {
            return res.status(400).json({ ok: false, error: 'Invalid subscription' });
        }
        const count = await addSubscription(subscription);
        res.json({ ok: true, totalSubscriptions: count });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/push/unsubscribe
 * Web Push 구독 해제
 */
app.post('/api/push/unsubscribe', async (req, res) => {
    try {
        const { endpoint } = req.body;
        const count = await removeSubscription(endpoint);
        res.json({ ok: true, totalSubscriptions: count });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/push/test
 * Web Push 테스트 알림 전송
 */
app.post('/api/push/test', async (req, res) => {
    try {
        if (!isWebPushActive()) {
            return res.json({ ok: false, error: 'Web Push 미설정' });
        }
        const sent = await sendPushNotification(
            '✅ 농도원 목장 모니터',
            'Web Push 테스트 알림이 정상 동작합니다! 🐄'
        );
        res.json({ ok: true, sent });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export default app;
