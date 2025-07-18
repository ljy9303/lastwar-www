/**
 * 프로덕션 환경에서 불필요한 로그 출력을 방지하는 로거 유틸리티
 */

export const logger = {
  /**
   * 개발환경에서만 출력되는 디버그 로그
   */
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  },

  /**
   * 개발환경에서만 출력되는 정보 로그
   */
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '')
    }
  },

  /**
   * 모든 환경에서 출력되는 경고 로그
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },

  /**
   * 모든 환경에서 출력되는 에러 로그
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '')
  },

  /**
   * 개발환경에서만 출력되는 그룹 로그 (접기/펼치기 가능)
   */
  group: (title: string, callback: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[GROUP] ${title}`)
      callback()
      console.groupEnd()
    }
  }
}

/**
 * 컴포넌트별 네임스페이스가 있는 로거 생성
 */
export const createLogger = (namespace: string) => ({
  debug: (message: string, data?: any) => logger.debug(`[${namespace}] ${message}`, data),
  info: (message: string, data?: any) => logger.info(`[${namespace}] ${message}`, data),
  warn: (message: string, data?: any) => logger.warn(`[${namespace}] ${message}`, data),
  error: (message: string, error?: any) => logger.error(`[${namespace}] ${message}`, error),
  group: (title: string, callback: () => void) => logger.group(`[${namespace}] ${title}`, callback)
})