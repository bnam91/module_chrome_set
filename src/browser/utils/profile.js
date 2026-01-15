/**
 * 브라우저 프로필 관리 유틸리티
 * 
 * 목적: 크롬 브라우저 프로필을 생성, 조회, 선택하는 기능을 제공합니다.
 * 
 * 기능:
 * - 프로필 이름에 접두사 자동 추가 (google_, naver_)
 * - 사용 가능한 프로필 목록 조회
 * - 사용자에게 프로필 선택 또는 생성 요청
 * - 새 프로필 생성 시 유효성 검사 및 디렉토리 생성
 * - 프로필 접두사 표시/숨김 처리
 */

const fsPromises = require('fs').promises;
const path = require('path');
const { question } = require('./readline');

// 허용하는 프로필 접두사
const PROFILE_PREFIXES = ['google_', 'naver_'];

/**
 * 프로필 이름에 기본 접두사(google_) 추가
 * @param {string} profileName - 프로필 이름
 * @returns {string} 접두사가 추가된 프로필 이름
 */
function addGooglePrefix(profileName) {
  if (!profileName) return profileName;
  if (PROFILE_PREFIXES.some((p) => profileName.startsWith(p))) {
    return profileName;
  }
  return `google_${profileName}`;
}

/**
 * 프로필 이름에서 알려진 접두사 제거 (표시용)
 * @param {string} profileName - 프로필 이름
 * @returns {string} 접두사가 제거된 프로필 이름
 */
function removeKnownPrefix(profileName) {
  if (!profileName) return profileName;
  for (const prefix of PROFILE_PREFIXES) {
    if (profileName.startsWith(prefix)) {
      return profileName.substring(prefix.length);
    }
  }
  return profileName;
}

/**
 * 사용 가능한 프로필 목록을 가져옴
 * @param {string} userDataParent - 사용자 데이터 부모 디렉토리 경로
 * @returns {Promise<string[]>} 프로필 이름 배열
 */
async function getAvailableProfiles(userDataParent) {
  const profiles = [];
  
  try {
    await fsPromises.access(userDataParent);
  } catch {
    await fsPromises.mkdir(userDataParent, { recursive: true });
    return profiles;
  }
  
  try {
    const items = await fsPromises.readdir(userDataParent);
    for (const item of items) {
      const itemPath = path.join(userDataParent, item);
      try {
        const stats = await fsPromises.stat(itemPath);
        if (stats.isDirectory()) {
          const defaultPath = path.join(itemPath, 'Default');
          let hasDefault = false;
          try {
            await fsPromises.access(defaultPath);
            hasDefault = true;
          } catch {}
          
          let hasProfile = false;
          if (!hasDefault) {
            const subItems = await fsPromises.readdir(itemPath);
            for (const subItem of subItems) {
              const subItemPath = path.join(itemPath, subItem);
              try {
                const subStats = await fsPromises.stat(subItemPath);
                if (subStats.isDirectory() && subItem.startsWith('Profile')) {
                  hasProfile = true;
                  break;
                }
              } catch {}
            }
          }
          
          if ((hasDefault || hasProfile) && PROFILE_PREFIXES.some((p) => item.startsWith(p))) {
            profiles.push(item);
          }
        }
      } catch {}
    }
  } catch (e) {
    console.log(`프로필 목록 읽기 중 오류: ${e.message}`);
  }
  
  return profiles;
}

/**
 * 사용자에게 프로필을 선택하도록 함
 * @param {string} userDataParent - 사용자 데이터 부모 디렉토리 경로
 * @returns {Promise<string|null>} 선택된 프로필 이름 또는 null
 */
async function selectProfile(userDataParent) {
  const profiles = await getAvailableProfiles(userDataParent);
  
  if (profiles.length === 0) {
    console.log("\n사용 가능한 프로필이 없습니다.");
    const createNew = (await question("새 프로필을 생성하시겠습니까? (y/n): ")).toLowerCase();
    if (createNew === 'y') {
      while (true) {
        const name = await question("새 프로필 이름을 입력하세요: ");
        if (!name) {
          console.log("프로필 이름을 입력해주세요.");
          continue;
        }
        
        if (/[\\/:*?"<>|]/.test(name)) {
          console.log("프로필 이름에 다음 문자를 사용할 수 없습니다: \\ / : * ? \" < > |");
          continue;
        }
        
        // google_ 접두사 추가
        const profileNameWithPrefix = addGooglePrefix(name);
        const newProfilePath = path.join(userDataParent, profileNameWithPrefix);
        
        // 접두사가 추가된 이름으로 프로필 존재 여부 확인
        try {
          await fsPromises.access(newProfilePath);
          console.log(`'${profileNameWithPrefix}' 프로필이 이미 존재합니다.`);
          continue;
        } catch {}
        
        try {
          await fsPromises.mkdir(newProfilePath, { recursive: true });
          await fsPromises.mkdir(path.join(newProfilePath, 'Default'), { recursive: true });
          console.log(`'${profileNameWithPrefix}' 프로필이 생성되었습니다.`);
          return profileNameWithPrefix;
        } catch (e) {
          console.log(`프로필 생성 중 오류가 발생했습니다: ${e.message}`);
          const retry = (await question("다시 시도하시겠습니까? (y/n): ")).toLowerCase();
          if (retry !== 'y') {
            return null;
          }
        }
      }
    }
    return null;
  }
  
  console.log("\n사용 가능한 프로필 목록:");
  profiles.forEach((profile, idx) => {
    // 접두사 포함하여 표시
    console.log(`${idx + 1}. ${profile}`);
  });
  console.log(`${profiles.length + 1}. 새 프로필 생성`);
  
  while (true) {
    try {
      const choiceStr = await question("\n사용할 프로필 번호를 선택하세요: ");
      const choice = parseInt(choiceStr);
      
      if (1 <= choice && choice <= profiles.length) {
        const selectedProfile = profiles[choice - 1];
        console.log(`\n선택된 프로필: ${selectedProfile}`);
        return selectedProfile; // 실제 프로필 이름(접두사 포함) 반환
      } else if (choice === profiles.length + 1) {
        // 새 프로필 생성
        while (true) {
          const name = await question("새 프로필 이름을 입력하세요: ");
          if (!name) {
            console.log("프로필 이름을 입력해주세요.");
            continue;
          }
          
          if (/[\\/:*?"<>|]/.test(name)) {
            console.log("프로필 이름에 다음 문자를 사용할 수 없습니다: \\ / : * ? \" < > |");
            continue;
          }
          
          // google_ 접두사 추가
          const profileNameWithPrefix = addGooglePrefix(name);
          const newProfilePath = path.join(userDataParent, profileNameWithPrefix);
          
          // 접두사가 추가된 이름으로 다시 확인
          try {
            await fsPromises.access(newProfilePath);
            console.log(`'${profileNameWithPrefix}' 프로필이 이미 존재합니다.`);
            continue;
          } catch {}
          
          try {
            await fsPromises.mkdir(newProfilePath, { recursive: true });
            await fsPromises.mkdir(path.join(newProfilePath, 'Default'), { recursive: true });
            console.log(`'${profileNameWithPrefix}' 프로필이 생성되었습니다.`);
            return profileNameWithPrefix;
          } catch (e) {
            console.log(`프로필 생성 중 오류가 발생했습니다: ${e.message}`);
            const retry = (await question("다시 시도하시겠습니까? (y/n): ")).toLowerCase();
            if (retry !== 'y') {
              break;
            }
          }
        }
      } else {
        console.log("유효하지 않은 번호입니다. 다시 선택해주세요.");
      }
    } catch (e) {
      console.log("숫자를 입력해주세요.");
    }
  }
}

/**
 * 프로필 디렉토리가 존재하는지 확인하고 없으면 생성
 * @param {string} profileDir - 프로필 디렉토리 경로
 */
async function ensureProfileDirectory(profileDir) {
  try {
    await fsPromises.access(profileDir);
  } catch {
    await fsPromises.mkdir(profileDir, { recursive: true });
    await fsPromises.mkdir(path.join(profileDir, 'Default'), { recursive: true });
  }
}

module.exports = {
  addGooglePrefix,
  removeKnownPrefix,
  getAvailableProfiles,
  selectProfile,
  ensureProfileDirectory,
  PROFILE_PREFIXES,
};

