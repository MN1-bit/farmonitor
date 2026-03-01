import axios from 'axios';
import * as cheerio from 'cheerio';

// HTTP 사용 — nongdo.co.kr의 HTTPS는 legacy TLS로 Node.js 22+ 호환 불가
const BASE_URL = 'http://www.nongdo.co.kr/menu4/menu4_sub1_1.php';
const BOOKING_BASE_URL = 'http://www.nongdo.co.kr/menu4/';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const CLASS_TO_DAY_INDEX = {
    cont1: 0, // 일요일
    cont2: -1, // 평일 (월~금, 인덱스는 위치로 판별)
    cont7: 6, // 토요일
};

/**
 * 월별 예약 페이지 HTML을 가져온다
 * @param {string} yearMonth - 'YYYYMM' 형식 (예: '202603')
 * @returns {Promise<string>} HTML 문자열
 */
export async function fetchMonthlyCalendar(yearMonth) {
    const dateParam = `${yearMonth}01`;
    const url = `${BASE_URL}?conf=&date=${dateParam}&bmain=list`;

    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        },
        timeout: 15000,
    });

    return response.data;
}

/**
 * HTML에서 예약 상태를 파싱한다
 * @param {string} html - 페이지 HTML
 * @param {string} yearMonth - 'YYYYMM' 형식
 * @returns {Array<{date: string, day: string, dayIndex: number, status: string, link: string|null}>}
 */
export function parseReservationStatus(html, yearMonth) {
    const $ = cheerio.load(html);
    const results = [];

    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));

    // 캘린더 테이블의 tbody에서 모든 행을 순회
    $('#nongdo_schedule tbody tr').each((_, row) => {
        $(row).find('td').each((colIndex, cell) => {
            const $cell = $(cell);

            // 빈 셀(월 시작/끝 패딩) 스킵
            if ($cell.attr('bgcolor') === 'ffffff') return;

            // 날짜 숫자 추출
            const cellText = $cell.text().replace(/\u00a0/g, ' ').trim();
            const dateMatch = cellText.match(/(\d+)/);
            if (!dateMatch) return;

            const dayNum = parseInt(dateMatch[1]);
            if (dayNum < 1 || dayNum > 31) return;

            // 요일 판별 (colIndex 기반: 0=일, 1=월, ..., 6=토)
            const dayIndex = colIndex;
            const dayName = DAY_NAMES[dayIndex] || '?';

            // 날짜 문자열 생성
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            // 상태 감지
            let status = '미운영';
            let link = null;

            const hasClosedIcon = $cell.find('img[alt="예약마감"]').length > 0
                || $cell.find('img[src*="icon_1.gif"]').length > 0;

            const $link = $cell.find('a[href*="menu4_sub1_3"]');
            const hasBookingLink = $link.length > 0;

            if (hasClosedIcon) {
                status = '마감';
            } else if (hasBookingLink) {
                status = '가능';
                const href = $link.attr('href');
                link = href.startsWith('http') ? href : `${BOOKING_BASE_URL}${href}`;
            }

            results.push({
                date: dateStr,
                day: dayName,
                dayIndex,
                status,
                link,
            });
        });
    });

    return results;
}

/**
 * 특정 월의 예약 상태를 가져온다 (fetch + parse)
 * @param {string} yearMonth - 'YYYYMM' 형식
 * @returns {Promise<Array>}
 */
export async function getReservationStatus(yearMonth) {
    const html = await fetchMonthlyCalendar(yearMonth);
    return parseReservationStatus(html, yearMonth);
}

// --test 플래그로 실행 시 테스트 모드
if (process.argv.includes('--test')) {
    console.log('🔍 스크래퍼 테스트 시작...\n');

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`📅 대상 월: ${yearMonth}`);

    try {
        const results = await getReservationStatus(yearMonth);
        console.log(`✅ 파싱 결과: ${results.length}개 날짜\n`);

        // 상태별 카운트
        const counts = { '마감': 0, '가능': 0, '미운영': 0 };
        results.forEach(r => counts[r.status]++);
        console.log('📊 상태 요약:', counts);

        // 주말만 필터
        const weekends = results.filter(r => r.dayIndex === 0 || r.dayIndex === 6);
        console.log(`\n🗓️ 주말 날짜 (${weekends.length}개):`);
        weekends.forEach(r => {
            const icon = r.status === '마감' ? '🔴' : r.status === '가능' ? '🟢' : '⚪';
            console.log(`  ${icon} ${r.date} (${r.day}) - ${r.status}${r.link ? ` → ${r.link}` : ''}`);
        });
    } catch (err) {
        console.error('❌ 테스트 실패:', err.message);
        process.exit(1);
    }
}
