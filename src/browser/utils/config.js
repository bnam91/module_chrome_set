/**
 * 설정 파일 읽기 유틸리티
 * 
 * 목적: 브라우저 프로필이 저장될 사용자 데이터 디렉토리 경로를
 *       설정 파일에서 읽어옵니다.
 * 
 * 기능:
 * - src/browser/config/config.txt 파일에서 경로 읽기
 * - 파일이 없거나 비어있을 경우 에러 메시지 출력 및 종료
 * - 읽은 경로값 반환
 */

const fs = require('fs');
const path = require('path');

/**
 * config.txt 파일에서 경로 읽기
 * @returns {string} 사용자 데이터 디렉토리 경로
 */
function readPathFromFile() {
  const configPath = path.join(__dirname, '..', 'config', 'config.txt');
  
  try {
    if (!fs.existsSync(configPath)) {
      console.error(`\n❌ config.txt 파일을 찾을 수 없습니다.`);
      console.error(`src/browser/config/config.txt 파일을 생성하고 경로를 입력해주세요.`);
      console.error(`예시 (Windows): C:\\Users\\신현빈\\Desktop\\github\\user_data`);
      console.error(`예시 (Mac): /Users/a1/Documents/github/user_data\n`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(configPath, 'utf-8');
    const pathValue = content.trim();
    
    if (!pathValue) {
      console.error(`\n❌ config.txt 파일이 비어있습니다.`);
      console.error(`경로를 입력해주세요.\n`);
      process.exit(1);
    }
    
    return pathValue;
  } catch (error) {
    console.error(`\n❌ config.txt 파일 읽기 중 오류: ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { readPathFromFile };

