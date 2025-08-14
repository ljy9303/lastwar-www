"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Bot,
  Sparkles,
  Upload,
  Search,
  Trophy,
  Users,
  CheckSquare,
  Monitor,
  Smartphone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GeminiDesertAIService } from "@/lib/gemini-desert-ai"
import { ImageProcessingService } from "@/lib/image-processing"
import { saveDesertBattleResult, saveDesertAttendance } from "@/lib/api-service"
import { getDesertById, type Desert } from "@/app/actions/event-actions"
import { WelcomeScreen } from "./WelcomeScreen"
import { AnalysisTypeSelector } from "./AnalysisTypeSelector"
import { ImageUploadZone } from "./ImageUploadZone"
import { BattleResultEditor } from "./BattleResultEditor"
import { AttendanceEditor } from "./AttendanceEditor"
import { RegistrationCompleteScreen } from "./RegistrationCompleteScreen"
import type { 
  DesertRegistrationStep,
  DesertAnalysisType, 
  ProcessedDesertImage, 
  DesertAIProgress,
  DesertBattleResult,
  DesertAttendanceData,
  DesertRegistrationResult
} from "@/types/ai-desert-types"

interface AIDesertRegistrationProps {
  desertSeq: number
}

export function AIDesertRegistration({ desertSeq }: AIDesertRegistrationProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // 모바일 감지
  const [isMobile, setIsMobile] = useState(false)
  
  // 단계 관리
  const [currentStep, setCurrentStep] = useState<DesertRegistrationStep>('welcome')
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<DesertAnalysisType | null>(null)
  const [selectedDesert, setSelectedDesert] = useState<Desert | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 이미지 및 AI 상태
  const [images, setImages] = useState<ProcessedDesertImage[]>([])
  const [extractedData, setExtractedData] = useState<DesertBattleResult | DesertAttendanceData | null>(null)
  const [aiProgress, setAiProgress] = useState<DesertAIProgress>({
    total: 0,
    processed: 0,
    status: 'idle'
  })
  
  // 등록 결과 상태
  const [registrationResult, setRegistrationResult] = useState<DesertRegistrationResult | null>(null)

  // 서비스 인스턴스
  const [aiService] = useState(() => {
    try {
      return new GeminiDesertAIService()
    } catch (error) {
      console.error("Gemini AI 서비스 초기화 실패:", error)
      toast({
        title: "초기화 오류",
        description: "Gemini API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
        variant: "destructive"
      })
      return null
    }
  })

  // 모바일 감지
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // 사막전 정보 로드
  useEffect(() => {
    loadDesertInfo()
  }, [desertSeq])

  const loadDesertInfo = async () => {
    try {
      setLoading(true)
      // event-actions의 getDesertById는 직접 Desert 객체를 반환
      const desert = await getDesertById(desertSeq)
      console.log('사막전 정보 로드 성공:', desert)
      setSelectedDesert(desert)
    } catch (error) {
      console.error('사막전 정보 로드 실패:', error)
      toast({
        title: "사막전 정보 로드 실패",
        description: error instanceof Error ? error.message : "사막전 정보를 불러올 수 없습니다.",
        variant: "destructive"
      })
      router.push('/desert-results')
    } finally {
      setLoading(false)
    }
  }

  // 단계별 진행률 계산
  const getStepProgress = (step: DesertRegistrationStep): number => {
    if (step === 'welcome') return 0
    const steps = ['type-selection', 'image-upload', 'ai-processing', 'validation-editing', 'final-registration', 'registration-complete']
    return ((steps.indexOf(step) + 1) / steps.length) * 100
  }

  // 단계별 정보 정의
  const stepInfo = {
    'type-selection': {
      icon: Search,
      title: '분석 유형 선택',
      description: '사막전 결과 또는 참석여부 중 분석할 유형을 선택하세요',
      color: 'text-blue-600'
    },
    'image-upload': {
      icon: Upload,
      title: '이미지 업로드',
      description: '사막전 스크린샷을 업로드하세요',
      color: 'text-green-600'
    },
    'ai-processing': {
      icon: Search,
      title: 'AI 분석',
      description: 'AI가 이미지에서 정보를 추출합니다',
      color: 'text-purple-600'
    },
    'validation-editing': {
      icon: CheckSquare,
      title: '정보 검증',
      description: '추출된 정보를 검토하고 수정하세요',
      color: 'text-orange-600'
    },
    'final-registration': {
      icon: selectedAnalysisType === 'EVENT' ? Trophy : Users,
      title: '등록 진행',
      description: '검증된 정보를 저장합니다',
      color: 'text-emerald-600'
    },
    'registration-complete': {
      icon: CheckCircle,
      title: '등록 완료',
      description: 'AI 사막전 데이터 등록이 완료되었습니다',
      color: 'text-green-600'
    }
  }

  // 이미지 추가 처리
  const handleImagesAdd = useCallback(async (files: File[]) => {
    const newImages: ProcessedDesertImage[] = []

    for (const file of files) {
      try {
        const compressedFile = await ImageProcessingService.compressImage(file, 1024, 0.8)
        
        const processedImage: ProcessedDesertImage = {
          id: `${Date.now()}-${Math.random()}`,
          file: compressedFile,
          preview: ImageProcessingService.createPreviewUrl(compressedFile),
          status: 'pending'
        }
        
        newImages.push(processedImage)
      } catch (error) {
        console.error(`파일 ${file.name} 처리 실패:`, error)
        toast({
          title: "파일 처리 실패",
          description: `${file.name} 파일을 처리할 수 없습니다.`,
          variant: "destructive"
        })
      }
    }

    setImages(prev => [...prev, ...newImages])
    
    toast({
      title: "이미지 추가됨",
      description: `${newImages.length}개의 이미지가 추가되었습니다.`,
    })
  }, [toast])

  // 이미지 제거
  const handleImageRemove = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        ImageProcessingService.revokePreviewUrl(imageToRemove.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  // AI 처리 시작
  const startAIProcessing = useCallback(async () => {
    if (!aiService || images.length === 0 || !selectedAnalysisType) {
      toast({
        title: "처리 불가",
        description: "AI 서비스를 사용할 수 없거나 필요한 정보가 부족합니다.",
        variant: "destructive"
      })
      return
    }

    setCurrentStep('ai-processing')
    setAiProgress({
      total: images.length,
      processed: 0,
      status: 'processing'
    })

    // 첫 번째 이미지만 처리 (사막전은 보통 하나의 결과 이미지)
    const image = images[0]
    setAiProgress(prev => ({
      ...prev,
      currentImage: `${image.file.name} 분석 중...`
    }))

    setImages(prev => prev.map((img, index) => 
      index === 0 ? { ...img, status: 'processing' } : img
    ))

    try {
      const result = await aiService.extractDesertData(image.file, selectedAnalysisType)
      
      if (result.success && result.data) {
        setExtractedData(result.data)
        setImages(prev => prev.map((img, index) => 
          index === 0 ? { ...img, status: 'completed', data: result.data } : img
        ))
        
        toast({
          title: "AI 분석 완료",
          description: `${selectedAnalysisType === 'EVENT' ? '사막전 결과' : '참석여부'} 정보가 추출되었습니다.`,
        })

        setCurrentStep('validation-editing')
      } else {
        throw new Error(result.error || 'AI 분석 실패')
      }
    } catch (error) {
      console.error('AI 처리 실패:', error)
      setImages(prev => prev.map((img, index) => 
        index === 0 ? { 
          ...img, 
          status: 'error', 
          error: error instanceof Error ? error.message : "알 수 없는 오류" 
        } : img
      ))

      toast({
        title: "AI 분석 실패",
        description: error instanceof Error ? error.message : "AI 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      })
      
      setCurrentStep('image-upload')
    }

    setAiProgress({
      total: images.length,
      processed: images.length,
      status: 'completed'
    })
  }, [aiService, images, selectedAnalysisType, toast])

  // 최종 등록
  const handleFinalRegistration = useCallback(async () => {
    if (!selectedDesert || !extractedData) {
      toast({
        title: "등록 불가",
        description: "필요한 정보가 부족합니다.",
        variant: "destructive"
      })
      return
    }

    setCurrentStep('final-registration')

    try {
      let result
      if (selectedAnalysisType === 'EVENT') {
        const battleData = extractedData as DesertBattleResult
        result = await saveDesertBattleResult({
          desertSeq: selectedDesert.desertSeq,
          ...battleData
        })
      } else {
        const attendanceData = extractedData as DesertAttendanceData
        result = await saveDesertAttendance({
          desertSeq: selectedDesert.desertSeq,
          attendanceList: attendanceData.attendanceList
        })
      }

      if (result.success) {
        setRegistrationResult({
          success: true,
          message: result.message || "등록이 완료되었습니다.",
          data: result
        })
        setCurrentStep('registration-complete')

        toast({
          title: "등록 완료",
          description: result.message || "사막전 데이터가 성공적으로 저장되었습니다.",
        })
      } else {
        throw new Error(result.message || '등록 실패')
      }
    } catch (error) {
      console.error('등록 실패:', error)
      toast({
        title: "등록 실패",
        description: error instanceof Error ? error.message : "등록 중 오류가 발생했습니다.",
        variant: "destructive"
      })
      setCurrentStep('validation-editing')
    }
  }, [selectedDesert, extractedData, selectedAnalysisType, toast])

  // 이전/다음 단계 이동
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'type-selection':
        setCurrentStep('welcome')
        break
      case 'image-upload':
        setCurrentStep('type-selection')
        break
      case 'validation-editing':
        setCurrentStep('image-upload')
        break
      case 'final-registration':
        setCurrentStep('validation-editing')
        break
    }
  }

  const goToNextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('type-selection')
        break
      case 'type-selection':
        if (selectedAnalysisType) {
          setCurrentStep('image-upload')
        }
        break
      case 'image-upload':
        if (images.length > 0) {
          startAIProcessing()
        }
        break
      case 'validation-editing':
        handleFinalRegistration()
        break
    }
  }

  // 새로운 등록 시작
  const handleStartNewRegistration = () => {
    setCurrentStep('type-selection')
    setSelectedAnalysisType(null)
    setImages([])
    setExtractedData(null)
    setRegistrationResult(null)
    setAiProgress({
      total: 0,
      processed: 0,
      status: 'idle'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-96">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-lg font-medium">사막전 정보 로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!aiService) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gemini API 키가 설정되지 않았습니다. 관리자에게 문의하세요.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // 모바일 접근 시 PC 전용 안내 표시
  if (isMobile) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <Smartphone className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-2xl">→</div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Monitor className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  PC 전용 기능
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>해당 기능은 PC에서 지원하는 기능입니다.</strong>
                  <br />
                  더 나은 사용 경험을 위해 데스크톱 환경에서 이용해주세요.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Bot className="h-4 w-4 text-blue-500" />
                  <span>AI 이미지 분석 및 대량 처리</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Upload className="h-4 w-4 text-green-500" />
                  <span>다중 파일 업로드 및 편집</span>
                </div>
              </div>
              
              <Button 
                onClick={() => router.push('/desert-results')}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                사막전 결과로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isInitialStep = currentStep === 'welcome'
  const showMinimalHeader = !isInitialStep

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 헤더 섹션 */}
      <div className={`space-y-4 transition-all duration-200 ease-in-out ${
        showMinimalHeader ? 'pb-2' : 'pb-4'
      }`}>
        {/* 브레드크럼 네비게이션 */}
        <nav className="flex items-center text-sm" aria-label="페이지 경로 네비게이션">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/desert-results')}
            className="h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">사막전 결과</span>
            <span className="sm:hidden">뒤로</span>
          </Button>
          <div className="flex items-center text-muted-foreground/60 ml-2">
            <span className="hidden sm:inline mx-2">/</span>
            <span className="sm:hidden mx-2">›</span>
          </div>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            AI 사막전 등록
          </span>
        </nav>

        {/* 메인 헤더 */}
        <div className={`transition-all duration-200 ease-in-out ${
          showMinimalHeader ? 'space-y-2' : 'space-y-6'
        }`}>
          {!showMinimalHeader && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="relative p-3 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-blue-500/10 ring-1 ring-purple-500/20 shadow-sm">
                    <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
                    <div className="absolute -top-1 -right-1 animate-pulse">
                      <div className="p-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm">
                        <Sparkles className="h-3 w-3 text-yellow-100" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-purple-500/5 animate-pulse" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-3 sm:mb-4">
                    <span className="bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI 사막전 등록
                    </span>
                  </h1>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
                    <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 ring-1 ring-purple-200/50 dark:ring-purple-800/50">
                      <span className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">
                        🏆 사막전 결과 분석
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 ring-1 ring-green-200/50 dark:ring-green-800/50">
                      <span className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">
                        👥 참석여부 추적
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">사막전 스크린샷으로</span> 결과와 참석여부를 자동 기록하세요.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                        <span>AI가 결과와 MVP 정보를 추출</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        <span>참석여부와 연맹원 매칭</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <span>수동 검증 및 수정 가능</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showMinimalHeader && (
            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-4 py-2">
                <div className="relative flex-shrink-0">
                  <div className="relative p-2 rounded-xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-blue-500/10 ring-1 ring-purple-500/20 shadow-sm">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <div className="absolute -top-0.5 -right-0.5">
                      <div className="p-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500">
                        <Sparkles className="h-2 w-2 text-yellow-100" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    <span className="bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI 사막전 등록
                    </span>
                  </h1>
                  
                  {stepInfo[currentStep] && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const StepIcon = stepInfo[currentStep].icon
                          const stepColorClass = stepInfo[currentStep].color
                          const getBackgroundColor = (colorClass: string) => {
                            const colorMap = {
                              'text-blue-600': 'bg-blue-100 dark:bg-blue-900',
                              'text-purple-600': 'bg-purple-100 dark:bg-purple-900',
                              'text-green-600': 'bg-green-100 dark:bg-green-900',
                              'text-orange-600': 'bg-orange-100 dark:bg-orange-900',
                              'text-emerald-600': 'bg-emerald-100 dark:bg-emerald-900',
                            }
                            return colorMap[colorClass as keyof typeof colorMap] || 'bg-gray-100 dark:bg-gray-900'
                          }
                          
                          return (
                            <>
                              <div className={`p-1 rounded-md ${getBackgroundColor(stepColorClass)}`}>
                                <StepIcon className={`h-3 w-3 ${stepColorClass}`} />
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">
                                {stepInfo[currentStep].title}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {currentStep !== 'welcome' && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {selectedAnalysisType && (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 ring-1 ring-purple-200/50 dark:ring-purple-800/50">
                          {selectedAnalysisType === 'EVENT' ? 
                            <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600" /> :
                            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                          }
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground text-xs sm:text-xs hidden sm:block">분석 유형</div>
                          <div className="font-semibold text-purple-700 dark:text-purple-300 text-xs sm:text-sm">
                            {selectedAnalysisType === 'EVENT' ? '결과 분석' : '참석여부'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">진행률</span>
                      <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 text-xs px-2 py-0.5">
                        {Math.round(getStepProgress(currentStep))}%
                      </Badge>
                    </div>
                    
                    <div className="sm:hidden">
                      <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 text-xs px-2 py-0.5">
                        {Math.round(getStepProgress(currentStep))}%
                      </Badge>
                    </div>
                    
                    <div className="w-12 sm:w-16 lg:w-20">
                      <Progress 
                        value={getStepProgress(currentStep)} 
                        className="w-full h-1.5 sm:h-2" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI 처리 진행 상태 */}
      {currentStep === 'ai-processing' && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI 분석 진행 중...
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">진행률</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {aiProgress.processed} / {aiProgress.total}
                </Badge>
              </div>
              
              <Progress 
                value={(aiProgress.processed / aiProgress.total) * 100} 
                className="w-full h-4" 
              />
            </div>
            
            {aiProgress.currentImage && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-purple-600 animate-pulse" />
                  <div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      현재 처리 중
                    </div>
                    <div className="text-lg font-semibold">{aiProgress.currentImage}</div>
                  </div>
                </div>
              </div>
            )}

            <Alert className="border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p className="font-medium text-purple-700 dark:text-purple-300">
                    AI가 사막전 {selectedAnalysisType === 'EVENT' ? '결과' : '참석여부'} 정보를 분석하고 있습니다
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {selectedAnalysisType === 'EVENT' ? '점수, MVP, 결과를 추출합니다' : '닉네임, 참석여부, 점수를 추출합니다'}</li>
                    <li>• 이미지 품질에 따라 1-2분 정도 소요됩니다</li>
                    <li>• 잠시만 기다려 주세요</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 최종 등록 진행 상태 */}
      {currentStep === 'final-registration' && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                등록 진행 중...
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                {selectedAnalysisType === 'EVENT' ? 
                  <Trophy className="h-4 w-4 text-emerald-600" /> :
                  <Users className="h-4 w-4 text-emerald-600" />
                }
              </div>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    {selectedAnalysisType === 'EVENT' ? '사막전 결과' : '참석여부'} 정보를 서버에 저장하고 있습니다
                  </p>
                  <div className="text-sm text-muted-foreground">
                    잠시만 기다려 주세요. 곧 완료됩니다.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 단계별 컴포넌트 렌더링 */}
      <div>
        {currentStep === 'welcome' && (
          <WelcomeScreen onGetStarted={() => setCurrentStep('type-selection')} />
        )}

        {currentStep === 'type-selection' && (
          <AnalysisTypeSelector
            selectedType={selectedAnalysisType}
            onTypeSelect={setSelectedAnalysisType}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}


        {currentStep === 'image-upload' && (
          <ImageUploadZone
            images={images}
            onImagesAdd={handleImagesAdd}
            onImageRemove={handleImageRemove}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            isProcessing={aiProgress.status === 'processing'}
            analysisType={selectedAnalysisType!}
          />
        )}

        {currentStep === 'validation-editing' && selectedAnalysisType === 'EVENT' && (
          <BattleResultEditor
            data={extractedData as DesertBattleResult}
            onDataUpdate={setExtractedData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            selectedDesert={selectedDesert!}
          />
        )}

        {currentStep === 'validation-editing' && selectedAnalysisType === 'ATTENDANCE' && (
          <AttendanceEditor
            data={extractedData as DesertAttendanceData}
            onDataUpdate={setExtractedData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            selectedDesert={selectedDesert!}
          />
        )}

        {currentStep === 'registration-complete' && registrationResult && (
          <RegistrationCompleteScreen
            result={registrationResult}
            analysisType={selectedAnalysisType!}
            selectedDesert={selectedDesert!}
            onStartNew={handleStartNewRegistration}
          />
        )}
      </div>
    </div>
  )
}