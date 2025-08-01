#!/usr/bin/env node

/**
 * LastWar 프론트엔드 성능 최적화 리포트 생성 스크립트
 * 
 * Core Web Vitals 측정 및 번들 크기 분석을 통한 종합 성능 리포트
 */

const fs = require('fs')
const path = require('path')

// 빌드 정보 분석
function analyzeBuildOutput() {
  const buildOutputPath = path.join(process.cwd(), '.next/trace')
  const serverPath = path.join(process.cwd(), '.next/server')
  const staticPath = path.join(process.cwd(), '.next/static')
  
  const report = {
    timestamp: new Date().toISOString(),
    buildSize: {},
    optimizations: [],
    recommendations: []
  }
  
  // .next 디렉토리 크기 계산
  function getDirectorySize(dirPath) {
    let totalSize = 0
    
    if (!fs.existsSync(dirPath)) return 0
    
    try {
      const files = fs.readdirSync(dirPath)
      files.forEach(file => {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)
        
        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath)
        } else {
          totalSize += stats.size
        }
      })
    } catch (error) {
      console.warn(`디렉토리 크기 계산 실패: ${dirPath}`, error.message)
    }
    
    return totalSize
  }
  
  // 빌드 크기 정보
  report.buildSize = {
    total: getDirectorySize(path.join(process.cwd(), '.next')),
    server: getDirectorySize(serverPath),
    static: getDirectorySize(staticPath),
    client: getDirectorySize(path.join(staticPath, 'chunks'))
  }
  
  // MB 단위로 변환
  Object.keys(report.buildSize).forEach(key => {
    report.buildSize[key] = (report.buildSize[key] / 1024 / 1024).toFixed(2) + 'MB'
  })
  
  return report
}

// 패키지 의존성 분석
function analyzePackageDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) {
    return { error: 'package.json not found' }
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const dependencies = packageJson.dependencies || {}
  const devDependencies = packageJson.devDependencies || {}
  
  const analysis = {
    totalDependencies: Object.keys(dependencies).length,
    totalDevDependencies: Object.keys(devDependencies).length,
    heavyPackages: [],
    suggestions: []
  }
  
  // 무거운 패키지들 식별
  const heavyPackagePatterns = [
    'framer-motion',
    '@tiptap',
    'recharts',
    'canvas-confetti',
    '@uiw/react-md-editor'
  ]
  
  heavyPackagePatterns.forEach(pattern => {
    const matches = Object.keys(dependencies).filter(dep => dep.includes(pattern))
    if (matches.length > 0) {
      analysis.heavyPackages.push(...matches)
    }
  })
  
  // 최적화 제안
  if (analysis.heavyPackages.length > 0) {
    analysis.suggestions.push('무거운 패키지들에 대해 동적 import 적용 고려')
    analysis.suggestions.push('사용하지 않는 기능들 Tree shaking 확인')
  }
  
  if (analysis.totalDependencies > 50) {
    analysis.suggestions.push('의존성 수가 많습니다. 불필요한 패키지 제거 검토')
  }
  
  return analysis
}

// 성능 최적화 상태 확인
function checkOptimizationStatus() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
  const optimizations = {
    imageOptimization: false,
    bundleAnalyzer: false,
    webpackOptimization: false,
    compressionEnabled: false,
    cssOptimization: false
  }
  
  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8')
    
    // 설정 검사
    if (configContent.includes('unoptimized: false')) {
      optimizations.imageOptimization = true
    }
    if (configContent.includes('@next/bundle-analyzer')) {
      optimizations.bundleAnalyzer = true
    }
    if (configContent.includes('webpack:') && configContent.includes('optimization')) {
      optimizations.webpackOptimization = true
    }
    if (configContent.includes('compress: true')) {
      optimizations.compressionEnabled = true
    }
    if (configContent.includes('optimizeCss: true')) {
      optimizations.cssOptimization = true
    }
  }
  
  return optimizations
}

// Core Web Vitals 권장사항
function generateCoreWebVitalsRecommendations() {
  return [
    {
      metric: 'LCP (Largest Contentful Paint)',
      target: '< 2.5초',
      optimizations: [
        '🖼️ 이미지 최적화: WebP/AVIF 포맷 사용',
        '📦 Critical CSS 인라인 삽입',
        '🚀 프리로딩: 중요 리소스 우선 로드',
        '⚡ 서버 응답 시간 최적화'
      ]
    },
    {
      metric: 'FID (First Input Delay)',
      target: '< 100ms',
      optimizations: [
        '⚡ JavaScript 번들 크기 최소화',
        '🔄 코드 스플리팅 적용',
        '🧠 메인 스레드 블로킹 최소화',
        '📱 인터랙션 최적화'
      ]
    },
    {
      metric: 'CLS (Cumulative Layout Shift)',
      target: '< 0.1',
      optimizations: [
        '📐 이미지/동영상 크기 명시',
        '🎨 폰트 로딩 최적화',
        '💀 Skeleton UI 사용',
        '🔒 레이아웃 안정화'
      ]
    }
  ]
}

// 모바일 성능 권장사항
function generateMobileOptimizationTips() {
  return [
    {
      category: '네트워크 최적화',
      tips: [
        '📱 모바일 우선 이미지 크기 설정',
        '🗜️ Gzip/Brotli 압축 활성화',
        '🚀 HTTP/2 Push 활용',
        '📡 Service Worker 캐싱 전략'
      ]
    },
    {
      category: '사용자 경험',
      tips: [
        '⚡ Progressive Loading 구현',
        '🔄 Optimistic Updates 적용',
        '📱 터치 친화적 인터페이스',
        '🎯 접근성 표준 준수'
      ]
    },
    {
      category: '성능 모니터링',
      tips: [
        '📊 Real User Monitoring (RUM)',
        '⚠️ 성능 알림 설정',
        '📈 지속적인 성능 추적',
        '🔍 A/B 테스트 도구 활용'
      ]
    }
  ]
}

// 메인 리포트 생성
function generatePerformanceReport() {
  console.log('🚀 LastWar 프론트엔드 성능 최적화 리포트 생성 중...\n')
  
  const report = {
    metadata: {
      project: 'LastWar Frontend',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    },
    buildAnalysis: analyzeBuildOutput(),
    dependencyAnalysis: analyzePackageDependencies(),
    optimizationStatus: checkOptimizationStatus(),
    coreWebVitalsRecommendations: generateCoreWebVitalsRecommendations(),
    mobileOptimizationTips: generateMobileOptimizationTips()
  }
  
  // 콘솔 출력
  console.log('📊 === LastWar 프론트엔드 성능 리포트 ===\n')
  
  console.log('🏗️  빌드 크기 분석:')
  Object.entries(report.buildAnalysis.buildSize).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`)
  })
  console.log()
  
  console.log('📦 의존성 분석:')
  console.log(`   총 의존성: ${report.dependencyAnalysis.totalDependencies}개`)
  console.log(`   개발 의존성: ${report.dependencyAnalysis.totalDevDependencies}개`)
  if (report.dependencyAnalysis.heavyPackages.length > 0) {
    console.log(`   무거운 패키지: ${report.dependencyAnalysis.heavyPackages.join(', ')}`)
  }
  console.log()
  
  console.log('⚡ 최적화 상태:')
  Object.entries(report.optimizationStatus).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅' : '❌'}`)
  })
  console.log()
  
  console.log('🎯 Core Web Vitals 권장사항:')
  report.coreWebVitalsRecommendations.forEach(rec => {
    console.log(`\n   ${rec.metric} (목표: ${rec.target})`)
    rec.optimizations.forEach(opt => {
      console.log(`     ${opt}`)
    })
  })
  console.log()
  
  console.log('📱 모바일 최적화 팁:')
  report.mobileOptimizationTips.forEach(category => {
    console.log(`\n   ${category.category}:`)
    category.tips.forEach(tip => {
      console.log(`     ${tip}`)
    })
  })
  console.log()
  
  // JSON 파일로 저장
  const reportPath = path.join(process.cwd(), 'performance-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📄 상세 리포트가 저장되었습니다: ${reportPath}`)
  
  // 권장 다음 단계
  console.log('\n🚀 권장 다음 단계:')
  console.log('   1. npm run dev:performance - 성능 모니터링 모드로 개발')
  console.log('   2. npm run analyze - 번들 분석 리포트 확인')
  console.log('   3. npm run audit:performance - Lighthouse 성능 감사')
  console.log('   4. Core Web Vitals 측정을 위한 실제 사용자 데이터 수집')
  
  return report
}

// 스크립트 실행
if (require.main === module) {
  try {
    generatePerformanceReport()
  } catch (error) {
    console.error('❌ 성능 리포트 생성 실패:', error)
    process.exit(1)
  }
}

module.exports = { generatePerformanceReport }