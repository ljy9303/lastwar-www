"use client"

import { useState, useCallback } from "react"
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
  Bot
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GeminiOCRService } from "@/lib/gemini-ocr"
import { ImageProcessingService } from "@/lib/image-processing"
import { autoUpsertUsers } from "@/lib/api-service"
import { UserGradeSelector } from "./UserGradeSelector"
import { ImageUploadZone } from "./ImageUploadZone"
import { OCRResultEditor } from "./OCRResultEditor"
import type { 
  RegistrationStep, 
  ProcessedImage, 
  ValidatedPlayerInfo,
  OCRProgress 
} from "@/types/ai-user-types"

export function AIUserRegistration() {
  const router = useRouter()
  const { toast } = useToast()
  
  // 단계 관리
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('grade-selection')
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  
  // 이미지 및 OCR 상태
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [extractedPlayers, setExtractedPlayers] = useState<ValidatedPlayerInfo[]>([])
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    total: 0,
    processed: 0,
    status: 'idle'
  })

  // 서비스 인스턴스
  const [ocrService] = useState(() => {
    try {
      return new GeminiOCRService()
    } catch (error) {
      console.error("Gemini OCR 서비스 초기화 실패:", error)
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
    const steps = ['grade-selection', 'image-upload', 'ocr-processing', 'validation-editing', 'final-registration']
    return ((steps.indexOf(step) + 1) / steps.length) * 100
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

  // OCR 처리 시작
  const startOCRProcessing = useCallback(async () => {
    if (!ocrService || images.length === 0) {
      toast({
        title: "처리 불가",
        description: "OCR 서비스를 사용할 수 없거나 이미지가 없습니다.",
        variant: "destructive"
      })
      return
    }

    setCurrentStep('ocr-processing')
    setOcrProgress({
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

      setOcrProgress(prev => ({
        ...prev,
        processed: i,
        currentImage: image.file.name
      }))

      try {
        const result = await ocrService.extractPlayerInfo(image.file, i)
        
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
            description: `${result.players.length}명의 유저 정보를 인식했습니다.`,
          })
        } else {
          // 처리 실패
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { 
                  ...img, 
                  status: 'failed',
                  error: result.error || "유저 정보를 인식할 수 없습니다."
                }
              : img
          ))

          toast({
            title: `이미지 ${i + 1} 처리 실패`,
            description: result.error || "OCR 처리 중 오류가 발생했습니다.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error(`이미지 ${i + 1} OCR 처리 실패:`, error)
        
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
          description: "OCR 처리 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      }

      // API 제한을 고려한 지연
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    // OCR 완료
    setOcrProgress({
      total: images.length,
      processed: images.length,
      status: 'completed'
    })

    if (allPlayers.length > 0) {
      // 중복 및 유효성 검사
      const validatedPlayers = validateAllPlayers(allPlayers)
      setExtractedPlayers(validatedPlayers)
      
      toast({
        title: "OCR 처리 완료",
        description: `총 ${validatedPlayers.length}명의 유저 정보가 인식되었습니다.`,
      })

      // 검증 단계로 이동
      setCurrentStep('validation-editing')
    } else {
      toast({
        title: "인식 실패",
        description: "유저 정보를 인식하지 못했습니다. 다른 이미지를 시도해보세요.",
        variant: "destructive"
      })
      
      setCurrentStep('image-upload')
    }
  }, [ocrService, images, toast])

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
        description: "등급이 선택되지 않았거나 등록할 유저가 없습니다.",
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
          title: "등록할 유저 없음",
          description: "유효한 유저 데이터가 없습니다.",
          variant: "destructive"
        })
        setCurrentStep('validation-editing')
        return
      }

      // 백엔드 API 호출을 위한 데이터 변환
      const usersToRegister = validPlayers.map(player => {
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
      console.log("등록할 유저 데이터:", usersToRegister)
      const result = await autoUpsertUsers(usersToRegister)
      
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
        title: "AI 유저 등록 완료",
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
          startOCRProcessing()
        }
        break
      case 'validation-editing':
        handleFinalRegistration()
        break
    }
  }

  if (!ocrService) {
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/users')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          유저 관리로 돌아가기
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            AI 유저 등록
          </h1>
          <p className="text-muted-foreground mt-2">
            스크린샷 이미지로 간편하게 여러 유저를 한 번에 등록하세요
          </p>
        </div>
      </div>

      {/* 진행률 표시 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">진행 상황</h3>
              <Badge variant="outline">
                {Math.round(getStepProgress(currentStep))}% 완료
              </Badge>
            </div>
            <Progress value={getStepProgress(currentStep)} className="w-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
              <div className={`text-center p-2 rounded ${currentStep === 'grade-selection' ? 'bg-blue-100 dark:bg-blue-950' : ''}`}>
                1. 등급 선택
              </div>
              <div className={`text-center p-2 rounded ${currentStep === 'image-upload' ? 'bg-blue-100 dark:bg-blue-950' : ''}`}>
                2. 이미지 업로드
              </div>
              <div className={`text-center p-2 rounded ${currentStep === 'ocr-processing' ? 'bg-blue-100 dark:bg-blue-950' : ''}`}>
                3. AI 분석
              </div>
              <div className={`text-center p-2 rounded ${currentStep === 'validation-editing' ? 'bg-blue-100 dark:bg-blue-950' : ''}`}>
                4. 정보 확인
              </div>
              <div className={`text-center p-2 rounded ${currentStep === 'final-registration' ? 'bg-blue-100 dark:bg-blue-950' : ''}`}>
                5. 등록 완료
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR 진행 상태 */}
      {currentStep === 'ocr-processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              AI 분석 진행 중...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행률</span>
                <span>{ocrProgress.processed} / {ocrProgress.total}</span>
              </div>
              <Progress 
                value={(ocrProgress.processed / ocrProgress.total) * 100} 
                className="w-full" 
              />
            </div>
            
            {ocrProgress.currentImage && (
              <div className="text-sm text-muted-foreground">
                현재 처리 중: <span className="font-medium">{ocrProgress.currentImage}</span>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                AI가 이미지를 분석하고 있습니다. 잠시만 기다려 주세요. 
                이 과정은 이미지 수와 크기에 따라 1-3분 정도 소요될 수 있습니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 최종 등록 중 */}
      {currentStep === 'final-registration' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              유저 등록 중...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                유저 정보를 서버에 등록하고 있습니다. 잠시만 기다려 주세요.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 단계별 컴포넌트 렌더링 */}
      {currentStep === 'grade-selection' && (
        <UserGradeSelector
          selectedGrade={selectedGrade}
          onGradeSelect={setSelectedGrade}
          onNext={goToNextStep}
        />
      )}

      {currentStep === 'image-upload' && (
        <ImageUploadZone
          images={images}
          onImagesAdd={handleImagesAdd}
          onImageRemove={handleImageRemove}
          onNext={goToNextStep}
          onBack={goToPreviousStep}
          isProcessing={ocrProgress.status === 'processing'}
        />
      )}

      {currentStep === 'validation-editing' && (
        <OCRResultEditor
          players={extractedPlayers}
          images={images}
          onPlayersUpdate={setExtractedPlayers}
          onNext={goToNextStep}
          onBack={goToPreviousStep}
          selectedGrade={selectedGrade!}
        />
      )}
    </div>
  )
}