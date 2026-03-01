# 텔레그램 봇 설정 가이드

농도원 목장 모니터에서 텔레그램 알림을 받기 위한 설정 가이드.

---

## 1단계: 봇 생성 (BotFather)

1. Telegram 앱에서 **@BotFather** 검색 후 대화 시작
2. `/newbot` 명령어 입력
3. 봇 이름 입력 (예: `농도원 모니터`)
4. 봇 사용자명 입력 (예: `nongdo_monitor_bot`) — `_bot`으로 끝나야 함
5. 생성 완료 시 **Bot Token** 이 표시됨:
   ```
   Use this token to access the HTTP Bot API:
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. 이 토큰을 복사해 둔다

---

## 2단계: Chat ID 확인

### 방법 A: 개인 Chat ID (본인에게만 알림)

1. Telegram에서 **@userinfobot** 검색 후 `/start` 입력
2. 표시되는 **Id** 값이 Chat ID
3. 또는 **@RawDataBot** 에게 아무 메시지 → `"id"` 필드 확인

### 방법 B: 그룹 Chat ID (그룹에 알림)

1. 봇을 그룹에 추가
2. 그룹에서 아무 메시지 입력
3. 브라우저에서 접속:
   ```
   https://api.telegram.org/bot{BOT_TOKEN}/getUpdates
   ```
4. JSON 응답에서 `"chat": { "id": -123456789 }` 의 id 값 사용
   - 그룹 Chat ID는 보통 음수(-)로 시작

---

## 3단계: .env 파일 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 내용을 입력:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
PORT=3000
MONITOR_INTERVAL_SECONDS=60
```

---

## 4단계: 연결 테스트

1. 서버 실행: `npm start`
2. 웹 UI (http://localhost:3000) 에서 **"테스트 메시지 전송"** 버튼 클릭
3. 또는 API 직접 호출:
   ```
   POST http://localhost:3000/api/telegram-test
   ```
4. 텔레그램에 테스트 메시지가 도착하면 성공!

---

## 참고

- 봇 토큰은 `.env` 파일에만 저장 (`.gitignore`에 포함됨)
- 봇 토큰이 노출되면 BotFather에서 `/revoke` 실행하여 재발급
- Chat ID는 변경되지 않으므로 한번 확인하면 됨
