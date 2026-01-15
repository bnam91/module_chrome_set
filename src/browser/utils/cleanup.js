/**
 * 브라우저 캐시 및 쿠키 정리 유틸리티
 * 
 * 목적: 주기적으로 브라우저 캐시와 쿠키를 정리하여 디스크 공간을 절약하고
 *       브라우저 성능을 유지합니다.
 * 
 * 기능:
 * - 14일 주기로 자동 정리 (CLEAN_INTERVAL_MS)
 * - 브라우저 쿠키 및 캐시 삭제
 * - 디스크 캐시 디렉토리 삭제 (Cache, Code Cache, Service Worker CacheStorage)
 * - 마지막 정리 시간을 마커 파일로 추적
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const CLEAN_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000; // 14일
const MARKER_NAME = '.last_cleaned.json';
const CACHE_DIRS = [
  path.join('Default', 'Cache'),
  path.join('Default', 'Code Cache'),
  path.join('Default', 'Service Worker', 'CacheStorage'),
];

function getMarkerPath(profileDir) {
  return path.join(profileDir, MARKER_NAME);
}

async function readLastCleaned(profileDir) {
  try {
    const markerPath = getMarkerPath(profileDir);
    const content = await fsPromises.readFile(markerPath, 'utf-8');
    const parsed = JSON.parse(content);
    return typeof parsed.lastCleaned === 'number' ? parsed.lastCleaned : 0;
  } catch {
    return 0;
  }
}

async function writeLastCleaned(profileDir, timestamp) {
  const markerPath = getMarkerPath(profileDir);
  await fsPromises.writeFile(markerPath, JSON.stringify({ lastCleaned: timestamp }), 'utf-8');
}

async function clearBrowserData(page) {
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
}

async function clearDiskCaches(profileDir) {
  for (const rel of CACHE_DIRS) {
    const target = path.join(profileDir, rel);
    try {
      await fsPromises.rm(target, { recursive: true, force: true });
    } catch {
      // ignore failures per directory
    }
  }
}

async function cleanIfNeeded(profileDir, page) {
  const lastCleaned = await readLastCleaned(profileDir);
  const now = Date.now();
  if (now - lastCleaned < CLEAN_INTERVAL_MS) {
    return false;
  }

  await clearBrowserData(page);
  await clearDiskCaches(profileDir);
  await writeLastCleaned(profileDir, now);
  return true;
}

module.exports = {
  cleanIfNeeded,
  CLEAN_INTERVAL_MS,
};

