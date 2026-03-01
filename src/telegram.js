import TelegramBot from 'node-telegram-bot-api';

let bot = null;
let chatId = null;
let botUsername = null;

/**
 * 텔레그램 봇 초기화 (polling 모드 — /start 자동 감지)
 * @param {string} token - 봇 토큰
 * @param {string} defaultChatId - 기본 Chat ID (.env에서)
 */
export function initTelegram(token, defaultChatId) {
    if (!token || token === 'your_bot_token_here') {
        console.warn('⚠️  텔레그램 봇 토큰이 설정되지 않았습니다. 알림이 비활성화됩니다.');
        console.warn('   → docs/Telegram_Bot_Setup_Guide.md 참고');
        return false;
    }

    bot = new TelegramBot(token, { polling: true });
    chatId = defaultChatId || null;

    // 봇 정보 조회 (username 확인)
    bot.getMe().then(info => {
        botUsername = info.username;
        console.log(`✅ 텔레그램 봇 연결: @${botUsername} (polling 모드)`);
    }).catch(err => {
        console.error('⚠️  봇 정보 조회 실패:', err.message);
    });

    // /start 명령 수신 → 자동으로 Chat ID 저장
    bot.onText(/\/start/, (msg) => {
        chatId = String(msg.chat.id);
        const name = msg.from.first_name || '사용자';
        console.log(`📱 텔레그램 연결됨: ${name} (Chat ID: ${getMaskedChatId()})`);

        bot.sendMessage(chatId,
            `✅ *${name}님, 연결 완료!*\n\n` +
            '🐄 농도원 목장 모니터와 연결되었습니다.\n' +
            '예약 취소 물량이 발생하면 즉시 알림을 보내드릴게요!\n\n' +
            '💡 _이 대화방을 나가지 마세요._',
            { parse_mode: 'Markdown' }
        );
    });

    // 일반 메시지 수신 시에도 Chat ID 갱신
    bot.on('message', (msg) => {
        if (!msg.text?.startsWith('/start')) {
            chatId = String(msg.chat.id);
        }
    });

    // polling 에러 핸들링
    bot.on('polling_error', (err) => {
        if (err.code !== 'ETELEGRAM' || !err.message?.includes('409')) {
            console.error('⚠️  텔레그램 polling 오류:', err.message);
        }
    });

    if (chatId) {
        console.log(`✅ 텔레그램 봇 연결 완료 (기존 Chat ID: ${getMaskedChatId()})`);
    }

    return true;
}

/**
 * 텔레그램 봇 활성 상태 확인
 */
export function isTelegramActive() {
    return bot !== null && chatId !== null;
}

/**
 * 현재 Chat ID 조회
 */
export function getChatId() {
    return chatId;
}

/**
 * 봇 username 조회
 */
export function getBotUsername() {
    return botUsername;
}

/**
 * 마스킹된 Chat ID 반환 (앞 3자리만 노출)
 */
export function getMaskedChatId() {
    if (!chatId) return null;
    const id = String(chatId);
    if (id.length <= 3) return id;
    return id.substring(0, 3) + '*'.repeat(id.length - 3);
}

/**
 * Chat ID 수동 설정
 */
export function updateChatId(newChatId) {
    if (!newChatId || !/^\d+$/.test(String(newChatId))) {
        return false;
    }
    chatId = String(newChatId);
    console.log(`📱 텔레그램 Chat ID 수동 변경: ${getMaskedChatId()}`);
    return true;
}

/**
 * 취소 물량 발생 알림 전송
 * @param {Array<{date: string, day: string, status: string, link: string|null}>} slots
 */
export async function sendAlert(slots) {
    if (!bot || !chatId) return false;

    const lines = slots.map(s => {
        const linkText = s.link ? `\n   👉 [예약하기](${s.link})` : '';
        return `🟢 *${s.date} (${s.day})* — 예약 가능!${linkText}`;
    });

    const message = [
        '🚨 *농도원 목장 예약 취소 알림!*',
        '',
        ...lines,
        '',
        `⏰ 감지 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
        '',
        '⚡ 빠르게 예약하세요!',
    ].join('\n');

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log(`📱 텔레그램 알림 전송 완료 (${slots.length}건)`);
        return true;
    } catch (err) {
        console.error('❌ 텔레그램 전송 실패:', err.message);
        return false;
    }
}

/**
 * 테스트 메시지 전송
 */
export async function sendTestMessage() {
    if (!bot || !chatId) return false;

    try {
        await bot.sendMessage(chatId,
            '✅ *농도원 목장 모니터* — 텔레그램 연결 테스트 성공!\n\n' +
            '모니터링이 정상적으로 동작 중입니다. 취소 물량 발생 시 즉시 알림을 보내드립니다. 🐄',
            { parse_mode: 'Markdown' }
        );
        console.log('📱 테스트 메시지 전송 완료');
        return true;
    } catch (err) {
        console.error('❌ 테스트 메시지 전송 실패:', err.message);
        return false;
    }
}

/**
 * 모니터링 상태 보고 전송 (선택적)
 * @param {Object} summary - 상태 요약
 */
export async function sendStatusReport(summary) {
    if (!bot || !chatId) return false;

    const lines = Object.entries(summary).map(([month, counts]) =>
        `📅 ${month}: 마감 ${counts['마감'] || 0} | 가능 ${counts['가능'] || 0} | 미운영 ${counts['미운영'] || 0}`
    );

    const message = [
        '📊 *농도원 목장 모니터 상태 보고*',
        '',
        ...lines,
        '',
        `🕐 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
    ].join('\n');

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return true;
    } catch (err) {
        console.error('❌ 상태 보고 전송 실패:', err.message);
        return false;
    }
}
