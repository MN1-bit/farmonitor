# 농도원 목장 예약 페이지 아키텍처

> 리서치 일시: 2026-03-01

## 개요

농도원 목장(nongdo.co.kr)의 체험 예약 시스템은 **서버사이드 렌더링(PHP)** 기반의 캘린더 UI로 구성되어 있다.
AJAX/API 호출 없이 페이지 전체가 HTML로 렌더링되며, 월 이동 시 페이지 리로드가 발생한다.

---

## URL 구조

```
https://www.nongdo.co.kr/menu4/menu4_sub1_1.php?conf=&date=YYYYMM01&bmain=list
```

| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `conf` | 용도 불명 (항상 빈값) | `` |
| `date` | 조회할 월 (YYYYMM01 형식) | `20260301` |
| `bmain` | 뷰 타입 (항상 `list`) | `list` |

- 월 이동: `date` 파라미터 값만 변경 (예: `20260401`)
- 예약 상세: `menu4_sub1_3.php?...` 로 이동

---

## HTML 구조

### 캘린더 테이블

```html
<table id="nongdo_schedule" summary="체험예약">
  <thead>
    <tr><!-- 년/월 표시 + 이전/다음 월 네비게이션 --></tr>
    <tr class="days">
      <th class="title1">SUN</th>
      <th class="title2">MON</th>
      <th class="title3">TUE</th>
      <th class="title4">WED</th>
      <th class="title5">THU</th>
      <th class="title6">FRI</th>
      <th class="title7">SAT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><!-- 날짜 셀 --></td>
      ...
    </tr>
  </tbody>
</table>
```

---

### 날짜 셀 상태별 HTML

#### 1. 예약마감 (Closed)

```html
<td valign="top" width="14%" align="left" class="cont1">
    &nbsp; 1  <br>
    <font class="small">
        <div align="center">
            <img src="/image/menu4/icon_1.gif" alt="예약마감">
        </div>
    </font>
</td>
```

- **감지 조건**: `img[alt="예약마감"]` 또는 `img[src*="icon_1.gif"]` 존재
- 주말(토/일)에만 해당 아이콘이 표시됨

#### 2. 예약가능 (Available) — 취소 물량 발생

```html
<td valign="top" width="14%" align="left" class="cont7">
    &nbsp; 7  <br>
    <font class="small">
        <div align="center">
            <a href="menu4_sub1_3.php?conf=&date=20260307&bmain=list">
                <img src="/image/menu4/icon_2.gif" alt="예약가능">
            </a>
        </div>
    </font>
</td>
```

- **감지 조건**: `<a>` 태그가 포함된 셀 (`href`에 `menu4_sub1_3.php` 포함)
- 마감 → 가능 전환 = **취소 물량 발생!**

#### 3. 미운영 (Not Operating)

```html
<td valign="top" width="14%" align="left" class="cont2">&nbsp;3 </td>
```

- **감지 조건**: `<img>` 및 `<a>` 태그 모두 없음
- 평일이거나 체험 运영하지 않는 날

#### 4. 빈 셀 (월 시작/끝 패딩)

```html
<td valign="top" width="14%" align="left" class="cont7" bgcolor="ffffff">&nbsp; </td>
```

- **감지 조건**: `bgcolor="ffffff"` 또는 텍스트 내용이 공백만

---

## CSS 클래스 매핑

| 클래스 | 요일 | 텍스트 색상 |
|--------|------|-------------|
| `cont1` | 일요일 (SUN) | 빨강 |
| `cont2` | 월~금 (MON-FRI) | 검정 |
| `cont7` | 토요일 (SAT) | 파랑 |

---

## 예약 운영 규칙

| 항목 | 설명 |
|------|------|
| 체험 가능일 | 주로 **토요일, 일요일** |
| 예약 오픈 | 매월 **1일 09:00**, 다다음 달 예약 오픈 |
| 체험 종류 | 가족(개인)체험 |
| 인기도 | 매우 높음 — 오픈 직후 대부분 마감 |

---

## 월 네비게이션

- **이전/다음 월 버튼**: `<a>` 태그로 `date` 파라미터만 변경
- **월 선택 드롭다운**: `<select>` 태그 → `dateChange()` JavaScript 함수 호출
- 단, 페이지가 완전 리로드됨 (SPA 아님)

---

## 스크래핑 전략

1. `axios`로 월별 URL에 HTTP GET 요청
2. `cheerio`로 `#nongdo_schedule tbody td` 셀레터로 모든 날짜 셀 선택
3. 각 셀에서:
   - 텍스트로 날짜 숫자 추출 (`&nbsp;` 제거 후 `trim()`)
   - `img[alt="예약마감"]` 존재 → 마감
   - `a[href*="menu4_sub1_3"]` 존재 → **가능** (알림!)
   - 둘 다 없음 → 미운영 또는 빈 셀
4. 셀의 `class` 속성으로 요일 판별 (`cont1`=일, `cont7`=토, `cont2`=평일)
