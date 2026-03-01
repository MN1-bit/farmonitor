# Cloudflare Tunnel 외부 접속 가이드

로컬 PC에서 실행 중인 농도원 모니터를 외부(모바일 등)에서 접속할 수 있도록 Cloudflare Tunnel을 설정하는 가이드.

> Cloudflare Tunnel은 무료이며, 도메인 없이도 임시 URL을 생성할 수 있다.

---

## 방법 1: 빠른 시작 (도메인 없이, 임시 URL)

### 1단계: cloudflared 설치

```powershell
# winget 사용
winget install --id Cloudflare.cloudflared

# 또는 직접 다운로드
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

### 2단계: 터널 실행

```powershell
cloudflared tunnel --url http://localhost:3000
```

실행하면 아래와 같은 임시 URL이 생성됨:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-words-1234.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

이 URL을 모바일 브라우저에서 접속하면 된다.

> ⚠️ 주의: 이 URL은 `cloudflared`를 종료하면 사라진다. PC를 끄면 접속 불가.

---

## 방법 2: 영구 설정 (도메인 연결)

자체 도메인이 있고, PC가 켜져있는 동안 항상 접속 가능하게 하려면:

### 1단계: Cloudflare 계정 생성 및 도메인 등록

1. [Cloudflare](https://dash.cloudflare.com/) 계정 생성
2. 도메인을 Cloudflare DNS로 설정

### 2단계: 로그인 및 터널 생성

```powershell
cloudflared tunnel login
cloudflared tunnel create farmonitor
```

### 3단계: 설정 파일 생성

`%USERPROFILE%\.cloudflared\config.yml` 파일 생성:

```yaml
tunnel: farmonitor
credentials-file: C:\Users\<USERNAME>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: farm.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 4단계: DNS 레코드 추가

```powershell
cloudflared tunnel route dns farmonitor farm.yourdomain.com
```

### 5단계: 터널 실행

```powershell
cloudflared tunnel run farmonitor
```

---

## PM2와 결합 (24/7 운영)

### PM2로 앱 실행

```powershell
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # 시스템 부팅 시 자동 실행 (관리자 권한 필요)
```

### cloudflared 를 Windows 서비스로 등록

```powershell
# 관리자 PowerShell에서 실행
cloudflared service install
```

이렇게 하면 PC 재부팅 후에도 자동으로 터널이 열린다.

---

## 요약

| 방법 | 도메인 필요 | 영구성 | 난이도 |
|------|-------------|--------|--------|
| 방법 1 (임시) | ❌ | 매번 새 URL | ⭐ |
| 방법 2 (영구) | ✅ | 항상 같은 URL | ⭐⭐⭐ |
