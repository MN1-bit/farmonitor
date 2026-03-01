# GUI Overhaul — Aurora Theme 적용

농도원 목장 모니터의 MVP 스타일 GUI를 Sigma Theme Handout 기반 프리미엄 다크 테마로 전면 교체.
배경 VFX는 **Aurora Orbs** 프리셋 적용.

---

## Proposed Changes

### CSS Layer

#### [NEW] [tokens.css](file:///d:/Codes/farmonitor/public/tokens.css)
- `theme_handout/css/tokens.css`에서 필요한 토큰만 추출
- Tokyo Night 팔레트 (bg-panel, fg, accent-blue, positive, negative, warning 등)
- Glassmorphism 변수 (`--sigma-surface-rgb`, `--sigma-surface-opacity`, `--sigma-border-rgb`)
- VFX 제어 변수 (`--sigma-vfx-bg-color`, `--sigma-vfx-opacity`, `--sigma-vfx-blur`)

#### [NEW] [aurora-vfx.css](file:///d:/Codes/farmonitor/public/aurora-vfx.css)
- `background-vfx.css`에서 **공통 레이어 + Aurora Orbs 프리셋만** 추출
- 3-Layer 구조: `sigma-bg-base` + `sigma-bg-vfx--aurora-orbs` + `sigma-bg-blur`
- SVG noise filter 포함

#### [MODIFY] [style.css](file:///d:/Codes/farmonitor/public/style.css)
- 전면 재작성 — 기존 MVP CSS 완전 교체
- 글로벌 리셋 + body 스타일 (Inter 폰트, safe area, overflow)
- `.card` → glassmorphism (blur + rgba surface + glow border)
- 캘린더 그리드 개선: 더 세련된 셀 디자인, accent 색상 사용
- 버튼: gradient + glow hover 효과
- `.status-bar`: subtle accent border bottom
- 반응형 + 모바일 우선 구조 유지 (max-width: 480px)
- 미세 애니메이션: hover, active 상태 전환 `transition`
- 스크롤 가능 영역 커스텀 스크롤바 (Tokyo Night 계열)

---

### HTML Layer

#### [MODIFY] [index.html](file:///d:/Codes/farmonitor/public/index.html)
- `<head>`: iPhone 최적 viewport, apple-mobile-web-app meta 태그 추가
- `<head>`: `tokens.css` + `aurora-vfx.css` + `style.css` 순서로 link
- `<head>`: Inter 폰트 (Google Fonts CDN)
- `<body>`: SVG noise filter 삽입
- `<body>`: 3-Layer 배경 구조 추가 — `sigma-bg-base` → `sigma-bg-vfx--aurora-orbs` (3 orb divs) → `sigma-bg-blur`
- `#app` wrapper에 `position: relative; z-index: 2` 적용
- 기존 header / main 구조 유지, `#app` div로 래핑

---

### JS Layer

#### [MODIFY] [app.js](file:///d:/Codes/farmonitor/public/app.js)
- 변경 없음 (기능 로직은 그대로 유지)
- DOM 구조 변경에 맞춰 `#app` 래핑만 반영

---

## Design Decisions

| 항목 | 결정 |
|------|------|
| VFX 프리셋 | Aurora Orbs (CSS-only, 배터리 절약) |
| 카드 스타일 | Glassmorphism (backdrop-filter + rgba border) |
| 폰트 | Inter (Google Fonts CDN) |
| 색상 팔레트 | Tokyo Night (theme_handout 기반) |
| 프레임워크 | 없음 — 순수 HTML/CSS/JS 유지 |
| VFX 강도 | 은은하게 (opacity 0.35, blur 50px) |

---

## Verification Plan

### Browser Testing
1. `npm run dev`로 서버 기동
2. http://localhost:3000/ 접속
3. 확인 항목:
   - Aurora 오브 3개 (blue, purple, cyan)가 떠다니는지
   - 카드가 glassmorphism 효과 (배경 blur, 반투명) 적용되었는지
   - 캘린더 그리드 정상 표시
   - 버튼 hover/active 상태 전환 확인
   - 모바일 뷰포트(501px)에서 정상 표시
