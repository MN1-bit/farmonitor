# 텔레그램 Chat ID 입력 + PWA 푸시 알림

## 목표

1. **텔레그램 Chat ID 입력** — 웹 UI에서 알림 받을 Chat ID를 설정
2. **PWA 완성** — `manifest.json` + 아이콘 + 홈화면 추가 시 iOS에서도 Push 수신 가능

## Proposed Changes

### 1️⃣ 텔레그램 Chat ID 입력

#### [MODIFY] `public/index.html`
- 텔레그램 카드에 Chat ID 입력 필드 + 저장 버튼 + 안내 텍스트 추가

#### [MODIFY] `public/style.css`
- `.telegram-input-group`, `.input-row`, input 스타일, `.input-hint` 추가

#### [MODIFY] `public/app.js`
- `GET/POST /api/telegram/chat-id` 호출 로직 추가

#### [MODIFY] `src/server.js`
- `GET /api/telegram/chat-id` — 현재 Chat ID 마스킹 반환
- `POST /api/telegram/chat-id` — Chat ID 업데이트

#### [MODIFY] `src/telegram.js`
- `updateChatId()`, `getChatId()` 함수 추가

---

### 2️⃣ PWA 완성

#### [NEW] `public/manifest.json`
- PWA manifest with standalone display mode

#### [NEW] 아이콘 파일들
- `icon-192.png`, `icon-512.png`

#### [MODIFY] `public/index.html`
- manifest 링크, theme-color, Apple 아이콘 meta 태그 추가

#### [MODIFY] `public/sw.js`
- 오프라인 캐시 전략 추가

#### [MODIFY] `public/index.html`
- PWA 설치/Push 알림 토글 UI 추가

## Verification Plan

1. 텔레그램 Chat ID 입력 → 저장 → 테스트 메시지 전송 확인
2. Chrome DevTools → Application → manifest.json 정상 로드
3. "홈 화면에 추가" 가능 여부 확인
4. PWA 모드에서 Push 알림 구독/테스트
