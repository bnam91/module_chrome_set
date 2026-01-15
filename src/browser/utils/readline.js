/**
 * 사용자 입력 처리 유틸리티
 * 
 * 목적: 콘솔에서 사용자 입력을 받기 위한 readline 인터페이스를 제공합니다.
 * 
 * 기능:
 * - readline 인터페이스 생성 및 관리
 * - 사용자 입력을 Promise로 변환하여 async/await 패턴 지원
 * - 프로필 선택, 이름 입력 등 대화형 입력 처리
 */

const readline = require('readline');

// readline 인터페이스 생성
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 사용자 입력을 Promise로 변환하는 헬퍼 함수
 * @param {string} prompt - 사용자에게 표시할 프롬프트
 * @returns {Promise<string>} 사용자 입력값
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

module.exports = { rl, question };

