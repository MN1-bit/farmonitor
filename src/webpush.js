import webpush from 'web-push';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBS_FILE = path.join(__dirname, '..', 'data', 'push-subscriptions.json');

let isConfigured = false;

/**
 * Web Push 초기화
 */
export function initWebPush(publicKey, privateKey, email) {
    if (!publicKey || !privateKey) {
        console.warn('⚠️  VAPID 키가 설정되지 않았습니다. Web Push 비활성화.');
        return false;
    }

    webpush.setVapidDetails(email || 'mailto:admin@farmonitor.local', publicKey, privateKey);
    isConfigured = true;
    console.log('✅ Web Push 설정 완료');
    return true;
}

export function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || '';
}

export function isWebPushActive() {
    return isConfigured;
}

/**
 * 구독 목록 로드
 */
async function loadSubscriptions() {
    try {
        const data = await fs.readFile(SUBS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * 구독 목록 저장
 */
async function saveSubscriptions(subs) {
    await fs.mkdir(path.dirname(SUBS_FILE), { recursive: true });
    await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
}

/**
 * 새 구독 추가
 */
export async function addSubscription(subscription) {
    const subs = await loadSubscriptions();
    // 중복 방지
    const exists = subs.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
        subs.push(subscription);
        await saveSubscriptions(subs);
        console.log(`📲 Web Push 구독 추가 (총 ${subs.length}개)`);
    }
    return subs.length;
}

/**
 * 구독 제거
 */
export async function removeSubscription(endpoint) {
    let subs = await loadSubscriptions();
    subs = subs.filter(s => s.endpoint !== endpoint);
    await saveSubscriptions(subs);
    return subs.length;
}

/**
 * 모든 구독자에게 푸시 알림 전송
 */
export async function sendPushNotification(title, body, data = {}) {
    if (!isConfigured) return 0;

    const subs = await loadSubscriptions();
    if (subs.length === 0) return 0;

    const payload = JSON.stringify({
        title,
        body,
        icon: '🐄',
        data,
        timestamp: Date.now(),
    });

    let sent = 0;
    const expired = [];

    for (const sub of subs) {
        try {
            await webpush.sendNotification(sub, payload);
            sent++;
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                expired.push(sub.endpoint);
            }
            console.error(`❌ Push 전송 실패: ${err.statusCode || err.message}`);
        }
    }

    // 만료된 구독 정리
    if (expired.length > 0) {
        const cleaned = subs.filter(s => !expired.includes(s.endpoint));
        await saveSubscriptions(cleaned);
        console.log(`🧹 만료된 구독 ${expired.length}개 정리`);
    }

    if (sent > 0) {
        console.log(`📲 Web Push ${sent}/${subs.length}건 전송 완료`);
    }

    return sent;
}

/**
 * 취소 물량 알림 (Web Push용)
 */
export async function sendPushAlert(slots) {
    const lines = slots.map(s => `${s.date}(${s.day})`).join(', ');
    return sendPushNotification(
        '🚨 농도원 예약 취소 발생!',
        `${lines} — 지금 바로 예약하세요!`,
        { type: 'cancellation', slots }
    );
}
