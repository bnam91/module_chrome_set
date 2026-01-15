const puppeteer = require('puppeteer');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { cleanIfNeeded, CLEAN_INTERVAL_MS } = require('./utils/cleanup');
const { openExtraTab } = require('./utils/openExtraTab');
const { readPathFromFile } = require('./utils/config');
const { selectProfile, ensureProfileDirectory } = require('./utils/profile');
const { clearSingletonLocks } = require('./utils/locks');
const { rl } = require('./utils/readline');

async function openCoupang(options = {}) {
  let browser;
  
  try {
    // 사용자 프로필 경로 설정 (config.txt에서 읽기)
    const userDataParent = readPathFromFile();
    
    // 프로필 선택
    const selectedProfile = await selectProfile(userDataParent);
    if (!selectedProfile) {
      console.log("프로필을 선택할 수 없습니다. 프로그램을 종료합니다.");
      rl.close();
      return;
    }
    
    const userDataDir = path.join(userDataParent, selectedProfile);
    
    // 프로필 디렉토리 확인 및 생성
    await ensureProfileDirectory(userDataDir);
    
    // 이전 실행에서 남은 락 파일 제거
    await clearSingletonLocks(userDataDir);
    
    // Chrome 경로
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    
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
    
    // Chrome이 있으면 사용
    if (fs.existsSync(chromePath)) {
      browserOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(browserOptions);
    console.log('✅ 크롬이 열렸습니다. 종료하려면 Ctrl+C를 누르세요.\n');

    // 첫 번째 페이지 사용
    const pages = await browser.pages();
    const page = pages[0];

    // 14일 단위 캐시/쿠키 청소 (로그인 세션이 만료될 수 있음)
    const cleaned = await cleanIfNeeded(userDataDir, page);
    if (cleaned) {
      const days = Math.round(CLEAN_INTERVAL_MS / (1000 * 60 * 60 * 24));
      console.log(`🧹 ${days}일 주기 청소 완료 (캐시/쿠키 및 디스크 캐시 삭제).`);
    }

    // 구글로 이동
    await page.goto('https://www.google.com');

    // 새 탭 열어 네이버 이동
    const newPage = await browser.newPage();
    await newPage.goto('https://www.naver.com');

    // scripts.js에서 실행했을 때만 추가 새 탭 열기
    if (options.openExtraTab) {
      await openExtraTab(browser);
    }

    // 브라우저 종료 감지
    browser.on('disconnected', () => {
      console.log('브라우저가 닫혔습니다.');
      process.exit(0);
    });

    // 무한 대기
    await new Promise(() => {});

  } catch (error) {
    console.error('오류:', error.message);
    rl.close();
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ctrl+C 종료 처리
process.on('SIGINT', async () => {
  console.log('\n종료 중...');
  rl.close();
  process.exit(0);
});

// 스크립트 단독 실행 시 바로 실행
if (require.main === module) {
  openCoupang();
}

// 모듈 사용 시 외부에서 실행할 수 있도록 export
module.exports = { openCoupang };

