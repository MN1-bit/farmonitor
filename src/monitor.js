import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReservationStatus } from './scraper.js';
import { sendAlert, isTelegramActive } from './telegram.js';
import { sendPushAlert, isWebPushActive } from './webpush.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

let cronJob = null;
let isChecking = false;
let lastCheckTime = null;
let lastCheckResult = null;
let checkCount = 0;

/**
 * data 디렉토리 초기화
 */
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch { /* 이미 존재 */ }
}

/**
 * 이전 상태 로드
 */
async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

/**
 * 현재 상태 저장
 */
async function saveState(state) {
    await ensureDataDir();
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * 변경 이력 로드
 */
export async function loadHistory() {
    try {
        const data = await fs.readFile(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * 변경 이력에 추가
 */
async function appendHistory(entry) {
    const history = await loadHistory();
    history.unshift(entry); // 최신순
    // 최대 500건 유지
    if (history.length > 500) history.length = 500;
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * 설정 로드
 */
export async function loadSettings() {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // 기본 설정: 현재 월과 다음 달
        const now = new Date();
        const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = `${nextDate.getFullYear()}${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

        return {
            targetMonths: [currentMonth, nextMonth],
            intervalSeconds: 10,
        };
    }
}

/**
 * 설정 저장
 */
export async function saveSettings(settings) {
    await ensureDataDir();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * 상태 변화 감지 (마감 → 가능)
 */
function detectChanges(currentSlots, previousSlots) {
    const prevMap = {};
    if (previousSlots) {
        previousSlots.forEach(s => { prevMap[s.date] = s.status; });
    }

    const newlyAvailable = [];
    currentSlots.forEach(slot => {
        const prevStatus = prevMap[slot.date];
        // 마감이었던 날짜가 가능으로 바뀐 경우 = 취소 물량!
        if (prevStatus === '마감' && slot.status === '가능') {
            newlyAvailable.push(slot);
        }
    });

    return newlyAvailable;
}

/**
 * 단일 체크 수행
 */
export async function performCheck() {
    if (isChecking) {
        console.log('⏳ 이미 체크 진행 중...');
        return null;
    }

    isChecking = true;
    checkCount++;
    const checkStart = Date.now();

    try {
        const settings = await loadSettings();
        const previousState = await loadState();
        const currentState = {};
        const allNewlyAvailable = [];

        console.log(`\n🔍 [#${checkCount}] 모니터링 체크 시작 — ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
        console.log(`   대상: ${settings.targetMonths.join(', ')}`);

        for (const month of settings.targetMonths) {
            try {
                const slots = await getReservationStatus(month);
                currentState[month] = slots;

                // 상태 변화 감지
                const changes = detectChanges(slots, previousState[month]);
                if (changes.length > 0) {
                    allNewlyAvailable.push(...changes);
                    console.log(`   🟢 ${month}: ${changes.length}건의 취소 물량 감지!`);
                }

                // 요약 로그
                const counts = { '마감': 0, '가능': 0, '미운영': 0 };
                slots.forEach(s => counts[s.status]++);
                console.log(`   📅 ${month}: 마감 ${counts['마감']} | 가능 ${counts['가능']} | 미운영 ${counts['미운영']}`);

            } catch (err) {
                console.error(`   ❌ ${month} 체크 실패: ${err.message}`);
            }
        }

        // 상태 저장
        await saveState(currentState);

        // 새로운 취소 물량이 있으면 알림
        if (allNewlyAvailable.length > 0) {
            console.log(`\n🚨 총 ${allNewlyAvailable.length}건의 취소 물량 감지!`);

            // 이력에 기록
            await appendHistory({
                timestamp: new Date().toISOString(),
                type: 'cancellation_detected',
                slots: allNewlyAvailable,
            });

            // 텔레그램 알림
            if (isTelegramActive()) {
                await sendAlert(allNewlyAvailable);
            }

            // Web Push 알림
            if (isWebPushActive()) {
                await sendPushAlert(allNewlyAvailable);
            }
        }

        const elapsed = Date.now() - checkStart;
        lastCheckTime = new Date().toISOString();
        lastCheckResult = {
            success: true,
            checkCount,
            elapsed: `${elapsed}ms`,
            months: settings.targetMonths,
            newlyAvailable: allNewlyAvailable.length,
            state: Object.fromEntries(
                Object.entries(currentState).map(([month, slots]) => {
                    const counts = { '마감': 0, '가능': 0, '미운영': 0 };
                    slots.forEach(s => counts[s.status]++);
                    return [month, { total: slots.length, ...counts }];
                })
            ),
        };

        console.log(`✅ 체크 완료 (${elapsed}ms)\n`);

        return { currentState, newlyAvailable: allNewlyAvailable };

    } catch (err) {
        console.error('❌ 체크 오류:', err.message);
        lastCheckResult = { success: false, error: err.message };
        return null;
    } finally {
        isChecking = false;
    }
}

/**
 * 모니터링 시작
 * @param {number} intervalSeconds - 체크 간격 (초)
 */
export async function startMonitoring(intervalSeconds = 10) {
    await ensureDataDir();

    // 기존 작업 중지
    if (cronJob) {
        cronJob.stop();
    }

    // 즉시 1회 실행
    console.log('🚀 모니터링 시작 — 첫 번째 체크 실행');
    await performCheck();

    // 크론 스케줄 (매 N초마다)
    // node-cron은 최소 1분 단위이므로, 60초 미만은 setInterval 사용
    if (intervalSeconds < 60) {
        const intervalId = setInterval(() => performCheck(), intervalSeconds * 1000);
        cronJob = { stop: () => clearInterval(intervalId) };
    } else {
        const cronExpression = `*/${Math.max(1, Math.floor(intervalSeconds / 60))} * * * *`;
        cronJob = cron.schedule(cronExpression, () => performCheck());
    }

    console.log(`⏰ ${intervalSeconds}초 간격으로 모니터링 중...`);
}

/**
 * 모니터링 중지
 */
export function stopMonitoring() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log('⏹️  모니터링 중지');
    }
}

/**
 * 모니터링 상태 조회
 */
export function getMonitorStatus() {
    return {
        isRunning: cronJob !== null,
        isChecking,
        lastCheckTime,
        lastCheckResult,
        checkCount,
        telegramActive: isTelegramActive(),
    };
}

/**
 * 특정 월의 현재 상태 조회
 */
export async function getMonthStatus(yearMonth) {
    try {
        const state = await loadState();
        return state[yearMonth] || null;
    } catch {
        return null;
    }
}
