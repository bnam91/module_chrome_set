/**
 * Chrome 기본 프로필 경로 유틸리티
 * 
 * 목적: 시스템의 기본 Chrome 프로필 경로를 가져옵니다.
 * 
 * 지원 플랫폼:
 * - macOS: ~/Library/Application Support/Google/Chrome
 * - Windows: C:\Users\사용자명\AppData\Local\Google\Chrome\User Data
 * - Linux: ~/.config/google-chrome
 */

const os = require('os');
const path = require('path');

/**
 * Chrome 기본 프로필 경로 가져오기
 * @returns {string} Chrome 기본 프로필 경로
 */
function getDefaultChromeProfilePath() {
  const platform = process.platform;
  const homeDir = os.homedir();
  
  if (platform === 'darwin') {
    // macOS
    return path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
  } else if (platform === 'win32') {
    // Windows
    return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  } else {
    // Linux
    return path.join(homeDir, '.config', 'google-chrome');
  }
}

/**
 * 기본 프로필 이름 가져오기 (보통 "Default" 또는 "Profile 1")
 * @param {string} chromeProfilePath - Chrome 프로필 경로
 * @returns {Promise<string|null>} 기본 프로필 이름 또는 null
 */
async function getDefaultProfileName(chromeProfilePath) {
  const fsPromises = require('fs').promises;
  
  try {
    const items = await fsPromises.readdir(chromeProfilePath);
    
    // "Default" 프로필이 있으면 우선 사용
    if (items.includes('Default')) {
      const defaultPath = path.join(chromeProfilePath, 'Default');
      try {
        const stats = await fsPromises.stat(defaultPath);
        if (stats.isDirectory()) {
          return 'Default';
        }
      } catch {}
    }
    
    // "Profile 1" 찾기
    const profileDirs = items.filter(item => item.startsWith('Profile '));
    if (profileDirs.length > 0) {
      // 숫자 순서로 정렬
      profileDirs.sort((a, b) => {
        const numA = parseInt(a.replace('Profile ', '')) || 0;
        const numB = parseInt(b.replace('Profile ', '')) || 0;
        return numA - numB;
      });
      return profileDirs[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getDefaultChromeProfilePath,
  getDefaultProfileName,
};
