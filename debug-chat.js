const puppeteer = require('puppeteer');

async function debugChatError() {
  console.log('브라우저 디버깅 시작...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 네트워크 요청 모니터링
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`Request: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log(`Response: ${response.status()} ${response.url()}`);
  });
  
  // 콘솔 로그 모니터링
  page.on('console', msg => {
    console.log(`Browser Console [${msg.type()}]:`, msg.text());
  });
  
  // 에러 모니터링
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });
  
  try {
    console.log('1. 테스트 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/test-login', { waitUntil: 'networkidle2' });
    
    console.log('2. 로그인 진행...');
    await page.type('input[name="email"]', 'os1414@hanmail.net');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForSelector('.floating-chat-button', { timeout: 10000 });
    console.log('3. 로그인 완료, 플로팅 채팅 버튼 발견');
    
    console.log('4. 플로팅 채팅 버튼 클릭...');
    await page.click('.floating-chat-button');
    
    // 모달이 열릴 때까지 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('5. 채팅 모달 열림');
    
    console.log('6. 연맹 채팅 탭 클릭...');
    await page.click('button:has-text("연맹 채팅")');
    
    // 잠시 대기하여 API 요청 확인
    await page.waitForTimeout(3000);
    
    console.log('7. 네트워크 요청 분석:');
    const chatRequests = requests.filter(req => req.url.includes('/chat/history'));
    const chatResponses = responses.filter(res => res.url.includes('/chat/history'));
    
    console.log('채팅 히스토리 요청:', chatRequests);
    console.log('채팅 히스토리 응답:', chatResponses);
    
    // 페이지의 에러 메시지 확인
    console.log('8. 페이지에서 에러 메시지 확인...');
    const errorElements = await page.$$eval('[role="alert"], .error, .destructive', 
      elements => elements.map(el => el.textContent)
    );
    console.log('에러 메시지:', errorElements);
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error.message);
  }
  
  console.log('브라우저를 열어두고 수동 확인을 위해 10분 대기...');
  await page.waitForTimeout(600000); // 10분 대기
  
  await browser.close();
}

debugChatError().catch(console.error);