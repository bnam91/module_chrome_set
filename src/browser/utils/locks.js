/**
 * 브라우저 락 파일 정리 유틸리티
 * 
 * 목적: 이전 실행에서 남아있는 락 파일을 제거하여
 *       브라우저 프로필이 정상적으로 실행될 수 있도록 합니다.
 * 
 * 기능:
 * - SingletonLock, SingletonCookie, SingletonSocket 파일 삭제
 * - 파일이 없거나 삭제 실패 시 경고 메시지만 출력하고 계속 진행
 */

const fsPromises = require('fs').promises;
const path = require('path');

/**
 * 크롬 프로필이 이미 실행 중일 때 남아 있는 락 파일을 정리
 * @param {string} profileDir - 프로필 디렉토리 경로
 */
async function clearSingletonLocks(profileDir) {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const file of lockFiles) {
    const target = path.join(profileDir, file);
    try {
      await fsPromises.rm(target, { force: true });
    } catch (e) {
      console.log(`락 파일 제거 중 경고 (${file}): ${e.message}`);
    }
  }
}

module.exports = { clearSingletonLocks };

