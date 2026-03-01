import 'dotenv/config';
import app from './server.js';
import { initTelegram } from './telegram.js';
import { initWebPush } from './webpush.js';
import { startMonitoring, loadSettings } from './monitor.js';

const PORT = parseInt(process.env.PORT) || 3000;
const INTERVAL = parseInt(process.env.MONITOR_INTERVAL_SECONDS) || 60;

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🐄 농도원 목장 예약 취소 모니터 v1.0  ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    // 1. 텔레그램 봇 초기화
    const telegramOk = initTelegram(
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_CHAT_ID
    );

    if (!telegramOk) {
        console.log('ℹ️  텔레그램 알림 없이 실행합니다.');
    }

    // 2. Web Push 초기화
    initWebPush(
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
        process.env.VAPID_EMAIL
    );

    console.log('');

    // 3. 설정 로드
    const settings = await loadSettings();
    const interval = settings.intervalSeconds || INTERVAL;

    // 4. Express 서버 시작
    app.listen(PORT, () => {
        console.log(`🌐 웹 서버: http://localhost:${PORT}`);
        console.log('');
    });

    // 4. 모니터링 시작
    await startMonitoring(interval);
}

main().catch(err => {
    console.error('🔥 치명적 오류:', err);
    process.exit(1);
});
