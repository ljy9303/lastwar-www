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
  Shield,
  Upload,
  Search,
  UserPlus,
  CheckSquare
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GeminiAIService } from "@/lib/gemini-ai"
import { ImageProcessingService } from "@/lib/image-processing"
import { autoUpsertUsers } from "@/lib/api-service"
import { UserGradeSelector } from "./UserGradeSelector"
import { ImageUploadZone } from "./ImageUploadZone"
import { AIResultEditor } from "./AIResultEditor"
import type { 
  RegistrationStep, 
  ProcessedImage, 
  ValidatedPlayerInfo,
  AIProgress 
} from "@/types/ai-user-types"

export function AIUserRegistration() {
  const router = useRouter()
  const { toast } = useToast()
  
  // 단계 관리
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('grade-selection')
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  
  // 이미지 및 AI 상태
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [extractedPlayers, setExtractedPlayers] = useState<ValidatedPlayerInfo[]>([])
  const [aiProgress, setAiProgress] = useState<AIProgress>({
    total: 0,
    processed: 0,
    status: 'idle'
  })

  // 서비스 인스턴스
  const [aiService] = useState(() => {
    try {
      return new GeminiAIService()
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

  // 단계별 진행률 계산
  const getStepProgress = (step: RegistrationStep): number => {
    const steps = ['grade-selection', 'image-upload', 'ai-processing', 'validation-editing', 'final-registration']
    return ((steps.indexOf(step) + 1) / steps.length) * 100
  }

  // 단계별 정보 정의
  const stepInfo = {
    'grade-selection': {
      icon: Shield,
      title: '등급 선택',
      description: '신규 연맹원들의 연맹 등급을 선택하세요',
      color: 'text-blue-600'
    },
    'image-upload': {
      icon: Upload,
      title: '이미지 업로드',
      description: '연맹원 목록 스크린샷을 업로드하세요',
      color: 'text-green-600'
    },
    'ai-processing': {
      icon: Search,
      title: 'AI 분석',
      description: 'AI가 이미지에서 연맹원 정보를 추출합니다',
      color: 'text-purple-600'
    },
    'validation-editing': {
      icon: CheckSquare,
      title: '정보 검증',
      description: '추출된 정보를 검토하고 수정하세요',
      color: 'text-orange-600'
    },
    'final-registration': {
      icon: UserPlus,
      title: '등록 완료',
      description: '검증된 정보로 연맹원을 등록합니다',
      color: 'text-emerald-600'
    }
  }

  // 이미지 추가 처리
  const handleImagesAdd = useCallback(async (files: File[]) => {
    const newImages: ProcessedImage[] = []

    for (const file of files) {
      try {
        // 이미지 압축
        const compressedFile = await ImageProcessingService.compressImage(file, 1024, 0.8)
        
        const processedImage: ProcessedImage = {
          id: `${Date.now()}-${Math.random()}`,
          file: compressedFile,
          preview: ImageProcessingService.createPreviewUrl(compressedFile),
          status: 'pending',
          players: []
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
    if (!aiService || images.length === 0) {
      toast({
        title: "처리 불가",
        description: "AI 서비스를 사용할 수 없거나 이미지가 없습니다.",
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

    const allPlayers: ValidatedPlayerInfo[] = []

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      
      // 이미지 상태 업데이트
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, status: 'processing' }
          : img
      ))

      setAiProgress(prev => ({
        ...prev,
        processed: i,
        currentImage: image.file.name
      }))

      try {
        const result = await aiService.extractPlayerInfo(image.file, i)
        
        if (result.success && result.players.length > 0) {
          // 플레이어 정보를 ValidatedPlayerInfo로 변환
          const validatedPlayers: ValidatedPlayerInfo[] = result.players.map(player => ({
            ...player,
            isValid: true,
            errors: [],
            isDuplicate: false
          }))

          allPlayers.push(...validatedPlayers)

          // 이미지 상태 업데이트
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { 
                  ...img, 
                  status: 'completed',
                  players: result.players
                }
              : img
          ))

          toast({
            title: `이미지 ${i + 1} 처리 완료`,
            description: `${result.players.length}명의 연맹원 정보를 인식했습니다.`,
          })
        } else {
          // 처리 실패
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { 
                  ...img, 
                  status: 'failed',
                  error: result.error || "연맹원 정보를 인식할 수 없습니다."
                }
              : img
          ))

          toast({
            title: `이미지 ${i + 1} 처리 실패`,
            description: result.error || "AI 처리 중 오류가 발생했습니다.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error(`이미지 ${i + 1} AI 처리 실패:`, error)
        
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { 
                ...img, 
                status: 'failed',
                error: error instanceof Error ? error.message : "알 수 없는 오류"
              }
            : img
        ))

        toast({
          title: `이미지 ${i + 1} 처리 실패`,
          description: "AI 처리 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      }

      // API 제한을 고려한 지연
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    // AI 처리 완료
    setAiProgress({
      total: images.length,
      processed: images.length,
      status: 'completed'
    })

    if (allPlayers.length > 0) {
      // 중복 및 유효성 검사
      const validatedPlayers = validateAllPlayers(allPlayers)
      setExtractedPlayers(validatedPlayers)
      
      toast({
        title: "AI 처리 완료",
        description: `총 ${validatedPlayers.length}명의 연맹원 정보가 인식되었습니다.`,
      })

      // 검증 단계로 이동
      setCurrentStep('validation-editing')
    } else {
      toast({
        title: "인식 실패",
        description: "연맹원 정보를 인식하지 못했습니다. 다른 이미지를 시도해보세요.",
        variant: "destructive"
      })
      
      setCurrentStep('image-upload')
    }
  }, [aiService, images, toast])

  // 모든 플레이어 유효성 검사
  const validateAllPlayers = (players: ValidatedPlayerInfo[]): ValidatedPlayerInfo[] => {
    return players.map((player, index) => {
      const errors: string[] = []

      // 닉네임 검사
      if (!player.nickname || player.nickname.trim().length === 0) {
        errors.push("닉네임이 비어있습니다")
      } else if (player.nickname.length < 2) {
        errors.push("닉네임이 너무 짧습니다")
      } else if (player.nickname.length > 20) {
        errors.push("닉네임이 너무 깁니다")
      }

      // 레벨 검사
      if (player.level < 1 || player.level > 50) {
        errors.push("레벨이 유효하지 않습니다")
      }

      // 전투력 검사
      if (!player.power || player.power.trim().length === 0) {
        errors.push("전투력 정보가 없습니다")
      }

      // 중복 검사
      const isDuplicate = players.some((p, i) => 
        i !== index && 
        p.nickname.toLowerCase().trim() === player.nickname.toLowerCase().trim()
      )

      return {
        ...player,
        isValid: errors.length === 0,
        errors,
        isDuplicate
      }
    })
  }

  // 최종 유저 등록
  const handleFinalRegistration = useCallback(async () => {
    if (!selectedGrade || extractedPlayers.length === 0) {
      toast({
        title: "등록 불가",
        description: "등급이 선택되지 않았거나 등록할 연맹원이 없습니다.",
        variant: "destructive"
      })
      return
    }

    setCurrentStep('final-registration')

    try {
      // 유효한 플레이어만 필터링
      const validPlayers = extractedPlayers.filter(p => p.isValid)
      
      if (validPlayers.length === 0) {
        toast({
          title: "등록할 연맹원 없음",
          description: "유효한 연맹원 데이터가 없습니다.",
          variant: "destructive"
        })
        setCurrentStep('validation-editing')
        return
      }

      // 백엔드 API 호출을 위한 데이터 변환
      const membersToRegister = validPlayers.map(player => {
        const powerValue = parsePowerString(player.editedPower || player.power)
        
        return {
          name: player.editedNickname || player.nickname,
          level: player.editedLevel || player.level,
          power: powerValue,
          userGrade: selectedGrade,
          leave: false
        }
      })

      // 기존 autoUpsertUsers API 사용
      console.log("등록할 연맹원 데이터:", membersToRegister)
      const result = await autoUpsertUsers(membersToRegister)
      
      console.log("API 응답 결과:", result)

      // 결과에 따른 성공 메시지
      let message = ""
      if (result.insertedCount > 0) {
        message += `신규 ${result.insertedCount}명`
      }
      if (result.updatedCount > 0) {
        if (message) message += ", "
        message += `업데이트 ${result.updatedCount}명`
      }
      if (result.failedCount > 0) {
        if (message) message += ", "
        message += `실패 ${result.failedCount}명`
      }

      toast({
        title: "AI 연맹원 등록 완료",
        description: message || `${validPlayers.length}명 처리 완료`,
        variant: result.failedCount > 0 ? "destructive" : "default",
        duration: 8000
      })

      // 실패한 항목이 있으면 추가 정보 표시
      if (result.failedCount > 0 && result.failedNames?.length > 0) {
        toast({
          title: "등록 실패 항목",
          description: `실패: ${result.failedNames.join(', ')}`,
          variant: "destructive",
          duration: 10000
        })
      }

      // 유저 관리 페이지로 이동
      setTimeout(() => {
        router.push('/users')
      }, 2000)
      
    } catch (error) {
      console.error("유저 등록 실패:", error)
      toast({
        title: "등록 실패",
        description: error instanceof Error ? error.message : "유저 등록 중 오류가 발생했습니다.",
        variant: "destructive"
      })
      setCurrentStep('validation-editing')
    }
  }, [selectedGrade, extractedPlayers, router, toast])

  // 전투력 문자열 파싱
  const parsePowerString = (powerStr: string): number => {
    const cleanStr = powerStr.replace(/[^0-9.KMB]/g, '')
    const numberMatch = cleanStr.match(/([0-9.]+)([KMB]?)/)
    
    if (!numberMatch) return 0
    
    const value = parseFloat(numberMatch[1])
    const unit = numberMatch[2]
    
    switch (unit) {
      case 'K':
        return value * 0.001
      case 'M':
        return value
      case 'B':
        return value * 1000
      default:
        return value
    }
  }

  // 이전 단계로 이동
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'image-upload':
        setCurrentStep('grade-selection')
        break
      case 'ocr-processing':
        setCurrentStep('image-upload')
        break
      case 'validation-editing':
        setCurrentStep('image-upload')
        break
      case 'final-registration':
        setCurrentStep('validation-editing')
        break
    }
  }

  // 다음 단계로 이동
  const goToNextStep = () => {
    switch (currentStep) {
      case 'grade-selection':
        if (selectedGrade) {
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 헤더 */}
      <div 
        className="flex items-center gap-4"
      >
        <Button
          variant="outline"
          onClick={() => router.push('/users')}
          className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          연맹원 관리로 돌아가기
        </Button>
        
        <div className="flex-1">
          <h1 
            className="text-3xl font-bold flex items-center gap-3"
          >
            <div className="relative">
              <Bot className="h-8 w-8 text-blue-600" />
              <div
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            AI 연맹원 등록
          </h1>
          <p 
            className="text-muted-foreground mt-2"
          >
            스크린샷 이미지로 간편하게 여러 연맹원을 한 번에 등록하세요. AI가 자동으로 정보를 추출합니다.
          </p>
        </div>
      </div>

      {/* 진행률 표시 */}
      <div
      >
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  진행 상황
                </h3>
                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  {Math.round(getStepProgress(currentStep))}% 완료
                </Badge>
              </div>
              
              <div className="relative">
                <Progress 
                  value={getStepProgress(currentStep)} 
                  className="w-full h-3" 
                />
                <div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(stepInfo).map(([step, info], index) => {
                  const Icon = info.icon
                  const isActive = currentStep === step
                  const isCompleted = Object.keys(stepInfo).indexOf(currentStep) > index
                  
                  return (
                    <div
                      key={step}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-300
                        ${isActive 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md scale-105' 
                          : isCompleted
                          ? 'border-green-300 bg-green-50 dark:bg-green-950/30'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`
                          p-2 rounded-full transition-colors
                          ${isActive 
                            ? 'bg-blue-500 text-white' 
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${
                            isActive ? 'text-blue-700 dark:text-blue-300' : 
                            isCompleted ? 'text-green-700 dark:text-green-300' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {index + 1}. {info.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 hidden lg:block">
                            {info.description}
                          </div>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-lg border-2 border-blue-400"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI 처리 진행 상태 */}
      <>
        {currentStep === 'ai-processing' && (
          <div
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    <div
                      className="absolute inset-0 rounded-full border-2 border-purple-300"
                    />
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
                  
                  <div className="relative">
                    <Progress 
                      value={(aiProgress.processed / aiProgress.total) * 100} 
                      className="w-full h-4" 
                    />
                    <div
                      className="absolute top-0 left-0 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
                
                {aiProgress.currentImage && (
                  <div 
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-800"
                  >
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

                <Alert className="border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <div
                    >
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        AI가 이미지에서 연맹원 정보를 정밀하게 분석하고 있습니다
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• 닉네임, 레벨, 전투력 정보를 추출합니다</li>
                        <li>• 이미지 품질에 따라 1-3분 정도 소요됩니다</li>
                        <li>• 잠시만 기다려 주세요</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </>

      {/* 최종 등록 진행 상태 */}
      <>
        {currentStep === 'final-registration' && (
          <div
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <div
                      className="absolute inset-0"
                    >
                      <UserPlus className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    연맹원 등록 중...
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                >
                  <Alert className="border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <div
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <UserPlus className="h-4 w-4 text-emerald-600" />
                    </div>
                    <AlertDescription className="mt-2">
                      <div className="space-y-2">
                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                          검증된 연맹원 정보를 서버에 등록하고 있습니다
                        </p>
                        <div className="text-sm text-muted-foreground">
                          잠시만 기다려 주세요. 곧 완료됩니다.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>

      {/* 단계별 컴포넌트 렌더링 */}
      <div>
        {currentStep === 'grade-selection' && (
          <div
            key="grade-selection"
          >
            <UserGradeSelector
              selectedGrade={selectedGrade}
              onGradeSelect={setSelectedGrade}
              onNext={goToNextStep}
            />
          </div>
        )}

        {currentStep === 'image-upload' && (
          <div
            key="image-upload"
          >
            <ImageUploadZone
              images={images}
              onImagesAdd={handleImagesAdd}
              onImageRemove={handleImageRemove}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              isProcessing={aiProgress.status === 'processing'}
            />
          </div>
        )}

        {currentStep === 'validation-editing' && (
          <div
            key="validation-editing"
          >
            <AIResultEditor
              players={extractedPlayers}
              images={images}
              onPlayersUpdate={setExtractedPlayers}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              selectedGrade={selectedGrade!}
            />
          </div>
        )}
      </div>
    </div>
  )
}