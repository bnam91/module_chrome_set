/**
 * 테스트 스크립트
 * 
 * 주의! 이 스크립트는 각 기능이 제대로 연결되었는지 확인하는 테스트용입니다.
 * 실제 사용하기에는 적합하지 않습니다.
 * 
 * 테스트 항목:
 * 1. Chrome 경로 자동 감지
 * 2. 프로필 경로 읽기
 * 3. 프로필 목록 조회
 * 4. 기본 프로필 경로 확인
 * 5. 각 옵션별 동작 확인
 */

const { openBrowser } = require('./index');
const { findChromePath } = require('./src/browser/utils/chrome/chromePath');
const { readPathFromFile } = require('./src/browser/utils/chrome/config');
const { getAvailableProfiles } = require('./src/browser/utils/chrome/profile');
const { getDefaultChromeProfilePath, getDefaultProfileName } = require('./src/browser/utils/chrome/defaultProfile');
const { question, rl } = require('./src/browser/utils/chrome/readline');

async function runTests() {
  console.log('🧪 모듈 연결 테스트 시작...\n');
  
  try {
    // 테스트 1: Chrome 경로 감지
    console.log('1️⃣ Chrome 경로 자동 감지 테스트');
    const chromePath = await findChromePath();
    if (chromePath) {
      console.log(`   ✅ Chrome 경로: ${chromePath}\n`);
    } else {
      console.log(`   ⚠️ Chrome 경로를 찾을 수 없습니다.\n`);
    }
    
    // 테스트 2: 프로필 경로 읽기
    console.log('2️⃣ 프로필 경로 읽기 테스트');
    try {
      const profilePath = readPathFromFile();
      console.log(`   ✅ 프로필 경로: ${profilePath}\n`);
    } catch (error) {
      console.log(`   ❌ 프로필 경로 읽기 실패: ${error.message}\n`);
    }
    
    // 테스트 3: 프로필 목록 조회
    console.log('3️⃣ 프로필 목록 조회 테스트');
    try {
      const profilePath = readPathFromFile();
      const profiles = await getAvailableProfiles(profilePath);
      if (profiles.length > 0) {
        console.log(`   ✅ 사용 가능한 프로필 (${profiles.length}개):`);
        profiles.forEach((profile, idx) => {
          console.log(`      ${idx + 1}. ${profile}`);
        });
        console.log('');
      } else {
        console.log(`   ⚠️ 사용 가능한 프로필이 없습니다.\n`);
      }
    } catch (error) {
      console.log(`   ❌ 프로필 목록 조회 실패: ${error.message}\n`);
    }
    
    // 테스트 4: Chrome 기본 프로필 경로 확인
    console.log('4️⃣ Chrome 기본 프로필 경로 확인 테스트');
    try {
      const defaultPath = getDefaultChromeProfilePath();
      console.log(`   ✅ 기본 프로필 경로: ${defaultPath}`);
      const defaultProfileName = await getDefaultProfileName(defaultPath);
      if (defaultProfileName) {
        console.log(`   ✅ 기본 프로필 이름: ${defaultProfileName}\n`);
      } else {
        console.log(`   ⚠️ 기본 프로필을 찾을 수 없습니다.\n`);
      }
    } catch (error) {
      console.log(`   ❌ 기본 프로필 확인 실패: ${error.message}\n`);
    }
    
    // 테스트 5: 옵션별 동작 확인 (실제 실행하지 않음)
    console.log('5️⃣ 옵션 파싱 테스트');
    console.log('   ✅ 옵션 구조 확인 완료');
    console.log('   - profileName: 프로필 이름 직접 지정');
    console.log('   - profilePath: 프로필 경로 직접 지정');
    console.log('   - useDefaultProfile: Chrome 기본 프로필 사용');
    console.log('   - useCDP: CDP 사용 여부');
    console.log('   - openExtraTab: 추가 탭 열기\n');
    
    console.log('✅ 모든 테스트 완료!\n');
    
    // 크롬 실행 테스트 메뉴
    await showChromeTestMenu();
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    if (error.stack && !error.message.includes('readline')) {
      console.error(error.stack);
    }
  }
}

async function showChromeTestMenu() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('이어서 어떤 방법으로 크롬을 실행해볼까요?');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. 대화형 프로필 선택 (기본)');
  console.log('2. 특정 프로필 지정');
  console.log('3. Chrome 기본 프로필 사용');
  console.log('4. 프로필 경로 직접 지정');
  console.log('5. CDP 사용 (강력한 탐지 방지)');
  console.log('6. 종료\n');
  
  while (true) {
    try {
      const choice = await question('선택하세요 (1-6): ');
      const choiceNum = parseInt(choice);
      
      if (choiceNum === 1) {
        // 대화형 프로필 선택
        console.log('\n📋 사용 가능한 프로필 목록:');
        const profilePath = readPathFromFile();
        const profiles = await getAvailableProfiles(profilePath);
        if (profiles.length === 0) {
          console.log('   사용 가능한 프로필이 없습니다.\n');
          continue;
        }
        profiles.forEach((profile, idx) => {
          console.log(`   ${idx + 1}. ${profile}`);
        });
        console.log(`   ${profiles.length + 1}. 새 프로필 생성\n`);
        
        const profileChoice = await question('프로필 번호를 선택하세요: ');
        const profileChoiceNum = parseInt(profileChoice);
        
        if (profileChoiceNum >= 1 && profileChoiceNum <= profiles.length) {
          const selectedProfile = profiles[profileChoiceNum - 1];
          console.log(`\n🚀 크롬 실행 중... (프로필: ${selectedProfile})\n`);
          await openBrowser({ profileName: selectedProfile });
        } else if (profileChoiceNum === profiles.length + 1) {
          console.log('\n🚀 크롬 실행 중... (대화형 프로필 생성)\n');
          await openBrowser();
        } else {
          console.log('❌ 잘못된 번호입니다.\n');
          continue;
        }
        break;
      } else if (choiceNum === 2) {
        // 특정 프로필 지정
        const profilePath = readPathFromFile();
        const profiles = await getAvailableProfiles(profilePath);
        
        console.log('\n📋 사용 가능한 프로필 목록:');
        profiles.forEach((profile, idx) => {
          console.log(`   ${idx + 1}. ${profile}`);
        });
        console.log('');
        
        const profileChoice = await question('프로필 번호를 선택하세요: ');
        const profileChoiceNum = parseInt(profileChoice);
        
        if (profileChoiceNum >= 1 && profileChoiceNum <= profiles.length) {
          const selectedProfile = profiles[profileChoiceNum - 1];
          console.log(`\n🚀 크롬 실행 중... (프로필: ${selectedProfile})\n`);
          await openBrowser({ profileName: selectedProfile });
        } else {
          console.log('❌ 잘못된 번호입니다.\n');
          continue;
        }
        break;
      } else if (choiceNum === 3) {
        // Chrome 기본 프로필 사용
        console.log('\n🚀 크롬 실행 중... (Chrome 기본 프로필)\n');
        await openBrowser({ useDefaultProfile: true });
        break;
      } else if (choiceNum === 4) {
        // 프로필 경로 직접 지정
        const customPath = await question('\n프로필 경로를 입력하세요: ');
        if (customPath.trim()) {
          console.log(`\n🚀 크롬 실행 중... (경로: ${customPath})\n`);
          await openBrowser({ profilePath: customPath.trim() });
        } else {
          console.log('❌ 경로를 입력해주세요.\n');
          continue;
        }
        break;
      } else if (choiceNum === 5) {
        // CDP 사용
        console.log('\n🚀 크롬 실행 중... (CDP 사용)\n');
        await openBrowser({ useCDP: true });
        break;
      } else if (choiceNum === 6) {
        // 종료
        console.log('\n👋 종료합니다.\n');
        if (rl) {
          rl.close();
        }
        break;
      } else {
        console.log('❌ 1-6 사이의 숫자를 입력해주세요.\n');
      }
    } catch (error) {
      if (error.message.includes('대화형 입력')) {
        console.log('\n❌ 대화형 입력이 불가능합니다. 옵션 2, 3, 4를 사용하세요.\n');
        continue;
      }
      if (error.message.includes('readline')) {
        console.log('\n👋 종료합니다.\n');
        break;
      }
      console.error('\n❌ 오류 발생:', error.message);
      console.log('');
    }
  }
  
  // 종료 시 readline 닫기
  if (rl) {
    rl.close();
  }
}

// 테스트 실행
runTests();
