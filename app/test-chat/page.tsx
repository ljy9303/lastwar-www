'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, MessageCircle, AlertTriangle, Info } from 'lucide-react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  description: string
  details?: string
  error?: string
}

export default function TestChatPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'login-check',
      name: '로그인 상태 확인',
      status: 'pending',
      description: '현재 사용자의 로그인 상태를 확인합니다'
    },
    {
      id: 'floating-button-render',
      name: '플로팅 버튼 렌더링',
      status: 'pending',
      description: '플로팅 채팅 버튼이 DOM에 렌더링되는지 확인합니다'
    },
    {
      id: 'floating-button-visible',
      name: '플로팅 버튼 가시성',
      status: 'pending',
      description: '플로팅 채팅 버튼이 화면에 보이는지 확인합니다'
    },
    {
      id: 'floating-button-click',
      name: '플로팅 버튼 클릭',
      status: 'pending',
      description: '플로팅 채팅 버튼 클릭이 정상 작동하는지 확인합니다'
    },
    {
      id: 'chat-modal-open',
      name: '채팅 모달 열기',
      status: 'pending',
      description: '채팅 모달이 정상적으로 열리는지 확인합니다'
    },
    {
      id: 'chat-tabs-switch',
      name: '채팅 탭 전환',
      status: 'pending',
      description: '글로벌/연맹/문의 탭 전환이 정상 작동하는지 확인합니다'
    },
    {
      id: 'react-errors',
      name: 'React 에러 확인',
      status: 'pending',
      description: '콘솔에 React 관련 에러가 없는지 확인합니다'
    }
  ])
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentTestIndex, setCurrentTestIndex] = useState(-1)
  const consoleErrorsRef = useRef<string[]>([])

  // 콘솔 에러 캐치
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      const errorMessage = args.join(' ')
      if (errorMessage.includes('React') || errorMessage.includes('Warning') || errorMessage.includes('Maximum update depth')) {
        consoleErrorsRef.current.push(errorMessage)
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  const updateTestStatus = (testId: string, status: TestResult['status'], details?: string, error?: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, details, error }
        : test
    ))
  }

  const runTest = async (testId: string): Promise<boolean> => {
    updateTestStatus(testId, 'running')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // 시각적 효과

      switch (testId) {
        case 'login-check':
          if (sessionStatus === 'authenticated' && session?.user) {
            updateTestStatus(testId, 'passed', `사용자: ${session.user.name || session.user.email}`)
            return true
          } else {
            updateTestStatus(testId, 'failed', '로그인되지 않은 상태', '테스트 로그인을 먼저 수행하세요')
            return false
          }

        case 'floating-button-render':
          const floatingButton = document.querySelector('[class*="fixed"][class*="bottom-6"][class*="right-6"]')
          if (floatingButton) {
            updateTestStatus(testId, 'passed', '플로팅 버튼 DOM 요소 발견')
            return true
          } else {
            updateTestStatus(testId, 'failed', 'DOM에서 플로팅 버튼을 찾을 수 없음')
            return false
          }

        case 'floating-button-visible':
          const visibleButton = document.querySelector('[class*="fixed"][class*="bottom-6"][class*="right-6"]') as HTMLElement
          if (visibleButton && visibleButton.offsetHeight > 0 && visibleButton.offsetWidth > 0) {
            const style = window.getComputedStyle(visibleButton)
            if (style.visibility !== 'hidden' && style.display !== 'none') {
              updateTestStatus(testId, 'passed', '플로팅 버튼이 화면에 표시됨')
              return true
            }
          }
          updateTestStatus(testId, 'failed', '플로팅 버튼이 화면에 표시되지 않음')
          return false

        case 'floating-button-click':
          const clickableButton = document.querySelector('[class*="fixed"][class*="bottom-6"][class*="right-6"] button') as HTMLButtonElement
          if (clickableButton) {
            clickableButton.click()
            await new Promise(resolve => setTimeout(resolve, 1000)) // 모달 열리는 시간 대기
            updateTestStatus(testId, 'passed', '플로팅 버튼 클릭 완료')
            return true
          } else {
            updateTestStatus(testId, 'failed', '클릭 가능한 버튼을 찾을 수 없음')
            return false
          }

        case 'chat-modal-open':
          const chatModal = document.querySelector('[class*="fixed"][class*="bottom-24"][class*="right-6"]')
          if (chatModal) {
            updateTestStatus(testId, 'passed', '채팅 모달이 열림')
            return true
          } else {
            updateTestStatus(testId, 'failed', '채팅 모달을 찾을 수 없음')
            return false
          }

        case 'chat-tabs-switch':
          // 탭 버튼들 찾기
          const tabButtons = document.querySelectorAll('[role="tab"]')
          if (tabButtons.length >= 3) {
            // 각 탭 클릭해보기
            for (let i = 0; i < Math.min(3, tabButtons.length); i++) {
              (tabButtons[i] as HTMLElement).click()
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            updateTestStatus(testId, 'passed', `${tabButtons.length}개 탭 전환 완료`)
            return true
          } else {
            updateTestStatus(testId, 'failed', '채팅 탭을 찾을 수 없음')
            return false
          }

        case 'react-errors':
          if (consoleErrorsRef.current.length === 0) {
            updateTestStatus(testId, 'passed', 'React 에러 없음')
            return true
          } else {
            updateTestStatus(testId, 'failed', `${consoleErrorsRef.current.length}개 에러 발견`, consoleErrorsRef.current.join('\n'))
            return false
          }

        default:
          updateTestStatus(testId, 'failed', '알 수 없는 테스트')
          return false
      }
    } catch (error) {
      updateTestStatus(testId, 'failed', '테스트 실행 중 오류 발생', error instanceof Error ? error.message : '알 수 없는 오류')
      return false
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    consoleErrorsRef.current = [] // 에러 로그 초기화
    
    for (let i = 0; i < tests.length; i++) {
      setCurrentTestIndex(i)
      const success = await runTest(tests[i].id)
      
      // 중요한 테스트가 실패하면 다음 테스트는 의미가 없으므로 중단
      if (!success && ['login-check', 'floating-button-render'].includes(tests[i].id)) {
        break
      }
    }
    
    setCurrentTestIndex(-1)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">통과</Badge>
      case 'failed':
        return <Badge variant="destructive">실패</Badge>
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">실행중</Badge>
      default:
        return <Badge variant="outline">대기</Badge>
    }
  }

  const passedTests = tests.filter(test => test.status === 'passed').length
  const failedTests = tests.filter(test => test.status === 'failed').length

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">플로팅 채팅 버튼 테스트</h1>
        <p className="text-gray-600">
          플로팅 채팅 기능과 React 무한 루프 문제 해결을 확인합니다
        </p>
      </div>

      {/* 테스트 실행 버튼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            자동 테스트 실행
          </CardTitle>
          <CardDescription>
            모든 테스트를 자동으로 실행하여 플로팅 채팅 기능을 검증합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  테스트 실행 중...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  전체 테스트 실행
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/test-login')}
            >
              테스트 로그인하기
            </Button>
          </div>

          {/* 테스트 결과 요약 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">통과: {passedTests}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">실패: {failedTests}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">대기: {tests.length - passedTests - failedTests}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 테스트 목록 */}
      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card 
            key={test.id} 
            className={`transition-all duration-200 ${
              currentTestIndex === index ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{test.name}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                    
                    {test.details && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mb-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700">{test.details}</p>
                      </div>
                    )}
                    
                    {test.error && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700">
                          <p className="font-medium mb-1">오류 내용:</p>
                          <pre className="whitespace-pre-wrap text-xs">{test.error}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(test.id)}
                  disabled={isRunning}
                  className="ml-4"
                >
                  개별 실행
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 수동 테스트 안내 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            수동 테스트 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• <strong>로그인:</strong> 먼저 "테스트 로그인하기" 버튼을 클릭하여 로그인하세요</p>
            <p>• <strong>플로팅 버튼:</strong> 화면 우하단에 파란색 원형 채팅 버튼을 확인하세요</p>
            <p>• <strong>채팅 모달:</strong> 플로팅 버튼 클릭 시 채팅 모달이 열려야 합니다</p>
            <p>• <strong>탭 전환:</strong> 글로벌/연맹/문의 탭을 클릭하여 전환을 테스트하세요</p>
            <p>• <strong>React 에러:</strong> 브라우저 개발자 도구(F12)에서 콘솔 에러를 확인하세요</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}