// 프로덕션 빌드 테스트용 파일
export function testConsole() {
  console.log('이 로그는 프로덕션에서 제거되어야 합니다')
  console.info('이 정보 로그도 프로덕션에서 제거되어야 합니다')
  console.debug('이 디버그 로그도 프로덕션에서 제거되어야 합니다')
  
  // 이것들은 유지되어야 합니다
  console.error('에러 로그는 프로덕션에서도 유지됩니다')
  console.warn('경고 로그는 프로덕션에서도 유지됩니다')
  
  return 'Console test completed'
}