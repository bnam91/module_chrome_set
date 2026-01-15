/**
 * module-chrome-set
 * 크롬 브라우저 자동 실행 모듈
 * 
 * 이 모듈은 Puppeteer를 사용하여 크롬 브라우저를 프로필별로 실행하고 관리합니다.
 */

const { openBrowser } = require('./src/browser/chrome-profile');

// 메인 함수 export
module.exports = {
  openBrowser,
};

// 기본 export로도 사용 가능하도록
module.exports.default = openBrowser;
