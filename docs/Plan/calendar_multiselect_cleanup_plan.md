# 캘린더 다중 월 선택 + 불필요 기능 제거

## 목표
1. **캘린더에서 다중 월 선택 가능**하도록 UI 개선
2. **"📥 실시간 조회" 버튼 및 관련 백엔드 제거** — 불필요 기능 정리
3. 핵심 기능만 유지: **푸시알림 + 텔레그램 전송**

## 현재 문제점

| 문제 | 현재 상태 |
|------|-----------|
| 월 선택 | ◀▶ 화살표로 1개월씩만 이동, 월 라벨 클릭으로 토글 — 비직관적 |
| 실시간 조회 | `/api/fetch` 호출하는 불필요 버튼 존재 |
| "즉시 체크" | 모니터링 체크를 수동 트리거 — 유지 (push/telegram 알림 트리거용) |

---

## Proposed Changes

### 1. Frontend — 캘린더 다중 월 선택 UI

#### [MODIFY] [index.html](file:///d:/Codes/farmonitor/public/index.html)

- 월 선택 섹션을 **체크박스 형태의 multi-month picker**로 교체
  - 현재월 ~ 향후 6개월까지 버튼 리스트로 표시
  - 선택된 월은 active 태그 스타일로 하이라이트
  - ◀▶ 화살표 네비게이션 제거
- **"📥 실시간 조회" 버튼 제거** (Line 68)
- 캘린더 뷰를 **선택된 모든 월을 연속으로 표시**하도록 변경

#### [MODIFY] [app.js](file:///d:/Codes/farmonitor/public/app.js)

- `selectedMonth` 단일 변수 → `monitoredMonths` 배열 기반으로 변경
- 월 선택 UI: 현재월~6개월 후까지 토글 버튼 렌더링
- `renderCalendar()` → 선택된 모든 월의 캘린더를 순서대로 렌더링
- `btn-fetch` 관련 이벤트 바인딩 제거 (Line 279-282)
- 월 라벨 클릭 이벤트 제거 (Line 262-264)
- ◀▶ 네비게이션 이벤트 제거 (Line 250-259)
- 30초 자동갱신: 모든 선택된 월 갱신

#### [MODIFY] [style.css](file:///d:/Codes/farmonitor/public/style.css)

- `.month-selector` 스타일 → 다중 선택 버튼 그리드 스타일로 변경
- `.month-btn` 및 `.month-btn.active` 스타일 추가

---

### 2. Backend — 실시간 조회 API 제거

#### [MODIFY] [server.js](file:///d:/Codes/farmonitor/src/server.js)

- `/api/fetch` 라우트 제거 (Line 49-65)
- `getReservationStatus` import 제거 (Line 12) — `monitor.js` 내부에서만 사용

---

### 3. 유지되는 기능 (변경 없음)

| 기능 | 파일 | 상태 |
|------|------|------|
| 텔레그램 전송 | `telegram.js` | ✅ 유지 |
| Web Push 알림 | `webpush.js` | ✅ 유지 |
| 즉시 체크 | `server.js` `/api/check-now` | ✅ 유지 |
| 변경 이력 | `server.js` `/api/history` | ✅ 유지 |
| 설정 (대상 월) | `server.js` `/api/settings` | ✅ 유지 |

---

## Verification Plan

### Browser Test
1. `node src/index.js`로 서버 시작
2. `http://localhost:3000` 접속
3. 확인 사항:
   - 월 선택 섹션에 현재월~6개월 후 버튼이 표시되는지
   - 여러 월을 동시에 선택/해제할 수 있는지
   - 선택된 월들의 캘린더가 모두 표시되는지
   - "실시간 조회" 버튼이 제거되었는지
   - "즉시 체크" 버튼이 정상 동작하는지
   - 텔레그램 테스트 버튼이 정상 동작하는지
