#!/usr/bin/env node

/**
 * Lighthouse 기반 접근성 테스트 스크립트
 * 주요 페이지들의 접근성 점수를 측정하고 리포트를 생성합니다.
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// 테스트할 페이지 목록
const testPages = [
  {
    name: 'Login',
    url: 'http://localhost:3000/login',
    description: '로그인 페이지'
  },
  {
    name: 'Users',
    url: 'http://localhost:3000/users',
    description: '사용자 관리 페이지'
  },
  {
    name: 'Board',
    url: 'http://localhost:3000/board',
    description: '게시판 페이지'
  },
  {
    name: 'Lottery',
    url: 'http://localhost:3000/lottery',
    description: '추첨 페이지'
  }
];

// Lighthouse 설정
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility'],
    formFactor: 'mobile',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    }
  }
};

// Chrome 옵션
const chromeFlags = [
  '--no-sandbox',
  '--headless',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--no-first-run',
  '--no-zygote',
  '--single-process'
];

async function runLighthouseTest(url, name) {
  console.log(`🔍 ${name} 페이지 접근성 테스트 시작...`);
  
  let chrome;
  try {
    // Chrome 실행
    chrome = await chromeLauncher.launch({
      chromeFlags: chromeFlags
    });

    // Lighthouse 실행
    const result = await lighthouse(url, {
      port: chrome.port,
      ...lighthouseConfig
    });

    const accessibility = result.lhr.categories.accessibility;
    const audits = result.lhr.audits;

    // 접근성 관련 주요 감사 항목 추출
    const keyAudits = {
      'color-contrast': audits['color-contrast'],
      'heading-order': audits['heading-order'],
      'html-has-lang': audits['html-has-lang'],
      'image-alt': audits['image-alt'],
      'label': audits['label'],
      'link-name': audits['link-name'],
      'button-name': audits['button-name'],
      'aria-labels': audits['aria-labels'],
      'focus-traps': audits['focus-traps'],
      'focusable-controls': audits['focusable-controls'],
      'interactive-element-affordance': audits['interactive-element-affordance'],
      'logical-tab-order': audits['logical-tab-order'],
      'managed-focus': audits['managed-focus'],
      'use-landmarks': audits['use-landmarks']
    };

    return {
      name,
      url,
      score: Math.round(accessibility.score * 100),
      audits: keyAudits,
      rawResult: result
    };
    
  } catch (error) {
    console.error(`❌ ${name} 테스트 실패:`, error.message);
    return {
      name,
      url,
      score: 0,
      error: error.message,
      audits: {}
    };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

function generateAccessibilityReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, '..', 'reports', `accessibility-lighthouse-${timestamp}.md`);
  
  // reports 디렉토리 생성
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  let report = `# LastWar 접근성 Lighthouse 리포트\n\n`;
  report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n`;
  report += `**테스트 환경**: Mobile (375x667, 2x DPR)\n\n`;

  // 전체 요약
  const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const passedPages = results.filter(r => r.score >= 90).length;
  const failedPages = results.filter(r => r.score < 75).length;

  report += `## 📊 전체 요약\n\n`;
  report += `- **평균 접근성 점수**: ${totalScore}/100\n`;
  report += `- **우수 페이지 (90점+)**: ${passedPages}/${results.length}\n`;
  report += `- **개선 필요 페이지 (75점 미만)**: ${failedPages}/${results.length}\n\n`;

  // 페이지별 결과
  report += `## 📄 페이지별 접근성 점수\n\n`;
  report += `| 페이지 | 점수 | 등급 | 상태 |\n`;
  report += `|-------|------|------|------|\n`;

  results.forEach(result => {
    const grade = result.score >= 90 ? 'A' : result.score >= 75 ? 'B' : result.score >= 60 ? 'C' : 'D';
    const status = result.score >= 90 ? '✅' : result.score >= 75 ? '🟡' : '🔴';
    report += `| ${result.name} | ${result.score}/100 | ${grade} | ${status} |\n`;
  });

  report += `\n`;

  // 상세 감사 결과
  results.forEach(result => {
    if (result.error) {
      report += `### ❌ ${result.name}\n\n`;
      report += `**오류**: ${result.error}\n\n`;
      return;
    }

    report += `### ${result.score >= 90 ? '✅' : result.score >= 75 ? '🟡' : '🔴'} ${result.name} (${result.score}/100)\n\n`;
    
    const failedAudits = Object.entries(result.audits)
      .filter(([_, audit]) => audit && audit.score !== null && audit.score < 1)
      .map(([key, audit]) => ({ key, ...audit }));

    if (failedAudits.length > 0) {
      report += `#### 🔍 개선 필요 항목\n\n`;
      failedAudits.forEach(audit => {
        report += `**${audit.title}**\n`;
        report += `- ${audit.description}\n`;
        if (audit.details && audit.details.items) {
          audit.details.items.slice(0, 3).forEach(item => {
            if (item.node) {
              report += `  - \`${item.node.snippet}\`\n`;
            }
          });
        }
        report += `\n`;
      });
    } else {
      report += `✅ 모든 접근성 기준을 충족합니다.\n\n`;
    }
  });

  // 전체 권장사항
  report += `## 💡 전체 개선 권장사항\n\n`;
  
  const commonIssues = {};
  results.forEach(result => {
    Object.entries(result.audits).forEach(([key, audit]) => {
      if (audit && audit.score !== null && audit.score < 1) {
        if (!commonIssues[key]) {
          commonIssues[key] = {
            title: audit.title,
            count: 0,
            description: audit.description
          };
        }
        commonIssues[key].count++;
      }
    });
  });

  const sortedIssues = Object.entries(commonIssues)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5);

  sortedIssues.forEach(([key, issue]) => {
    report += `### ${issue.title}\n`;
    report += `**영향받은 페이지**: ${issue.count}/${results.length}\n`;
    report += `${issue.description}\n\n`;
  });

  // 다음 단계
  report += `## 🎯 다음 단계\n\n`;
  
  if (totalScore >= 90) {
    report += `✅ **우수한 접근성 수준**을 달성했습니다!\n`;
    report += `- 정기적인 모니터링을 통해 현재 수준을 유지하세요.\n`;
    report += `- AAA 레벨 접근성 달성을 고려해보세요.\n`;
  } else if (totalScore >= 75) {
    report += `🟡 **양호한 접근성 수준**입니다.\n`;
    report += `- 주요 개선 항목을 우선적으로 해결하세요.\n`;
    report += `- 90점 이상 달성을 목표로 하세요.\n`;
  } else {
    report += `🔴 **접근성 개선이 시급**합니다.\n`;
    report += `- 모든 주요 접근성 이슈를 즉시 해결하세요.\n`;
    report += `- 단계적 개선 계획을 수립하세요.\n`;
  }

  report += `\n---\n\n`;
  report += `**자동 생성**: LastWar Lighthouse 접근성 테스트\n`;
  report += `**다음 테스트 권장**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}\n`;

  fs.writeFileSync(reportPath, report);
  return reportPath;
}

async function runAllTests() {
  console.log('🚀 LastWar Lighthouse 접근성 테스트 시작\n');
  
  const results = [];
  
  for (const page of testPages) {
    const result = await runLighthouseTest(page.url, page.name);
    results.push(result);
    
    if (result.error) {
      console.log(`❌ ${page.name}: 테스트 실패`);
    } else {
      const status = result.score >= 90 ? '✅' : result.score >= 75 ? '🟡' : '🔴';
      console.log(`${status} ${page.name}: ${result.score}/100`);
    }
  }
  
  console.log('\n📋 리포트 생성 중...');
  const reportPath = generateAccessibilityReport(results);
  
  console.log(`\n✅ 접근성 테스트 완료!`);
  console.log(`📄 상세 리포트: ${reportPath}`);
  
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  console.log(`🎯 평균 점수: ${averageScore}/100`);
  
  return results;
}

// 개발 서버 실행 여부 확인
async function checkDevServer() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 메인 실행
if (require.main === module) {
  (async () => {
    const isServerRunning = await checkDevServer();
    
    if (!isServerRunning) {
      console.log('❌ 개발 서버가 실행되지 않았습니다.');
      console.log('다음 명령어로 서버를 먼저 실행하세요:');
      console.log('npm run dev');
      process.exit(1);
    }
    
    await runAllTests();
  })();
}

module.exports = {
  runAllTests,
  runLighthouseTest,
  generateAccessibilityReport
};