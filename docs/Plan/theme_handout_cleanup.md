# theme_handout 폴더 Cleanup 계획

## 배경

`theme_handout/`은 **Sigma 트레이딩 플랫폼**에서 추출한 프리미엄 다크 테마 패키지이다.
Farm Monitor 프로젝트에 Aurora 테마를 적용할 때 **참조 자료**로 사용되었으며, 필요한 CSS만 `public/`에 추출 완료된 상태이다.

---

## 현황 분석

### 프로젝트 기술 스택

| 구분 | 내용 |
|------|------|
| 프론트엔드 | **Vanilla HTML/CSS/JS** (React 없음) |
| 백엔드 | Node.js |
| 구조 | `public/` (정적 파일) + `src/` (서버) |

### theme_handout 파일 목록 (14개)

```
theme_handout/                        총 ~86KB
├── README.md                  (19.8KB) ← 사용 가이드
├── demo.html                  (8.9KB)  ← CSS-only 데모 페이지
├── css/
│   ├── tokens.css             (2.5KB)  ← 원본 컬러 토큰
│   ├── background-vfx.css     (20.9KB) ← 6개 VFX 프리셋 전체
│   └── visualization.css      (13.7KB) ← viz 컴포넌트 스타일
├── components/
│   ├── BackgroundVFX.tsx       (9.3KB)  ← React 배경 VFX
│   ├── index.ts               (0.4KB)
│   └── viz/
│       ├── RingGauge.tsx       (2.6KB)
│       ├── Sparkline.tsx       (4.9KB)
│       ├── SignalBeacon.tsx    (1.8KB)
│       ├── MiniBar.tsx        (1.7KB)
│       ├── StatusBadge.tsx    (1.4KB)
│       └── index.ts           (0.4KB)
└── hooks/
    └── useAnimatedValue.ts    (1.5KB)
```

### 실제 사용 현황

| 파일 | 상태 | 설명 |
|------|------|------|
| `css/tokens.css` | ✅ **추출 완료** | → `public/tokens.css` (43줄, 축소 버전) |
| `css/background-vfx.css` | ✅ **추출 완료** | → `public/aurora-vfx.css` (233줄, Aurora 프리셋만) |
| `css/visualization.css` | ❌ 미사용 | React viz 컴포넌트용 — 프로젝트에 해당 컴포넌트 없음 |
| `components/*.tsx` | ❌ 미사용 | React 전용 — Vanilla JS 프로젝트에서 사용 불가 |
| `hooks/*.ts` | ❌ 미사용 | React Hook — 사용 불가 |
| `demo.html` | ❌ 미사용 | 참조 용도로만 사용됨 |
| `README.md` | ❌ 미사용 | 참조 용도로만 사용됨 |

> [!IMPORTANT]
> **결론:** `theme_handout/` 폴더 전체가 미사용 참조 자료이다. 필요한 CSS는 이미 `public/`에 추출 완료.

---

## 제안 옵션

### Option A: 폴더 전체 삭제 (권장)

```
DELETE  theme_handout/          ← 폴더 전체 (14개 파일, ~86KB)
```

- 필요한 자산은 이미 `public/tokens.css`, `public/aurora-vfx.css`에 존재
- React/TSX 파일은 Vanilla JS 프로젝트에서 사용 불가
- git history에 원본이 보존되므로 복구 가능

### Option B: docs로 이동 후 최소화

`docs/references/` 하위로 README와 tokens만 보존:

```
MOVE    theme_handout/README.md  → docs/references/sigma_theme_handout.md
DELETE  나머지 전체
```

---

## Verification

- `public/tokens.css`와 `public/aurora-vfx.css`가 정상 참조되는지 브라우저 확인
- `theme_handout/` 내 파일을 참조하는 import/link가 없음을 `grep` 확인 (✅ 이미 확인 완료)

