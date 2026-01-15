/**
 * CDP (Chrome DevTools Protocol) 유틸리티
 * 
 * 목적: 자동화 탐지 방지를 위한 CDP 설정을 제공합니다.
 * 
 * 기능:
 * - CDP 세션 생성 및 자동화 탐지 방지 스크립트 주입
 * - User-Agent 및 언어 설정 오버라이드
 * - 모든 새 페이지에 자동 적용
 */

/**
 * CDP를 사용하여 자동화 탐지 방지 설정 적용
 * @param {Object} page - Puppeteer 페이지 객체
 * @param {Object} browser - Puppeteer 브라우저 객체 (선택사항, 새 페이지에도 적용하려면 필요)
 */
async function setupCDP(page, browser = null) {
  try {
    // CDP 클라이언트 생성
    const client = await page.target().createCDPSession();
    
    // CDP를 사용한 자동화 탐지 방지 스크립트
    const antiDetectionScript = `
      // navigator.webdriver 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // window.chrome 객체 추가 (일반 브라우저처럼 보이게)
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // navigator.plugins 설정
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const plugins = [];
          for (let i = 0; i < 5; i++) {
            plugins.push({
              0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
              description: 'Portable Document Format',
              filename: 'internal-pdf-viewer',
              length: 1,
              name: 'Chrome PDF Plugin'
            });
          }
          return plugins;
        },
      });
      
      // navigator.languages 설정
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en'],
      });
      
      // navigator.platform 설정
      Object.defineProperty(navigator, 'platform', {
        get: () => 'MacIntel',
      });
      
      // Permission API 오버라이드
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // WebGL Vendor/Renderer 정보 오버라이드
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.call(this, parameter);
      };
      
      // Canvas fingerprinting 방지
      const toBlob = HTMLCanvasElement.prototype.toBlob;
      const toDataURL = HTMLCanvasElement.prototype.toDataURL;
      const getImageData = CanvasRenderingContext2D.prototype.getImageData;
      
      HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
        const canvas = this;
        return toBlob.call(canvas, callback, type, quality);
      };
      
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        return toDataURL.call(this, type, quality);
      };
    `;
    
    // CDP를 사용하여 새 문서에 스크립트 추가 (모든 새 페이지에 자동 적용)
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: antiDetectionScript
    });
    
    // User-Agent 및 언어 설정 오버라이드
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await client.send('Network.setUserAgentOverride', {
      userAgent: userAgent,
      acceptLanguage: 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    console.log('✅ CDP를 사용한 자동화 탐지 방지 설정 완료');
    
    // 브라우저가 제공되면 모든 기존 페이지에도 적용
    if (browser) {
      const pages = await browser.pages();
      for (const p of pages) {
        if (p !== page) {
          try {
            const pageClient = await p.target().createCDPSession();
            await pageClient.send('Page.addScriptToEvaluateOnNewDocument', {
              source: antiDetectionScript
            });
            await pageClient.send('Network.setUserAgentOverride', {
              userAgent: userAgent,
              acceptLanguage: 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            });
          } catch (e) {
            // 페이지가 이미 닫혔거나 접근할 수 없는 경우 무시
            console.warn('페이지에 CDP 적용 실패:', e.message);
          }
        }
      }
    }
    
    return client;
  } catch (error) {
    console.error('CDP 설정 중 오류:', error.message);
    throw error;
  }
}

module.exports = { setupCDP };
