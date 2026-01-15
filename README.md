# module-chrome-set

크롬 브라우저를 프로필별로 자동 실행하고 관리하는 Node.js 모듈입니다.

## 주요 기능

### 1. 프로필 관리
- **다중 프로필 지원**: 여러 크롬 프로필을 생성하고 관리할 수 있습니다
- **프로필 자동 생성**: 프로필이 없을 경우 대화형으로 새 프로필 생성
- **프로필 접두사**: `google_`, `naver_` 접두사를 자동으로 추가하여 프로필 구분
- **프로필 선택**: 실행 시 사용 가능한 프로필 목록에서 선택

### 2. 자동 캐시/쿠키 정리
- **14일 주기 자동 정리**: 설정된 주기마다 자동으로 캐시와 쿠키를 정리
- **디스크 공간 절약**: 불필요한 캐시 파일 자동 삭제
- **성능 유지**: 브라우저 성능을 최적 상태로 유지

### 3. 브라우저 최적화
- **캐시 크기 제한**: 디스크 캐시 100MB, 메모리 캐시 50MB로 제한
- **백그라운드 네트워킹 비활성화**: 불필요한 데이터 저장 방지
- **서비스 워커 비활성화**: 캐시 누적 방지
- **자동화 감지 방지**: `--disable-blink-features=AutomationControlled` 옵션 적용
- **크로스 플랫폼 지원**: macOS, Windows, Linux에서 Chrome 경로 자동 감지

### 4. 락 파일 관리
- **자동 락 파일 정리**: 이전 실행에서 남은 락 파일 자동 제거
- **안정적인 실행**: 프로필 충돌 방지

### 5. 자동 페이지 열기
- **기본 페이지**: 구글, 네이버 자동 열기
- **커스텀 URL**: `url` 옵션으로 새 탭에서 열 URL 지정 가능 (기본값: naver.com)
- **대기 시간**: `waitTime` 옵션으로 URL 이동 후 대기 시간 지정 (초 단위)
- **추가 탭 옵션**: `openExtraTab` 옵션으로 추가 탭 열기 가능

### 6. CDP 기반 자동화 탐지 방지 (옵션)
- **선택적 사용**: `useCDP` 옵션으로 활성화 가능
- **강력한 탐지 방지**: 
  - `navigator.webdriver` 완전 제거
  - `window.chrome` 객체 추가
  - Canvas/WebGL fingerprinting 방지
  - 모든 새 페이지에 자동 적용
- **무거운 작업에 적합**: 크롤링, 스크래핑 등에 권장

## 설치

```bash
npm install module-chrome-set
```

또는 Git 서브모듈로 추가:

```bash
git submodule add https://github.com/bnam91/module_chrome_set [경로]
```

## 설정

### 1. 프로필 경로 설정

`src/browser/config/config.js` 파일에 크롬 프로필이 저장될 경로를 설정합니다.

**예시:**
```javascript
module.exports = {
  profilePath: '~/Documents/github_cloud/user_data',
};
```

**참고:**
- `~` 는 홈 디렉토리로 자동 확장됩니다
- Mac: `~/Documents/github_cloud/user_data` → `/Users/a1/Documents/github_cloud/user_data`
- Windows: `~/Documents/github_cloud/user_data` → `C:\Users\a1\Documents\github_cloud\user_data`
- Windows 백슬래시(`\`)도 슬래시(`/`)로 자동 변환됩니다

### 2. 프로필 생성

**CLI 환경 (기본):**
- 프로그램 실행 시 프로필이 없으면 대화형으로 새 프로필을 생성할 수 있습니다.

**Electron/자동화 환경:**
- `profileName` 옵션으로 프로필을 직접 지정하거나 `useDefaultProfile: true`로 Chrome 기본 프로필을 사용하세요.
- 대화형 입력이 불가능한 환경에서는 반드시 옵션을 지정해야 합니다.

## 사용법

### 기본 사용 (모듈로 사용)

```javascript
const { openBrowser } = require('module-chrome-set');

// 기본 실행
openBrowser();

// 추가 탭 열기 옵션
openBrowser({ openExtraTab: true });
```

### 직접 실행

```bash
# npm 스크립트로 실행 (크롬 실행 테스트)
npm run dev

# 또는 직접 실행
node test_scripts.js
```

### 연결 테스트 (크롬 실행 없음)

```bash
# 각 기능이 제대로 연결되었는지 확인
npm test

# 또는 직접 실행
node test.js
```

**주의**: `test.js`는 기능 연결 확인용 테스트 스크립트입니다. 실제 사용하기에는 적합하지 않습니다.

## API

### `openBrowser(options)`

크롬 브라우저를 지정된 프로필로 실행합니다.

**매개변수:**
- `options` (Object, 선택사항)
  - `openExtraTab` (Boolean): 추가 탭을 열지 여부 (기본값: `false`)
  - `useCDP` (Boolean): CDP를 사용한 강력한 자동화 탐지 방지 적용 여부 (기본값: `false`)
  - `profileName` (String): 프로필 이름 직접 지정 (대화형 입력 생략, Electron/자동화 환경 권장)
  - `profilePath` (String): 프로필 경로 직접 지정 (전체 경로)
  - `useDefaultProfile` (Boolean): Chrome 기본 프로필 사용 (기본값: `false`)
    - ⚠️ **주의**: Chrome이 실행 중이면 캐시 충돌 위험이 있습니다. 별도 프로필 사용을 권장합니다.
  - `url` (String): 새 탭에서 열 URL (기본값: `'https://www.naver.com'`)
  - `waitTime` (Number): URL 이동 후 대기 시간(초) (기본값: `0`)

**옵션 설명:**

#### `openExtraTab`
- `true`: 추가 탭을 엽니다
- `false`: 기본 탭만 사용 (기본값)

#### `useCDP`
- `false`: 기본 자동화 탐지 방지만 사용 (빠르고 가벼움, 기본값)
- `true`: CDP를 사용한 강력한 자동화 탐지 방지 적용
  - `navigator.webdriver` 완전 제거
  - `window.chrome` 객체 추가
  - Canvas/WebGL fingerprinting 방지
  - 모든 새 페이지에 자동 적용
  - 크롤링/스크래핑 등 무거운 작업에 권장

**예시:**
```javascript
const { openBrowser } = require('module-chrome-set');

// 기본 실행 (CLI 환경, 대화형 프로필 선택)
await openBrowser();

// Electron/자동화 환경: 프로필 이름 직접 지정
await openBrowser({ 
  profileName: 'bnam91' 
});

// Chrome 기본 프로필 사용 (시스템 기본 Chrome 프로필)
// ⚠️ 주의: Chrome이 실행 중이면 캐시 충돌 위험이 있습니다
await openBrowser({ 
  useDefaultProfile: true 
});

// 프로필 경로 직접 지정
await openBrowser({ 
  profilePath: '~/Documents/github_cloud/user_data/google_bnam91' 
});

// 커스텀 URL 및 대기 시간 지정
await openBrowser({ 
  profileName: 'bnam91',
  url: 'https://www.google.com',  // naver.com 대신 google.com 사용
  waitTime: 5  // 5초 대기
});

// 모든 옵션 사용
await openBrowser({ 
  profileName: 'bnam91',
  openExtraTab: true,
  useCDP: true,
  url: 'https://www.google.com',  // 다른 URL 지정
  waitTime: 5  // 5초 대기
});
```

**Electron/서브모듈 사용 시:**
```javascript
// 대화형 입력 없이 사용 (필수)
const browser = await openBrowser({ 
  profileName: 'bnam91',  // 또는 useDefaultProfile: true
  useCDP: true 
});

// 브라우저 객체를 반환받아 직접 관리 가능
// (CLI 환경이 아닐 경우 자동으로 브라우저 객체 반환)
```

## 프로젝트 구조

```
module-chrome-set/
├── index.js                    # 모듈 진입점
├── scripts.js                  # 실행 스크립트
├── package.json                # 패키지 설정
├── src/
│   ├── browser/
│   │   ├── chrome-profile.js   # 메인 모듈
│   │   ├── config/
│   │   │   └── config.js       # 프로필 경로 설정
│   │   └── utils/
│   │       ├── cleanup.js      # 캐시/쿠키 정리
│   │       ├── config.js       # 설정 파일 읽기
│   │       ├── locks.js        # 락 파일 관리
│   │       ├── openExtraTab.js # 추가 탭 열기
│   │       ├── profile.js      # 프로필 관리
│   │       └── readline.js     # 사용자 입력 처리
```

## 주요 기능 상세

### 프로필 관리
- 프로필 이름에 `google_` 또는 `naver_` 접두사 자동 추가
- 프로필 목록 조회 및 선택
- 새 프로필 생성 시 유효성 검사 (특수문자 제한)
- 프로필 디렉토리 자동 생성

### 캐시 정리
- 14일 주기로 자동 실행
- 브라우저 쿠키 및 캐시 삭제
- 디스크 캐시 디렉토리 삭제:
  - `Default/Cache`
  - `Default/Code Cache`
  - `Default/Service Worker/CacheStorage`
- 마지막 정리 시간 추적 (`.last_cleaned.json`)

### 브라우저 옵션
- 최대화된 창으로 시작
- 자동화 감지 방지
- HTTPS 에러 무시
- 캐시 크기 제한
- 백그라운드 네트워킹 비활성화

## 요구사항

- Node.js
- Puppeteer
- Google Chrome (Mac의 경우 `/Applications/Google Chrome.app` 경로에 설치 필요)

## 라이선스

ISC

## 기여

이슈 및 풀 리퀘스트를 환영합니다!
