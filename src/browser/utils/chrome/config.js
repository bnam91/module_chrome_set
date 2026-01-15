/**
 * 설정 파일 읽기 유틸리티
 * 
 * 목적: 브라우저 프로필이 저장될 사용자 데이터 디렉토리 경로를
 *       설정 파일에서 읽어옵니다.
 * 
 * 기능:
 * - src/browser/config/config.js 파일에서 경로 읽기
 * - 파일이 없거나 경로가 설정되지 않은 경우 에러 메시지 출력 및 종료
 * - 읽은 경로값 반환 (~ 는 홈 디렉토리로 자동 확장)
 */

const path = require('path');
const os = require('os');

/**
 * config.js 파일에서 경로 읽기
 * @returns {string} 사용자 데이터 디렉토리 경로
 */
function readPathFromFile() {
  const configPath = path.join(__dirname, '..', '..', 'config', 'config.js');
  
  try {
    // config.js 파일 로드
    const config = require(configPath);
    
    if (!config || !config.profilePath) {
      console.error(`\n❌ config.js 파일에 profilePath가 설정되지 않았습니다.`);
      console.error(`src/browser/config/config.js 파일을 확인해주세요.`);
      console.error(`예시: module.exports = { profilePath: '~/Documents/github_cloud/user_data' };\n`);
      process.exit(1);
    }
    
    let pathValue = config.profilePath.trim();
    
    if (!pathValue) {
      console.error(`\n❌ config.js의 profilePath가 비어있습니다.`);
      console.error(`경로를 입력해주세요.\n`);
      process.exit(1);
    }
    
    // Windows 백슬래시를 슬래시로 정규화
    pathValue = pathValue.replace(/\\/g, '/');
    
    // ~ 를 홈 디렉토리로 확장
    if (pathValue.startsWith('~/') || pathValue === '~') {
      const homeDir = os.homedir();
      // Windows에서는 백슬래시로 변환
      if (process.platform === 'win32') {
        pathValue = pathValue.replace(/^~/, homeDir.replace(/\\/g, '/'));
        pathValue = pathValue.replace(/\//g, '\\');
      } else {
        pathValue = pathValue.replace(/^~/, homeDir);
      }
    }
    
    return pathValue;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`\n❌ config.js 파일을 찾을 수 없습니다.`);
      console.error(`src/browser/config/config.js 파일을 생성하고 경로를 설정해주세요.`);
      console.error(`예시: module.exports = { profilePath: '~/Documents/github_cloud/user_data' };\n`);
    } else {
      console.error(`\n❌ config.js 파일 읽기 중 오류: ${error.message}\n`);
    }
    process.exit(1);
  }
}

module.exports = { readPathFromFile };

