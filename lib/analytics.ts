// Google Analytics 4 configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// LastWar 특화 이벤트 추적
export const trackDesertEvent = (eventName: string, desertTitle?: string) => {
  event({
    action: eventName,
    category: 'desert_management',
    label: desertTitle,
  })
}

export const trackUserAction = (action: string, page: string) => {
  event({
    action: action,
    category: 'user_interaction',
    label: page,
  })
}

export const trackPerformance = (metric: string, value: number) => {
  event({
    action: 'performance_metric',
    category: 'performance',
    label: metric,
    value: Math.round(value),
  })
}

// gtag 타입 정의
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_path?: string
        event_category?: string
        event_label?: string
        value?: number
      }
    ) => void
  }
}