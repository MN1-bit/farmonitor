# Full Log History

## 2026-03

[0301_13_07] - 농도원 목장 예약 모니터 v1.0 구현 - Node.js 기반 예약 취소 모니터링 웹앱 완성
  - 사이트 분석: nongdo.co.kr PHP 기반 캘린더, icon_1.gif(마감), a태그(가능) 감지 로직 설계
  - 백엔드: scraper(cheerio), monitor(cron 60s), telegram(alert), Express API 구현
  - 프론트엔드: 모바일 다크 테마 UI, 월 선택 캘린더, 즉시 체크 기능
  - TLS 이슈: nongdo.co.kr legacy TLS → HTTP로 전환하여 해결
  - 문서: 예약페이지 아키텍처, 텔레그램 가이드, Cloudflare Tunnel 가이드
  - PM2 ecosystem.config.cjs 작성 (24/7 운영용)

[0301_13_41] - GUI Overhaul: Aurora Theme 적용 - Sigma Theme Handout 기반 프리미엄 다크 테마로 전면 교체
  - 신규: tokens.css (Tokyo Night 팔레트), aurora-vfx.css (3-Layer Aurora Orbs VFX)
  - style.css 전면 재작성: glassmorphism 카드, gradient 버튼, 정제된 캘린더 그리드
  - index.html 재구조: iPhone meta, SVG noise filter, 3-Layer VFX DOM, Inter 폰트 CDN
  - 계획서: docs/Plan/GUI_Aurora_Overhaul_plan.md

[0301_14_10] - 텔레그램 자동연결 + PWA 완성 - 봇 polling 모드로 /start 자동감지, PWA 오프라인 캐시
  - telegram.js: polling 모드 전환, /start 수신 시 Chat ID 자동 저장, getBotUsername/getMaskedChatId 추가
  - server.js: GET /api/telegram/status 엔드포인트 (봇 링크 + 연결 상태 반환)
  - index.html: 즉시체크 버튼 제거 → "텔레그램 등록 & 푸시알림 켜기" 숏컷으로 교체
  - PWA: manifest.json, icon-192/512.png, sw.js 오프라인 캐시 (cache-first static, network-first API)
  - app.js: refreshTelegramStatus 10초 폴링, 숏컷 클릭 시 선택 월 설정 동기화
  - 계획서: docs/Plan/Telegram_ChatID_Input_plan.md
