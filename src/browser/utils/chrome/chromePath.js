/**
 * Chrome 실행 경로 찾기 유틸리티
 * 
 * 목적: 플랫폼별로 Chrome/Chromium 브라우저의 실행 경로를 자동으로 찾습니다.
 * 
 * 지원 플랫폼:
 * - macOS
 * - Windows
 * - Linux
 */

const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { access } = require('fs').promises;

const execAsync = promisify(exec);

/**
 * 크롬/크롬 브라우저의 실행 경로를 찾는 함수
 * @returns {Promise<string|null>} Chrome 실행 경로 또는 null
 */
async function findChromePath() {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    
    for (const path of paths) {
      try {
        await access(path);
        return path;
      } catch {
        continue;
      }
    }
    
    // which 명령어로 찾기
    try {
      const { stdout } = await execAsync('which google-chrome || which chromium || which chromium-browser');
      return stdout.trim() || null;
    } catch {
      return null;
    }
  } else if (platform === 'win32') {
    // Windows
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    
    for (const path of paths) {
      try {
        await access(path);
        return path;
      } catch {
        continue;
      }
    }
    return null;
  } else {
    // Linux
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    ];
    
    for (const path of paths) {
      try {
        await access(path);
        return path;
      } catch {
        continue;
      }
    }
    
    // which 명령어로 찾기
    try {
      const { stdout } = await execAsync('which google-chrome-stable || which google-chrome || which chromium || which chromium-browser');
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }
}

module.exports = { findChromePath };
