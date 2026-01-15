/**
 * 추가 탭 열기 유틸리티
 * 
 * 목적: scripts.js에서 실행할 때만 추가로 새 탭을 열어
 *       '새탭입니다' 텍스트를 표시합니다.
 * 
 * 기능:
 * - 브라우저에 새 페이지 생성
 * - HTML 콘텐츠로 '새탭입니다' 텍스트 표시
 */

/**
 * 추가 새 탭을 열고 '새탭입니다' 텍스트를 표시하는 함수
 * @param {Object} browser - Puppeteer 브라우저 인스턴스
 */
async function openExtraTab(browser) {
  const extraTab = await browser.newPage();
  await extraTab.setContent('<html><body><h1>새탭입니다</h1></body></html>');
}

module.exports = { openExtraTab };

