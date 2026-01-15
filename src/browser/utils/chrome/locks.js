/**
 * 브라우저 락 파일 정리 유틸리티
 * 
 * 목적: 이전 실행에서 남아있는 락 파일을 제거하여
 *       브라우저 프로필이 정상적으로 실행될 수 있도록 합니다.
 * 
 * 기능:
 * - SingletonLock, SingletonCookie, SingletonSocket 파일 삭제
 * - 프로필이 실행 중인지 확인
 * - 파일이 없거나 삭제 실패 시 경고 메시지만 출력하고 계속 진행
 */

const fsPromises = require('fs').promises;
const path = require('path');

/**
 * 프로필이 현재 실행 중인지 확인
 * @param {string} profileDir - 프로필 디렉토리 경로
 * @returns {Promise<boolean>} 실행 중이면 true
 */
async function isProfileInUse(profileDir) {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  
  for (const file of lockFiles) {
    const target = path.join(profileDir, file);
    try {
      // 파일이 존재하고 접근 가능하면 실행 중
      await fsPromises.access(target);
      
      // 파일이 잠겨있는지 확인 (Windows에서는 파일이 열려있으면 삭제 불가)
      try {
        await fsPromises.rm(target, { force: true });
        // 삭제 성공 = 이전 실행의 남은 파일
      } catch (e) {
        // 삭제 실패 = 현재 실행 중
        return true;
      }
    } catch {
      // 파일이 없으면 실행 중이 아님
      continue;
    }
  }
  
  return false;
}

/**
 * 크롬 프로필이 이미 실행 중일 때 남아 있는 락 파일을 정리
 * @param {string} profileDir - 프로필 디렉토리 경로
 * @param {boolean} throwIfInUse - 실행 중이면 에러 throw 여부 (기본값: false)
 * @returns {Promise<boolean>} 실행 중이면 true, 정리 완료면 false
 */
async function clearSingletonLocks(profileDir, throwIfInUse = false) {
  // 프로필이 실행 중인지 확인
  const inUse = await isProfileInUse(profileDir);
  
  if (inUse) {
    const message = `⚠️ 경고: 프로필이 현재 실행 중입니다. 동시 사용 시 데이터 손상 위험이 있습니다.`;
    if (throwIfInUse) {
      throw new Error(message);
    } else {
      console.warn(message);
      console.warn('   별도 프로필 사용을 권장합니다.');
      return true;
    }
  }
  
  // 락 파일 정리
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const file of lockFiles) {
    const target = path.join(profileDir, file);
    try {
      await fsPromises.rm(target, { force: true });
    } catch (e) {
      console.log(`락 파일 제거 중 경고 (${file}): ${e.message}`);
    }
  }
  
  return false;
}

module.exports = { 
  clearSingletonLocks,
  isProfileInUse,
};

