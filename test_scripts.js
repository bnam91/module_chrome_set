
// chrome-profile 모듈을 불러와 실행
const { openCoupang } = require('./src/browser/chrome-profile');

// 옵션 1: 대화형 프로필 선택 (기본)
openCoupang();

// 옵션 2: 특정 프로필 자동 선택 (주석 해제하여 사용)
// openCoupang({ profileName: 'naver_bnam91' });

// 옵션 3: Chrome 기본 프로필 사용 (주석 해제하여 사용)
// openCoupang({ useDefaultProfile: true });
