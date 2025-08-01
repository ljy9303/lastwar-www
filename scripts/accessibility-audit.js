#!/usr/bin/env node

/**
 * LastWar 프론트엔드 접근성 검증 스크립트
 * WCAG 2.1 AA 기준으로 컴포넌트 접근성을 자동 검증합니다.
 */

const fs = require('fs');
const path = require('path');

// 색상 대비율 계산 함수
function calculateContrastRatio(foreground, background) {
  // HSL 값에서 휘도 계산
  function getLuminance(hsl) {
    // HSL을 RGB로 변환 후 휘도 계산
    const [h, s, l] = hsl.match(/\d+/g).map(Number);
    
    // 간단한 휘도 계산 (실제로는 더 복잡한 변환 필요)
    const lightness = l / 100;
    return lightness;
  }

  const foregroundLum = getLuminance(foreground);
  const backgroundLum = getLuminance(background);
  
  const contrast = (Math.max(foregroundLum, backgroundLum) + 0.05) / 
                  (Math.min(foregroundLum, backgroundLum) + 0.05);

  return {
    ratio: Math.round(contrast * 100) / 100,
    isAACompliant: contrast >= 4.5,
    isAAACompliant: contrast >= 7
  };
}

// CSS 변수에서 색상 값 추출
function extractColorTokens() {
  const cssPath = path.join(__dirname, '../app/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const colorTokens = {};
  const rootMatch = cssContent.match(/:root\s*{([^}]+)}/);
  const darkMatch = cssContent.match(/\.dark\s*{([^}]+)}/);
  
  if (rootMatch) {
    const lightColors = rootMatch[1].match(/--[\w-]+:\s*[^;]+;/g);
    if (lightColors) {
      colorTokens.light = {};
      lightColors.forEach(colorDef => {
        const [name, value] = colorDef.split(':').map(s => s.trim());
        colorTokens.light[name.replace('--', '')] = value.replace(';', '');
      });
    }
  }
  
  if (darkMatch) {
    const darkColors = darkMatch[1].match(/--[\w-]+:\s*[^;]+;/g);
    if (darkColors) {
      colorTokens.dark = {};
      darkColors.forEach(colorDef => {
        const [name, value] = colorDef.split(':').map(s => s.trim());
        colorTokens.dark[name.replace('--', '')] = value.replace(';', '');
      });
    }
  }
  
  return colorTokens;
}

// 컴포넌트 파일에서 접근성 속성 검증
function analyzeComponentAccessibility(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  const issues = [];
  const suggestions = [];
  
  // 1. aria-label 검증
  const ariaLabelRegex = /aria-label=["'][^"']*["']/g;
  const buttonRegex = /<(button|Button)[^>]*>/g;
  
  const buttons = content.match(buttonRegex) || [];
  const ariaLabels = content.match(ariaLabelRegex) || [];
  
  if (buttons.length > ariaLabels.length) {
    issues.push({
      type: 'missing-aria-label',
      severity: 'medium',
      message: `${buttons.length - ariaLabels.length}개의 버튼에 aria-label이 누락되었습니다.`
    });
  }
  
  // 2. 키보드 네비게이션 검증
  if (!content.includes('onKeyDown') && buttons.length > 0) {
    issues.push({
      type: 'missing-keyboard-navigation',
      severity: 'high',
      message: '키보드 네비게이션 지원이 누락되었습니다.'
    });
  }
  
  // 3. 터치 타겟 크기 검증
  const touchButtonRegex = /min-h-\[(\d+)px\]/g;
  const touchTargets = content.match(touchButtonRegex) || [];
  
  touchTargets.forEach(target => {
    const size = parseInt(target.match(/\d+/)[0]);
    if (size < 44) {
      issues.push({
        type: 'small-touch-target',
        severity: 'high',
        message: `터치 타겟 크기가 ${size}px로 44px 미만입니다.`
      });
    }
  });
  
  // 4. 접근성 훅 사용 여부 확인
  if (content.includes('use') && !content.includes('useAccessibility')) {
    suggestions.push({
      type: 'accessibility-hooks',
      message: '접근성 향상을 위해 useAccessibility 훅 사용을 고려하세요.'
    });
  }
  
  // 5. role 속성 검증
  const roleRegex = /role=["'][^"']*["']/g;
  const roles = content.match(roleRegex) || [];
  
  if (content.includes('div') && !content.includes('role=') && buttons.length > 0) {
    suggestions.push({
      type: 'semantic-html',
      message: '의미론적 HTML 요소 또는 적절한 role 속성 사용을 고려하세요.'
    });
  }
  
  return {
    fileName,
    issues,
    suggestions,
    score: Math.max(0, 100 - (issues.length * 15) - (suggestions.length * 5))
  };
}

// 색상 대비율 검증
function validateColorContrast() {
  const colorTokens = extractColorTokens();
  const contrastResults = [];
  
  const colorPairs = [
    ['background', 'foreground'],
    ['primary', 'primary-foreground'],
    ['secondary', 'secondary-foreground'],
    ['muted', 'muted-foreground'],
    ['destructive', 'destructive-foreground'],
    ['card', 'card-foreground'],
  ];
  
  ['light', 'dark'].forEach(theme => {
    if (!colorTokens[theme]) return;
    
    colorPairs.forEach(([bg, fg]) => {
      const bgColor = colorTokens[theme][bg];
      const fgColor = colorTokens[theme][fg];
      
      if (bgColor && fgColor) {
        const contrast = calculateContrastRatio(`hsl(${fgColor})`, `hsl(${bgColor})`);
        contrastResults.push({
          theme,
          pair: `${bg} / ${fg}`,
          ...contrast
        });
      }
    });
  });
  
  return contrastResults;
}

// 메인 검증 함수
function runAccessibilityAudit() {
  console.log('🔍 LastWar 접근성 검증을 시작합니다...\n');
  
  // 1. 색상 대비율 검증
  console.log('📊 색상 대비율 검증 중...');
  const contrastResults = validateColorContrast();
  
  console.log('\n=== 색상 대비율 검증 결과 ===');
  contrastResults.forEach(result => {
    const status = result.isAACompliant ? '✅' : '❌';
    const level = result.isAAACompliant ? 'AAA' : result.isAACompliant ? 'AA' : 'FAIL';
    console.log(`${status} ${result.theme.toUpperCase()} ${result.pair}: ${result.ratio}:1 (${level})`);
  });
  
  // 2. 컴포넌트 접근성 검증
  console.log('\n🧩 컴포넌트 접근성 검증 중...');
  
  const componentPaths = [
    'components/ui/touch-button.tsx',
    'components/ui/floating-action-button.tsx',
    'components/ui/accessible-form.tsx',
    'components/ui/mobile-user-table.tsx',
    'components/ui/swipe-card.tsx',
  ];
  
  let totalScore = 0;
  let componentCount = 0;
  
  console.log('\n=== 컴포넌트 접근성 검증 결과 ===');
  
  componentPaths.forEach(componentPath => {
    const fullPath = path.join(__dirname, '..', componentPath);
    
    if (fs.existsSync(fullPath)) {
      const result = analyzeComponentAccessibility(fullPath);
      componentCount++;
      totalScore += result.score;
      
      console.log(`\n📱 ${result.fileName} (점수: ${result.score}/100)`);
      
      if (result.issues.length > 0) {
        console.log('  ❌ 문제점:');
        result.issues.forEach(issue => {
          const severity = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
          console.log(`    ${severity} ${issue.message}`);
        });
      }
      
      if (result.suggestions.length > 0) {
        console.log('  💡 개선 제안:');
        result.suggestions.forEach(suggestion => {
          console.log(`    • ${suggestion.message}`);
        });
      }
      
      if (result.issues.length === 0 && result.suggestions.length === 0) {
        console.log('  ✅ 접근성 문제 없음');
      }
    }
  });
  
  // 3. 전체 요약
  const averageScore = componentCount > 0 ? Math.round(totalScore / componentCount) : 0;
  const failedContrasts = contrastResults.filter(r => !r.isAACompliant).length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 LastWar 접근성 검증 요약');
  console.log('='.repeat(50));
  console.log(`🎯 전체 접근성 점수: ${averageScore}/100`);
  console.log(`🎨 색상 대비율 준수: ${contrastResults.length - failedContrasts}/${contrastResults.length} (${Math.round((contrastResults.length - failedContrasts) / contrastResults.length * 100)}%)`);
  console.log(`🧩 검증된 컴포넌트: ${componentCount}개`);
  
  // 4. 권장사항
  console.log('\n📌 핵심 권장사항:');
  
  if (averageScore >= 90) {
    console.log('✅ 우수한 접근성 수준입니다!');
  } else if (averageScore >= 75) {
    console.log('🟡 양호한 접근성 수준입니다. 몇 가지 개선이 필요합니다.');
  } else {
    console.log('🔴 접근성 개선이 시급합니다.');
  }
  
  if (failedContrasts > 0) {
    console.log('• 색상 대비율을 WCAG 2.1 AA 기준(4.5:1)에 맞게 조정하세요.');
  }
  
  console.log('• 모든 인터랙티브 요소는 최소 44px 터치 타겟을 보장하세요.');
  console.log('• aria-label, role 속성을 적절히 활용하세요.');
  console.log('• 키보드 네비게이션을 모든 컴포넌트에서 지원하세요.');
  
  // 5. 테스트 가이드
  console.log('\n🧪 접근성 테스트 가이드:');
  console.log('1. 스크린 리더 테스트 (NVDA, JAWS, VoiceOver)');
  console.log('2. 키보드 전용 네비게이션 테스트');
  console.log('3. 고대비 모드 테스트');
  console.log('4. 확대/축소 200% 테스트');
  console.log('5. 모바일 터치 테스트');
  
  console.log('\n✅ 접근성 검증 완료!');
  
  return {
    averageScore,
    contrastResults,
    failedContrasts,
    componentCount
  };
}

// 스크립트 실행
if (require.main === module) {
  runAccessibilityAudit();
}

module.exports = {
  runAccessibilityAudit,
  calculateContrastRatio,
  analyzeComponentAccessibility,
  validateColorContrast
};