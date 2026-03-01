# Full Log History

## 2026-03

[0301_13_07] - 농도원 목장 예약 모니터 v1.0 구현 - Node.js 기반 예약 취소 모니터링 웹앱 완성
  - 사이트 분석: nongdo.co.kr PHP 기반 캘린더, icon_1.gif(마감), a태그(가능) 감지 로직 설계
  - 백엔드: scraper(cheerio), monitor(cron 60s), telegram(alert), Express API 구현
  - 프론트엔드: 모바일 다크 테마 UI, 월 선택 캘린더, 즉시 체크 기능
  - TLS 이슈: nongdo.co.kr legacy TLS → HTTP로 전환하여 해결
  - 문서: 예약페이지 아키텍처, 텔레그램 가이드, Cloudflare Tunnel 가이드
  - PM2 ecosystem.config.cjs 작성 (24/7 운영용)
