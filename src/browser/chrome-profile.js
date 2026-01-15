const puppeteer = require('puppeteer');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { cleanIfNeeded, CLEAN_INTERVAL_MS } = require('./utils/chrome/cleanup');
const { openExtraTab } = require('./utils/chrome/openExtraTab');
const { readPathFromFile } = require('./utils/chrome/config');
const { selectProfile, ensureProfileDirectory } = require('./utils/chrome/profile');
const { clearSingletonLocks } = require('./utils/chrome/locks');
const { rl } = require('./utils/chrome/readline');
const { setupCDP } = require('./utils/chrome/cdp');
const { findChromePath } = require('./utils/chrome/chromePath');
const { getDefaultChromeProfilePath, getDefaultProfileName } = require('./utils/chrome/defaultProfile');

async function openCoupang(options = {}) {
  let browser;
  
  // 옵션 파싱
  const {
    openExtraTab: shouldOpenExtraTab = false,
    useCDP = false,  // CDP 사용 여부 (기본값: false)
    profileName = null,  // 프로필 이름 직접 지정 (옵션)
    useDefaultProfile = false,  // Chrome 기본 프로필 사용 (옵션)
    profilePath = null,  // 프로필 경로 직접 지정 (옵션)
    url = 'https://www.naver.com',  // 새 탭에서 열 URL (기본값: naver.com)
    waitTime = 0,  // URL 이동 후 대기 시간(초) (기본값: 0)
  } = options;
  
  try {
    let userDataDir;
    let selectedProfile;
    
    // 옵션 1: Chrome 기본 프로필 사용
    if (useDefaultProfile) {
      const chromeProfilePath = getDefaultChromeProfilePath();
      const defaultProfileName = await getDefaultProfileName(chromeProfilePath);
      
      if (!defaultProfileName) {
        throw new Error('Chrome 기본 프로필을 찾을 수 없습니다.');
      }
      
      userDataDir = path.join(chromeProfilePath, defaultProfileName);
      selectedProfile = defaultProfileName;
      console.log(`✅ Chrome 기본 프로필 사용: ${defaultProfileName}`);
    }
    // 옵션 2: 프로필 이름 직접 지정
    else if (profileName) {
      const userDataParent = profilePath || readPathFromFile();
      userDataDir = path.join(userDataParent, profileName);
      selectedProfile = profileName;
      console.log(`✅ 지정된 프로필 사용: ${profileName}`);
    }
    // 옵션 3: 프로필 경로 직접 지정
    else if (profilePath) {
      userDataDir = profilePath;
      selectedProfile = path.basename(profilePath);
      console.log(`✅ 지정된 프로필 경로 사용: ${profilePath}`);
    }
    // 옵션 4: 대화형 선택 (기본, CLI 환경)
    else {
      const userDataParent = readPathFromFile();
      
      // stdin이 없으면 (Electron/자동화 환경) 에러
      if (!process.stdin.isTTY) {
        throw new Error('대화형 입력이 불가능합니다. profileName, profilePath, 또는 useDefaultProfile 옵션을 사용하세요.');
      }
      
      // 프로필 선택
      selectedProfile = await selectProfile(userDataParent);
      if (!selectedProfile) {
        console.log("프로필을 선택할 수 없습니다. 프로그램을 종료합니다.");
        rl.close();
        return;
      }
      
      userDataDir = path.join(userDataParent, selectedProfile);
    }
    
    // 프로필 디렉토리 확인 및 생성
    await ensureProfileDirectory(userDataDir);
    
    // 이전 실행에서 남은 락 파일 제거
    // Chrome 기본 프로필 사용 시 실행 중이면 경고
    const isInUse = await clearSingletonLocks(userDataDir, false);
    if (isInUse && useDefaultProfile) {
      console.warn('💡 Chrome 기본 프로필 대신 별도 프로필 사용을 권장합니다.');
      console.warn('   예: profileName 옵션으로 별도 프로필 지정');
    }
    
    // Chrome 경로 자동 감지 (플랫폼별)
    const chromePath = await findChromePath();
    
    // 브라우저 실행 옵션
    const browserOptions = {
      headless: false,
      defaultViewport: null,
      userDataDir: userDataDir,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        // 캐시 크기 제한 (100MB로 제한)
        '--disk-cache-size=104857600',
        // 메모리 캐시 크기 제한 (50MB로 제한)
        '--media-cache-size=52428800',
        // 백그라운드 네트워킹 비활성화 (불필요한 데이터 저장 방지)
        '--disable-background-networking',
        // 서비스 워커 비활성화 (캐시 누적 방지)
        '--disable-background-timer-throttling',
      ],
      ignoreHTTPSErrors: true,
    };
    
    // Chrome 경로가 발견되면 사용
    if (chromePath) {
      browserOptions.executablePath = chromePath;
      console.log(`✅ Chrome 경로: ${chromePath}`);
    } else {
      console.warn('⚠️ Chrome 경로를 찾을 수 없습니다. 시스템 기본 Chrome을 사용합니다.');
    }

    browser = await puppeteer.launch(browserOptions);
    if (process.stdin.isTTY) {
      console.log('✅ 크롬이 열렸습니다. 종료하려면 Ctrl+C를 누르세요.\n');
    } else {
      console.log('✅ 크롬이 열렸습니다.\n');
    }

    // 첫 번째 페이지 사용
    const pages = await browser.pages();
    const page = pages[0];

    // CDP 설정 적용 (옵션)
    if (useCDP) {
      await setupCDP(page, browser);
    }

    // 14일 단위 캐시 청소 (쿠키는 유지하여 로그인 정보 보존)
    const cleaned = await cleanIfNeeded(userDataDir, page);
    if (cleaned) {
      const days = Math.round(CLEAN_INTERVAL_MS / (1000 * 60 * 60 * 24));
      console.log(`🧹 ${days}일 주기 청소 완료 (캐시 및 디스크 캐시 삭제, 로그인 정보 유지).`);
    }

    // 구글로 이동
    await page.goto('https://www.google.com');

    // 새 탭 열어 지정된 URL로 이동
    const newPage = await browser.newPage();
    await newPage.goto(url);
    
    // 대기 시간이 지정된 경우 대기
    if (waitTime > 0) {
      console.log(`${waitTime}초 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      console.log('대기 완료.');
    }

    // scripts.js에서 실행했을 때만 추가 새 탭 열기
    if (shouldOpenExtraTab) {
      await openExtraTab(browser);
    }

    // 브라우저 객체 반환 (서브모듈 사용 시)
    // 무한 대기는 CLI 환경에서만 필요
    if (process.stdin.isTTY) {
      // 브라우저 종료 감지 (CLI 환경)
      browser.on('disconnected', () => {
        console.log('브라우저가 닫혔습니다.');
        process.exit(0);
      });
      
      // 무한 대기 (CLI 환경)
      await new Promise(() => {});
    } else {
      // 서브모듈 사용 시 브라우저 객체 반환
      return browser;
    }

  } catch (error) {
    console.error('오류:', error.message);
    // readline이 사용된 경우에만 close
    if (process.stdin.isTTY && rl) {
      rl.close();
    }
    throw error;  // process.exit 대신 에러 throw
  } finally {
    // readline이 사용된 경우에만 close
    if (process.stdin.isTTY && rl) {
      rl.close();
    }
  }
}

// Ctrl+C 종료 처리 (CLI 환경에서만)
if (process.stdin.isTTY) {
  process.on('SIGINT', async () => {
    console.log('\n종료 중...');
    if (rl) {
      rl.close();
    }
    process.exit(0);
  });
}

// 스크립트 단독 실행 시 바로 실행
if (require.main === module) {
  openCoupang();
}

// 모듈 사용 시 외부에서 실행할 수 있도록 export
module.exports = { openCoupang };

