/**
 * 프로필 경로 설정
 * 
 * 브라우저 프로필이 저장될 사용자 데이터 디렉토리 경로를 설정합니다.
 * ~ 는 홈 디렉토리로 자동 확장됩니다.
 * 
 * 플랫폼별 기본 경로:
 * - macOS/Linux: ~/Documents/github_cloud/user_data
 * - Windows: ~/Documents/github_cloud/user_data (자동으로 C:\Users\사용자명\Documents\... 로 변환)
 */

const os = require('os');
const path = require('path');

// 플랫폼별 기본 경로 설정
function getDefaultProfilePath() {
  const platform = process.platform;
  
  // 모든 플랫폼에서 Documents 폴더 사용 (Windows도 동일)
  // ~ 는 readPathFromFile()에서 자동으로 홈 디렉토리로 확장됨
  return '~/Documents/github_cloud/user_data';
}

module.exports = {
  // 프로필 저장 경로
  // 플랫폼에 관계없이 ~/Documents/github_cloud/user_data 사용
  // Windows: C:\Users\사용자명\Documents\github_cloud\user_data
  // macOS: /Users/사용자명/Documents/github_cloud/user_data
  // Linux: /home/사용자명/Documents/github_cloud/user_data
  profilePath: getDefaultProfilePath(),
};
