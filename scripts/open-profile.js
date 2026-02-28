#!/usr/bin/env node
/**
 * USER_DATA 폴더에서 프로필을 선택해 크롬을 실행하는 스크립트
 *
 * 사용법:
 *   node scripts/open-profile.js
 *   node scripts/open-profile.js naver_     # naver_ 접두사만 표시
 *   node scripts/open-profile.js google_   # google_ 접두사만 표시
 *   npm run profile
 */

const fs = require('fs').promises;
const path = require('path');

const PROFILE_PREFIXES = ['google_', 'naver_', 'instagram_', 'youtube_'];

/** readline 충돌 방지: config만 먼저 로드 (readline 미사용) */
function getProfiles(userDataPath, filterPrefix) {
  const profiles = [];
  return fs
    .readdir(userDataPath)
    .catch(() => [])
    .then(async (items) => {
      for (const item of items) {
        if (filterPrefix && !item.startsWith(filterPrefix)) continue;
        if (!PROFILE_PREFIXES.some((p) => item.startsWith(p))) continue;
        const itemPath = path.join(userDataPath, item);
        try {
          const stat = await fs.stat(itemPath);
          if (!stat.isDirectory()) continue;
          const hasDefault = await fs.access(path.join(itemPath, 'Default')).then(() => true).catch(() => false);
          let hasProfile = false;
          if (!hasDefault) {
            const sub = await fs.readdir(itemPath).catch(() => []);
            hasProfile = sub.some((s) => s.startsWith('Profile'));
          }
          if (hasDefault || hasProfile) profiles.push(item);
        } catch {}
      }
      return profiles.sort();
    });
}

async function main() {
  const filterPrefix = process.argv[2] || null;

  try {
    const { readPathFromFile } = require('../src/browser/utils/chrome/config');
    const userDataPath = readPathFromFile();
    console.log(`\n📁 USER_DATA 경로: ${userDataPath}\n`);

    const profiles = await getProfiles(userDataPath, filterPrefix);

    console.log('사용 가능한 프로필:');
    console.log('  0. 새 프로필 생성');
    if (profiles.length === 0) {
      console.log(filterPrefix ? `  (${filterPrefix} 접두사 프로필 없음)` : '  (프로필 없음)');
    } else {
      profiles.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    }
    console.log('');

    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

    const answer = await ask('번호를 입력하세요 (또는 프로필 이름 직접 입력): ');
    const num = parseInt(answer, 10);

    let profileName;
    if (num === 0) {
      const name = await ask('새 프로필 이름을 입력하세요 (접두사 제외, 예: bnam91 → google_bnam91): ');
      if (!name) {
        console.log('프로필 이름을 입력해주세요.');
        rl.close();
        process.exit(1);
      }
      if (/[\\/:*?"<>|]/.test(name)) {
        console.log('프로필 이름에 \\ / : * ? " < > | 를 사용할 수 없습니다.');
        rl.close();
        process.exit(1);
      }
      const prefix = filterPrefix || 'google_';
      profileName = PROFILE_PREFIXES.some((p) => name.startsWith(p)) ? name : prefix + name;
      const newProfilePath = path.join(userDataPath, profileName);
      try {
        await fs.access(newProfilePath);
        console.log(`'${profileName}' 프로필이 이미 존재합니다.`);
        rl.close();
        process.exit(1);
      } catch {}
      await fs.mkdir(path.join(newProfilePath, 'Default'), { recursive: true });
      console.log(`\n✅ 새 프로필 '${profileName}' 생성 완료.\n`);
    } else if (!isNaN(num) && num >= 1 && num <= profiles.length) {
      profileName = profiles[num - 1];
    } else if (profiles.includes(answer)) {
      profileName = answer;
    } else {
      console.log('올바른 번호 또는 프로필 이름을 입력해주세요.');
      rl.close();
      process.exit(1);
    }
    rl.close();

    console.log(`\n✅ 선택된 프로필: ${profileName}\n`);

    const { openBrowser } = require('../src/browser/chrome-profile');
    await openBrowser({
      profileName,
      profilePath: userDataPath,
      url: 'https://www.naver.com',
    });
  } catch (e) {
    console.error('오류:', e.message);
    process.exit(1);
  }
}

main();
