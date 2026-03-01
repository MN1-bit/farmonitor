# Sigma Theme Handout

Sigma 트레이딩 플랫폼에서 추출한 **프리미엄 다크 테마 패키지**.  
컬러 시스템, 배경 VFX, 시각화 컴포넌트를 새 프로젝트에 바로 적용할 수 있다.

> **Target**: 모바일 웹 앱 (iPhone Safari 최적화 포함)

---

## 목차

1. [퀵 스타트 — CSS만 사용 (5분)](#1-퀵-스타트--css만-사용-5분)
2. [퀵 스타트 — React 프로젝트 (10분)](#2-퀵-스타트--react-프로젝트-10분)
3. [파일 구조](#3-파일-구조)
4. [컬러 토큰 가이드](#4-컬러-토큰-가이드)
5. [배경 VFX 가이드](#5-배경-vfx-가이드)
6. [시각화 컴포넌트 가이드](#6-시각화-컴포넌트-가이드)
7. [iPhone / 모바일 웹 주의사항](#7-iphone--모바일-웹-주의사항)
8. [커스터마이징](#8-커스터마이징)
9. [데모 확인 방법](#9-데모-확인-방법)

---

## 1. 퀵 스타트 — CSS만 사용 (5분)

**React 없이**, 순수 HTML 프로젝트에서 배경 VFX + 컬러만 사용하는 방법.

### Step 1: CSS 파일 복사

`css/` 폴더의 3개 파일을 프로젝트에 복사:

```
your-project/
├── styles/
│   ├── tokens.css           ← 컬러 변수
│   ├── background-vfx.css   ← 배경 VFX 애니메이션
│   └── visualization.css    ← (선택) viz 컴포넌트 스타일
```

### Step 2: HTML에 링크 추가

```html
<head>
    <!-- 필수: iPhone 최적화 viewport -->
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <!-- Sigma Theme CSS -->
    <link rel="stylesheet" href="styles/tokens.css">
    <link rel="stylesheet" href="styles/background-vfx.css">
</head>
```

### Step 3: CSS 변수 초기화

VFX가 동작하려면 아래 CSS 변수를 `:root`에 선언해야 한다:

```css
:root {
    /* 배경 베이스 레이어 */
    --sigma-vfx-bg-color: #0f0f17;
    --sigma-vfx-bg-opacity: 0.85;

    /* VFX 레이어 투명도 (0 ~ 1, 낮을수록 은은) */
    --sigma-vfx-opacity: 0.4;

    /* Blur 레이어 (frosted glass 효과) */
    --sigma-vfx-blur: blur(40px);
}
```

### Step 4: HTML 구조 (3-레이어)

```html
<body>
    <!-- SVG Noise Filter (색상 밴딩 방지) -->
    <svg aria-hidden="true" style="position:absolute;width:0;height:0">
        <filter id="sigma-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65"
                          numOctaves="3" stitchTiles="stitch"/>
        </filter>
    </svg>

    <!-- Layer 0: 어두운 베이스 -->
    <div class="sigma-bg-base" aria-hidden="true"></div>

    <!-- Layer 1: VFX 이펙트 (프리셋 선택, 아래 참조) -->
    <div class="sigma-bg-vfx sigma-bg-vfx--aurora-orbs" aria-hidden="true">
        <div class="sigma-aurora-orb sigma-aurora-orb--blue"></div>
        <div class="sigma-aurora-orb sigma-aurora-orb--purple"></div>
        <div class="sigma-aurora-orb sigma-aurora-orb--cyan"></div>
    </div>

    <!-- Layer 2: Frosted glass blur -->
    <div class="sigma-bg-blur" aria-hidden="true"></div>

    <!-- 실제 앱 콘텐츠 (z-index 2+) -->
    <div id="app" style="position:relative; z-index:2;">
        <h1>Your App Here</h1>
    </div>
</body>
```

### Step 5: body 기본 스타일

```css
html, body {
    height: 100%;
    width: 100%;
    overflow: hidden;   /* VFX 레이어가 넘치지 않도록 */
    margin: 0;
    color-scheme: dark;
    font-family: "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif;
    color: var(--color-fg);
    background: var(--color-bg-panel);
    /* iPhone safe area 대응 */
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
             env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* 앱 콘텐츠가 VFX 위에 오도록 */
#app {
    position: relative;
    z-index: 2;
}
```

**끝! 이것만으로 VFX 배경이 적용된다.**

---

## 2. 퀵 스타트 — React 프로젝트 (10분)

### Step 1: Vite + React 신규 프로젝트 생성 (없으면)

```bash
npx -y create-vite@latest my-app -- --template react-ts
cd my-app && npm install
```

### Step 2: 파일 복사

핸드아웃 패키지 전체를 프로젝트의 `src/` 안에 복사:

```
my-app/src/
├── sigma-theme/              ← theme_handout 폴더를 통째로
│   ├── css/
│   │   ├── tokens.css
│   │   ├── background-vfx.css
│   │   └── visualization.css
│   ├── components/
│   │   ├── BackgroundVFX.tsx
│   │   ├── index.ts
│   │   └── viz/
│   │       ├── RingGauge.tsx
│   │       ├── Sparkline.tsx
│   │       ├── SignalBeacon.tsx
│   │       ├── MiniBar.tsx
│   │       ├── StatusBadge.tsx
│   │       └── index.ts
│   └── hooks/
│       └── useAnimatedValue.ts
├── App.tsx
└── main.tsx
```

### Step 3: CSS import (main.tsx 또는 index.css)

```tsx
// main.tsx
import "./sigma-theme/css/tokens.css";
import "./sigma-theme/css/background-vfx.css";
import "./sigma-theme/css/visualization.css";
```

### Step 4: CSS 변수 선언 (index.css 또는 App.css)

```css
:root {
    --sigma-vfx-bg-color: #0f0f17;
    --sigma-vfx-bg-opacity: 0.85;
    --sigma-vfx-opacity: 0.4;
    --sigma-vfx-blur: blur(40px);
}

html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
    margin: 0;
    color-scheme: dark;
    font-family: "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif;
    color: var(--color-fg);
    background: var(--color-bg-panel);
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
             env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### Step 5: 컴포넌트 사용

```tsx
// App.tsx
import { BackgroundVFX } from "./sigma-theme/components";

function App() {
    return (
        <>
            <BackgroundVFX preset="aurora" />
            <div style={{ position: "relative", zIndex: 2, padding: 24 }}>
                <h1 style={{ color: "var(--color-fg)" }}>My App</h1>
            </div>
        </>
    );
}

export default App;
```

### VFX 프리셋 변경

```tsx
<BackgroundVFX preset="starfield" />   // 파티클 네트워크
<BackgroundVFX preset="aurora" />      // 떠다니는 컬러 오브
<BackgroundVFX preset="nebula" />      // 따뜻/차가운 성운
<BackgroundVFX preset="plasma" />      // 수평 파도
<BackgroundVFX preset="matrix" />      // 매트릭스 글자 비
<BackgroundVFX preset="ambient_gradient" /> // 움직이는 그라디언트
<BackgroundVFX preset="none" />        // VFX 없음 (base + blur만)
```

### 시각화 컴포넌트 사용

```tsx
import { RingGauge, Sparkline, SignalBeacon, StatusBadge, MiniBar } from "./sigma-theme/components";

// 도넛 게이지
<RingGauge value={73} title="CPU" subtitle="11.7 / 16 GB" />

// 실시간 스파크라인
<Sparkline data={[10, 20, 15, 30, 25, 40, 35]} color="#7aa2f7" />

// 연결 상태 비콘
<SignalBeacon status="connected" />     // 녹색 느린 pulse
<SignalBeacon status="reconnecting" />  // 주황 빠른 ripple
<SignalBeacon status="disconnected" />  // 빨강 깜빡임
<SignalBeacon status="live" />          // 빨강 burst

// 상태 배지 (비콘 + 라벨)
<StatusBadge status="connected" label="Server" />

// 미니 프로그레스 바
<MiniBar value={75} label="C0" />
```

---

## 3. 파일 구조

```
theme_handout/
├── README.md              ← 이 파일
├── demo.html              ← CSS-only 인터랙티브 데모 (브라우저에서 바로 확인)
├── css/
│   ├── tokens.css         ← 컬러 토큰 (Tokyo Night 팔레트)
│   │                         --color-bg-panel, --color-fg, --color-positive 등
│   ├── background-vfx.css ← 6개 배경 VFX 프리셋 애니메이션
│   │                         Aurora Orbs, Nebula Drift, Plasma Waves 등
│   └── visualization.css  ← 시각화 컴포넌트 CSS
│                              RingGauge, Sparkline, SignalBeacon 등
├── components/
│   ├── BackgroundVFX.tsx  ← 배경 VFX React 컴포넌트 (props 기반, 의존성 없음)
│   ├── index.ts           ← 전체 barrel export
│   └── viz/
│       ├── RingGauge.tsx  ← SVG 도넛 게이지
│       ├── Sparkline.tsx  ← rAF 스크롤 스파크라인
│       ├── SignalBeacon.tsx ← CSS 연결 상태 비콘
│       ├── MiniBar.tsx    ← 수평 프로그레스 바
│       ├── StatusBadge.tsx ← Beacon + 라벨 배지
│       └── index.ts       ← viz barrel export
└── hooks/
    └── useAnimatedValue.ts ← rAF 선형 보간 hook (RingGauge 의존)
```

### 의존성 관계

```
tokens.css ─────────────────────────────────────┐
background-vfx.css ─────────────────────────────┤ (CSS만)
visualization.css ──────────────────────────────┘

BackgroundVFX.tsx ──────── (React, 외부 의존성 없음)
RingGauge.tsx ─────────── useAnimatedValue.ts (유일한 내부 의존성)
Sparkline.tsx ─────────── (React, 외부 의존성 없음)
SignalBeacon.tsx ──────── (React, 외부 의존성 없음)
MiniBar.tsx ───────────── (React, 외부 의존성 없음)
StatusBadge.tsx ───────── SignalBeacon.tsx (내부 import)
```

**외부 의존성은 `react` 뿐이다. npm 추가 설치 불필요.**

---

## 4. 컬러 토큰 가이드

`tokens.css`에 정의된 Tokyo Night 기반 시맨틱 컬러:

### 배경/표면

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-bg-panel` | `#16161e` | 메인 패널 배경 |
| `--color-bg-titlebar` | `#1a1b26` | 타이틀바, 헤더 |
| `--color-surface-elevated` | `#1e202e` | 올라온 표면 (카드, 모달) |
| `--color-hover` | `#202330` | 호버 상태 배경 |

### 텍스트

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-fg` | `#a9b1d6` | 기본 텍스트 |
| `--color-fg-dim` | `#545f89` | 보조 텍스트, 라벨 |

### 액센트

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-accent-blue` | `#7aa2f7` | 주요 액센트 (링크, 버튼) |
| `--color-accent-purple` | `#bb9af7` | 보조 액센트 |

### 시맨틱 (트레이딩)

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-positive` | `#9ece6a` | 수익, 연결, 정상 |
| `--color-negative` | `#f7768e` | 손실, 에러, 위험 |
| `--color-warning` | `#e0af68` | 경고, 주의 |
| `--color-info` | `#7dcfff` | 정보, 안내 |

### Glassmorphism

| 변수 | 설명 |
|------|------|
| `--sigma-surface-rgb` | `22, 22, 30` — `rgba()` 용 |
| `--sigma-surface-opacity` | `0.9` — 글래스 불투명도 |
| `--sigma-border-rgb` | `122, 162, 247` — 글래스 테두리 |

**사용 예시:**

```css
.my-card {
    background: rgba(var(--sigma-surface-rgb), var(--sigma-surface-opacity));
    border: 1px solid rgba(var(--sigma-border-rgb), 0.19);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);  /* iPhone 필수 */
    border-radius: 12px;
    color: var(--color-fg);
}

.profit { color: var(--color-positive); }
.loss   { color: var(--color-negative); }
```

---

## 5. 배경 VFX 가이드

### 작동 원리

3-레이어 스택으로 배경을 구성:

```
z-index 0: sigma-bg-base  ← 어두운 반투명 오버레이
z-index 0: sigma-bg-vfx   ← 이펙트 레이어 (애니메이션)
z-index 0: sigma-bg-blur  ← frosted glass blur
z-index 2: #app           ← 실제 콘텐츠
```

### 프리셋 목록

| 프리셋 | 클래스 | 설명 | 성능 |
|--------|--------|------|------|
| Ambient Gradient | `sigma-bg-vfx--ambient-gradient` | 움직이는 다크 그라데이션 | ⚡ 최소 (CSS only) |
| Aurora Orbs | `sigma-bg-vfx--aurora-orbs` + 3 orb divs | 떠다니는 컬러 오브 3개 | ⚡ 저 (CSS transform) |
| Nebula Drift | `sigma-bg-vfx--nebula-drift` + 3 patch divs | 따뜻/차가운 성운 패치 | ⚡ 저 |
| Plasma Waves | `sigma-bg-vfx--plasma-waves` + 3 wave divs | 수평 파도 레이어 | ⚡ 저 |
| Starfield | `sigma-bg-vfx--starfield` + 2 layer divs | 반짝이는 별 (CSS box-shadow) | ⚡ 저 |
| Matrix Rain | Canvas 기반 (`BackgroundVFX.tsx`에서만) | 떨어지는 글자 비 | ⚠️ 중 (Canvas rAF) |

> **iPhone 권장**: Aurora, Nebula, Plasma, Ambient Gradient (CSS-only → 배터리 절약)  
> **주의**: Matrix Rain은 Canvas rAF 기반이므로 **HTML에서 CSS-only로 사용 불가** (React 컴포넌트 필요)

### CSS-only VFX 프리셋별 HTML 구조

아래를 복사하여 Layer 1 자리에 붙여넣기:

#### Ambient Gradient
```html
<div class="sigma-bg-vfx sigma-bg-vfx--ambient-gradient" aria-hidden="true"></div>
```

#### Aurora Orbs
```html
<div class="sigma-bg-vfx sigma-bg-vfx--aurora-orbs" aria-hidden="true">
    <div class="sigma-aurora-orb sigma-aurora-orb--blue"></div>
    <div class="sigma-aurora-orb sigma-aurora-orb--purple"></div>
    <div class="sigma-aurora-orb sigma-aurora-orb--cyan"></div>
</div>
```

#### Nebula Drift
```html
<div class="sigma-bg-vfx sigma-bg-vfx--nebula-drift" aria-hidden="true">
    <div class="sigma-nebula-patch sigma-nebula-patch--warm"></div>
    <div class="sigma-nebula-patch sigma-nebula-patch--cool"></div>
    <div class="sigma-nebula-patch sigma-nebula-patch--accent"></div>
</div>
```

#### Plasma Waves
```html
<div class="sigma-bg-vfx sigma-bg-vfx--plasma-waves" aria-hidden="true">
    <div class="sigma-plasma-wave sigma-plasma-wave--top"></div>
    <div class="sigma-plasma-wave sigma-plasma-wave--mid"></div>
    <div class="sigma-plasma-wave sigma-plasma-wave--bottom"></div>
</div>
```

#### Starfield
```html
<div class="sigma-bg-vfx sigma-bg-vfx--starfield" aria-hidden="true">
    <div class="sigma-starfield-layer sigma-starfield-layer--near"></div>
    <div class="sigma-starfield-layer sigma-starfield-layer--far"></div>
</div>
```

---

## 6. 시각화 컴포넌트 가이드

### RingGauge

원형 도넛 게이지. 0~100% 범위에서 warning/critical 임계치에 따라 자동 색상 전환.

```tsx
<RingGauge
    value={73}              // 0~100
    title="CPU"             // 상단 라벨
    subtitle="11.7 / 16 GB" // 하단 보조
    thresholds={{ warning: 60, critical: 85 }}  // 선택, 기본값 있음
    size={120}              // px, 기본 120
    strokeWidth={12}        // 링 두께, 기본 12
/>
```

### Sparkline

rAF 기반 연속 스크롤 스파크라인. ECG 모니터처럼 왼쪽으로 흐른다.

```tsx
<Sparkline
    data={dataArray}        // number[] — 실시간으로 .push()
    color="#7aa2f7"          // 라인/영역 색상
    height={48}             // SVG 높이
    maxPoints={60}          // 최대 표시 포인트
    areaOpacity={0.6}       // 영역 투명도
/>
```

### SignalBeacon

CSS 애니메이션 기반 연결 상태 인디케이터.

| Status | Severity | 효과 |
|--------|----------|------|
| `connected`, `healthy`, `paper` | normal | 녹색 느린 링 2개 burst |
| `reconnecting`, `degraded` | warning | 주황 빠른 연속 ripple 5개 |
| `disconnected`, `dead` | critical | 빨강 3점사 깜빡임 (링 없음) |
| `live` | alert | 빨강 burst 링 3개 |

```tsx
<SignalBeacon status="connected" />
<SignalBeacon status="reconnecting" size={30} />
```

### StatusBadge

SignalBeacon + 라벨을 합친 인라인 배지.

```tsx
<StatusBadge status="connected" label="Server" />
```

### MiniBar

수평 프로그레스 바. 임계치에 따라 파랑→주황→빨강 자동 전환.

```tsx
<MiniBar value={75} label="C0" thresholds={{ warning: 60, critical: 85 }} />
```

---

## 7. iPhone / 모바일 웹 주의사항

### 필수 meta 태그

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### `-webkit-backdrop-filter`

iPhone Safari는 `backdrop-filter`에 `-webkit-` 접두사가 **필수**:

```css
.glass-element {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);  /* ← 이거 빠지면 iPhone에서 안 됨 */
}
```

> `background-vfx.css`의 `sigma-bg-blur`에는 이미 포함되어 있다.

### Safe Area Inset

iPhone 노치/다이나믹 아일랜드 대응:

```css
body {
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
             env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### VFX 성능 권장

| VFX | iPhone 권장 여부 |
|-----|:---:|
| Ambient Gradient | ✅ CSS-only, 최저 배터리 |
| Aurora Orbs | ✅ CSS transform, GPU |
| Nebula Drift | ✅ |
| Plasma Waves | ✅ |
| Starfield | ✅ CSS box-shadow |
| Matrix Rain | ⚠️ Canvas rAF, 배터리 소모 |

### `will-change` 참고

VFX CSS에 이미 `will-change: transform`이 적용되어 있어 GPU 가속된다.  
별도 최적화 불필요.

---

## 8. 커스터마이징

### 컬러 팔레트 변경

`tokens.css`의 `:root` 변수를 오버라이드:

```css
:root {
    /* 원래: Tokyo Night Blue */
    /* --color-accent-blue: #7aa2f7; */

    /* 커스텀: Neon Teal */
    --color-accent-blue: #2dd4bf;
    --sigma-border-rgb: 45, 212, 191;  /* RGB도 맞춰줘야 glow 동작 */
}
```

### VFX 강도 조절

```css
:root {
    --sigma-vfx-opacity: 0.2;   /* 더 은은하게 (기본 0.4) */
    --sigma-vfx-blur: blur(60px); /* 더 몽환적 (기본 40px) */
    --sigma-vfx-bg-opacity: 0.95; /* 배경 더 어둡게 (기본 0.85) */
}
```

### VFX 프리셋 색상 변경

Aurora Orbs의 색상을 변경하려면 `background-vfx.css`에서 해당 프리셋의 `background: radial-gradient(...)` 값을 수정:

```css
/* 기본: blue 오브 */
.sigma-aurora-orb--blue {
    background: radial-gradient(circle, rgba(50, 100, 220, 0.40) 0%, transparent 70%);
}

/* 커스텀: teal 오브 */
.sigma-aurora-orb--blue {
    background: radial-gradient(circle, rgba(45, 212, 191, 0.40) 0%, transparent 70%);
}
```

### SignalBeacon 크기 변경

```css
.viz-beacon {
    --viz-beacon-size: 32px;  /* 기본 22px */
}
```

---

## 9. 데모 확인 방법

### 로컬 PC에서

`demo.html`을 브라우저에서 열면 된다:

```
# 그냥 더블클릭
theme_handout/demo.html

# 또는 서버로 띄우기
npx serve theme_handout
```

### iPhone에서 바로 확인

같은 Wi-Fi에서 로컬 서버를 띄우고 iPhone Safari로 접속:

```bash
# 로컬 서버 (0.0.0.0으로 바인딩)
cd theme_handout
npx serve . -l 3000

# iPhone Safari에서:
# http://<PC의-IP>:3000/demo.html
```

> **Tip**: PC IP는 `ipconfig` (Windows) 또는 `ifconfig` (Mac)으로 확인.

---

## License

Sigma 프로젝트 내부용. 재배포 불가.
