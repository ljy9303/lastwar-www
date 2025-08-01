"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { usePerformanceContext } from '@/components/performance-provider'
import { generatePerformanceReport } from '@/lib/performance-monitor'
import { Activity, Zap, Monitor, Smartphone, Download, AlertTriangle } from 'lucide-react'

/**
 * 성능 대시보드 컴포넌트
 * 
 * Core Web Vitals, 메모리 사용량, 네트워크 상태 등을 실시간으로 모니터링
 */

export function PerformanceDashboard() {
  const { memoryInfo, networkInfo, generateReport, clearMetrics } = usePerformanceContext()
  const [performanceReport, setPerformanceReport] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // 성능 리포트 생성
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const report = generateReport()
      setPerformanceReport(report)
      
      // JSON 다운로드
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lastwar-performance-report-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('성능 리포트 생성 실패:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // 메모리 사용률 계산
  const memoryUsagePercentage = useMemo(() => {
    if (!memoryInfo) return 0
    return Math.round((memoryInfo.used / memoryInfo.limit) * 100)
  }, [memoryInfo])

  // 네트워크 상태 색상
  const getNetworkStatusColor = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g':
        return 'bg-green-500'
      case '3g':
        return 'bg-yellow-500'
      case '2g':
      case 'slow-2g':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">성능 대시보드</h1>
          <p className="text-muted-foreground">
            LastWar 프론트엔드 실시간 성능 모니터링
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingReport ? '생성 중...' : '리포트 다운로드'}
          </Button>
          <Button 
            variant="outline" 
            onClick={clearMetrics}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            메트릭 초기화
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="resources">리소스</TabsTrigger>
          <TabsTrigger value="network">네트워크</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 메모리 사용량 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">메모리 사용량</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {memoryInfo ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {memoryInfo.used}MB
                    </div>
                    <Progress value={memoryUsagePercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {memoryInfo.limit}MB 중 {memoryUsagePercentage}% 사용
                    </p>
                    {memoryUsagePercentage > 80 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        높음
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    메모리 정보 불가
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 네트워크 상태 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">네트워크</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {networkInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`h-3 w-3 rounded-full ${getNetworkStatusColor(networkInfo.effectiveType)}`}
                      />
                      <span className="text-2xl font-bold uppercase">
                        {networkInfo.effectiveType}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>속도: {networkInfo.downlink}Mbps</div>
                      <div>RTT: {networkInfo.rtt}ms</div>
                    </div>
                    {networkInfo.isSlowConnection && (
                      <Badge variant="destructive" className="text-xs">
                        느린 연결
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    네트워크 정보 불가
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 페이지 로드 시간 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">페이지 로드</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof performance !== 'undefined' && performance.navigation
                    ? Math.round(performance.navigation.loadEventEnd - performance.navigation.navigationStart)
                    : '측정 중'}
                  {typeof performance !== 'undefined' && performance.navigation && 'ms'}
                </div>
                <p className="text-xs text-muted-foreground">
                  초기 로딩 시간
                </p>
              </CardContent>
            </Card>

            {/* 렌더링 성능 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">렌더링</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof performance !== 'undefined' 
                    ? Math.round(performance.now())
                    : '측정 중'}
                  {typeof performance !== 'undefined' && 'ms'}
                </div>
                <p className="text-xs text-muted-foreground">
                  현재 세션 시간
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <CoreWebVitalsPanel />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourcesPanel />
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <NetworkPanel networkInfo={networkInfo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Core Web Vitals 패널
 */
function CoreWebVitalsPanel() {
  const [vitals, setVitals] = useState<any>({})

  useEffect(() => {
    // Web Vitals 측정
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB, onINP }) => {
        const updateVital = (name: string) => (metric: any) => {
          setVitals((prev: any) => ({
            ...prev,
            [name]: {
              value: metric.value,
              rating: metric.rating || 'good',
              id: metric.id
            }
          }))
        }

        onLCP(updateVital('LCP'))
        onFID(updateVital('FID'))
        onCLS(updateVital('CLS'))
        onFCP(updateVital('FCP'))
        onTTFB(updateVital('TTFB'))
        onINP(updateVital('INP'))
      }).catch(err => {
        console.warn('Web Vitals 로드 실패:', err)
      })
    }
  }, [])

  const getVitalBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'default'
      case 'needs-improvement':
        return 'secondary'
      case 'poor':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatVitalValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3)
    }
    return Math.round(value) + 'ms'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(vitals).map(([name, vital]: [string, any]) => (
        <Card key={name}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {name}
              <Badge variant={getVitalBadgeVariant(vital.rating)}>
                {vital.rating}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVitalValue(name, vital.value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getVitalDescription(name)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * 리소스 패널
 */
function ResourcesPanel() {
  const [resources, setResources] = useState<PerformanceResourceTiming[]>([])

  useEffect(() => {
    if (typeof performance !== 'undefined') {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      setResources(resourceEntries.slice(0, 20)) // 최근 20개만
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>리소스 로딩 성능</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {resources.map((resource, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex-1 truncate">
                {resource.name.split('/').pop()}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {resource.initiatorType}
                </Badge>
                <span className="font-mono">
                  {Math.round(resource.responseEnd - resource.startTime)}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 네트워크 패널
 */
function NetworkPanel({ networkInfo }: { networkInfo: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>네트워크 상세 정보</CardTitle>
      </CardHeader>
      <CardContent>
        {networkInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">연결 타입</div>
                <div className="text-2xl font-bold uppercase">
                  {networkInfo.effectiveType}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">다운링크 속도</div>
                <div className="text-2xl font-bold">
                  {networkInfo.downlink} Mbps
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">RTT (왕복 시간)</div>
                <div className="text-2xl font-bold">
                  {networkInfo.rtt} ms
                </div>
              </div>
            </div>
            
            {networkInfo.isSlowConnection && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800">느린 연결 감지</div>
                    <div className="text-sm text-red-600">
                      사용자 경험 최적화를 위해 리소스 로딩을 줄이는 것이 좋습니다.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            네트워크 정보를 불러올 수 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 유틸리티 함수들
function getVitalDescription(name: string): string {
  const descriptions = {
    'LCP': 'Largest Contentful Paint - 가장 큰 콘텐츠 렌더링 시간',
    'FID': 'First Input Delay - 첫 입력 반응 시간',  
    'CLS': 'Cumulative Layout Shift - 누적 레이아웃 변경',
    'FCP': 'First Contentful Paint - 첫 콘텐츠 렌더링 시간',
    'TTFB': 'Time to First Byte - 첫 바이트 수신 시간',
    'INP': 'Interaction to Next Paint - 상호작용 응답 시간'
  }
  return descriptions[name as keyof typeof descriptions] || name
}