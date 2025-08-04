/**
 * 성능 최적화된 로깅 유틸리티
 * 운영 환경에서는 모든 로그 비활성화
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enableInProduction: boolean
  enableInDevelopment: boolean
  minLevel: LogLevel
}

class PerformanceLogger {
  private config: LoggerConfig
  private isProduction: boolean
  private isDevelopment: boolean

  constructor(config: Partial<LoggerConfig> = {}) {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.isDevelopment = process.env.NODE_ENV === 'development'
    
    this.config = {
      enableInProduction: false, // 운영 환경에서는 기본적으로 비활성화
      enableInDevelopment: true,
      minLevel: 'debug',
      ...config
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // 운영 환경에서는 강제 비활성화
    if (this.isProduction && !this.config.enableInProduction) {
      return false
    }

    // 개발 환경에서도 설정에 따라 제어
    if (this.isDevelopment && !this.config.enableInDevelopment) {
      return false
    }

    // 로그 레벨 체크
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(level)
    const minLevelIndex = levels.indexOf(this.config.minLevel)
    
    return currentLevelIndex >= minLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString().slice(11, 23) // HH:mm:ss.sss 형태
    const levelIcon = this.getLevelIcon(level)
    return `${levelIcon} [${timestamp}] ${message}`
  }

  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🐛'
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      default: return '📝'
    }
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return
    console.debug(this.formatMessage('debug', message), ...args)
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return
    console.info(this.formatMessage('info', message), ...args)
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return
    console.warn(this.formatMessage('warn', message), ...args)
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return
    console.error(this.formatMessage('error', message), ...args)
  }

  // 성능 측정을 위한 특별한 로그
  performance(name: string, duration: number): void {
    if (!this.shouldLog('info')) return
    console.info(`⚡ ${name}: ${duration.toFixed(2)}ms`)
  }

  // 메모리 사용량 로깅
  memory(): void {
    if (!this.shouldLog('debug')) return
    
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      console.debug('📊 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      })
    }
  }

  // 그룹 로깅 (개발 디버깅용)
  group(label: string, collapsed: boolean = false): void {
    if (!this.shouldLog('debug')) return
    
    if (collapsed) {
      console.groupCollapsed(this.formatMessage('debug', `Group: ${label}`))
    } else {
      console.group(this.formatMessage('debug', `Group: ${label}`))
    }
  }

  groupEnd(): void {
    if (!this.shouldLog('debug')) return
    console.groupEnd()
  }

  // 테이블 형태 로깅
  table(data: any): void {
    if (!this.shouldLog('debug')) return
    console.table(data)
  }

  // 시간 측정
  time(label: string): void {
    if (!this.shouldLog('debug')) return
    console.time(label)
  }

  timeEnd(label: string): void {
    if (!this.shouldLog('debug')) return
    console.timeEnd(label)
  }
}

// 기본 로거 인스턴스 생성
export const logger = new PerformanceLogger({
  enableInProduction: false, // 운영 환경에서 완전히 비활성화
  enableInDevelopment: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true',
  minLevel: 'debug'
})

// 성능 측정용 특별 로거
export const performanceLogger = new PerformanceLogger({
  enableInProduction: false,
  enableInDevelopment: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS === 'true',
  minLevel: 'info'
})

// 에러 전용 로거 (운영 환경에서도 필요시 활성화 가능)
export const errorLogger = new PerformanceLogger({
  enableInProduction: process.env.NEXT_PUBLIC_ENABLE_ERROR_LOGS === 'true',
  enableInDevelopment: true,
  minLevel: 'error'
})

// 조건부 console.log 대체 함수들
export const conditionalLog = {
  debug: (...args: any[]) => logger.debug(String(args[0]), ...args.slice(1)),
  info: (...args: any[]) => logger.info(String(args[0]), ...args.slice(1)),
  warn: (...args: any[]) => logger.warn(String(args[0]), ...args.slice(1)),
  error: (...args: any[]) => logger.error(String(args[0]), ...args.slice(1)),
  performance: (name: string, duration: number) => performanceLogger.performance(name, duration),
  memory: () => logger.memory(),
  group: (label: string, collapsed?: boolean) => logger.group(label, collapsed),
  groupEnd: () => logger.groupEnd(),
  table: (data: any) => logger.table(data),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label)
}

// 기존 console.log를 대체하기 위한 전역 함수 (필요시 사용)
export const setupGlobalLogger = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // 운영 환경에서 console 메서드들을 no-op으로 대체
    const noop = () => {}
    window.console = {
      ...window.console,
      log: noop,
      debug: noop,
      info: noop,
      warn: noop,
      // error는 유지하되, 필요시 로깅 서비스로 전송
      error: (...args: any[]) => {
        // 여기서 원격 로깅 서비스로 전송 가능
        if (process.env.NEXT_PUBLIC_ENABLE_ERROR_LOGS === 'true') {
          console.error(...args)
        }
      }
    }
  }
}

export default logger