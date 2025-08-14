"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  FileImage,
  Clipboard,
  AlertCircle,
  Plus,
  CheckCircle,
  Camera,
  ZoomIn,
  Trophy,
  Users,
  ArrowRight,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageOverlay } from "@/components/ui/image-overlay"
import type { ProcessedDesertImage, DesertAnalysisType } from "@/types/ai-desert-types"

interface ImageUploadZoneProps {
  images: ProcessedDesertImage[]
  onImagesAdd: (files: File[]) => void
  onImageRemove: (id: string) => void
  onNext: () => void
  onBack: () => void
  isProcessing: boolean
  analysisType: DesertAnalysisType
  maxImages?: number
  maxSizeMB?: number
}

export function ImageUploadZone({
  images,
  onImagesAdd,
  onImageRemove,
  onNext,
  onBack,
  isProcessing,
  analysisType,
  maxImages = 1, // 사막전은 보통 하나의 스크린샷만 필요
  maxSizeMB = 10
}: ImageUploadZoneProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // 파일 검증
  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = []
    
    for (const file of files) {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        toast({
          title: "지원하지 않는 파일 형식",
          description: `${file.name}은(는) 이미지 파일이 아닙니다.`,
          variant: "destructive",
        })
        continue
      }
      
      // 파일 크기 검증
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: `${file.name}이(가) ${maxSizeMB}MB를 초과합니다.`,
          variant: "destructive",
        })
        continue
      }
      
      validFiles.push(file)
    }
    
    // 최대 이미지 수 검증
    if (images.length + validFiles.length > maxImages) {
      const allowedCount = maxImages - images.length
      toast({
        title: "최대 이미지 수 초과",
        description: `최대 ${maxImages}개까지만 업로드할 수 있습니다. ${allowedCount}개만 추가됩니다.`,
        variant: "destructive",
      })
      return validFiles.slice(0, allowedCount)
    }
    
    return validFiles
  }, [images.length, maxImages, maxSizeMB, toast])

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      onImagesAdd(validFiles)
    }
    // 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    event.target.value = ''
  }, [validateFiles, onImagesAdd])

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      onImagesAdd(validFiles)
    }
  }, [validateFiles, onImagesAdd])

  // 클립보드에서 이미지 붙여넣기
  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      const imageItems = clipboardItems.filter(item => 
        item.types.some(type => type.startsWith('image/'))
      )
      
      if (imageItems.length === 0) {
        toast({
          title: "클립보드에 이미지 없음",
          description: "클립보드에 이미지가 없습니다. 스크린샷을 복사한 후 다시 시도해주세요.",
          variant: "destructive"
        })
        return
      }

      const files: File[] = []
      for (const item of imageItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const file = new File([blob], `clipboard-${Date.now()}.png`, { type })
            files.push(file)
            break
          }
        }
      }

      const validFiles = validateFiles(files)
      if (validFiles.length > 0) {
        onImagesAdd(validFiles)
        toast({
          title: "이미지 추가됨",
          description: "클립보드에서 이미지를 성공적으로 추가했습니다.",
        })
      }
    } catch (error) {
      console.error('클립보드 읽기 실패:', error)
      toast({
        title: "클립보드 읽기 실패",
        description: "클립보드에서 이미지를 읽을 수 없습니다.",
        variant: "destructive"
      })
    }
  }, [validateFiles, onImagesAdd, toast])

  const getImageStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Camera className="h-4 w-4 text-gray-500" />
    }
  }

  const getExampleText = () => {
    return analysisType === 'EVENT' 
      ? {
          title: "사막전 결과 화면 예시",
          description: "사막전 종료 후 나타나는 결과 요약 화면을 캡처하세요",
          tips: [
            "우리팀과 상대팀의 서버명, 연맹명이 명확히 보여야 합니다",
            "최종 점수가 정확히 표시되어야 합니다", 
            "MVP 정보가 포함된 화면이면 더욱 좋습니다",
            "화면이 선명하고 텍스트가 읽기 쉬워야 합니다"
          ]
        }
      : {
          title: "참석여부 화면 예시", 
          description: "사막전 참가자 목록이 표시된 화면을 캡처하세요",
          tips: [
            "연맹원 목록이 모두 보이도록 스크롤하여 캡처하세요",
            "닉네임과 점수가 명확히 보여야 합니다",
            "참석/미참석 상태가 구분되어야 합니다",
            "여러 화면이 필요하면 개별적으로 업로드하세요"
          ]
        }
  }

  const exampleInfo = getExampleText()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            {analysisType === 'EVENT' ? (
              <Trophy className="h-6 w-6 text-orange-600" />
            ) : (
              <Users className="h-6 w-6 text-blue-600" />
            )}
            {analysisType === 'EVENT' ? '사막전 결과' : '참석여부'} 이미지 업로드
          </CardTitle>
          <p className="text-center text-muted-foreground">
            {exampleInfo.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 업로드 안내 */}
          <Alert className={`border-2 ${
            analysisType === 'EVENT' 
              ? 'border-orange-200 dark:border-orange-800' 
              : 'border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {analysisType === 'EVENT' ? (
                <Trophy className="h-4 w-4 text-orange-600" />
              ) : (
                <Users className="h-4 w-4 text-blue-600" />
              )}
              <span className="font-semibold">{exampleInfo.title}</span>
            </div>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <div className="font-medium text-foreground mb-2">촬영 팁:</div>
                <ul className="space-y-1 text-sm">
                  {exampleInfo.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
              ${isDragOver 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                : 'border-muted-foreground/30 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/10'
              }
              ${images.length >= maxImages ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={maxImages > 1}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={images.length >= maxImages}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {images.length >= maxImages 
                    ? `최대 ${maxImages}개 이미지 업로드 완료` 
                    : '이미지를 업로드하세요'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {images.length >= maxImages 
                    ? '더 이상 이미지를 추가할 수 없습니다.' 
                    : '파일을 드래그하거나 클릭하여 선택하세요'
                  }
                </p>
              </div>
              
              {images.length < maxImages && (
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    <FileImage className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePaste() }}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    클립보드에서 붙여넣기
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 업로드된 이미지 목록 */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  업로드된 이미지 ({images.length}/{maxImages})
                </h3>
                {images.length >= maxImages && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    업로드 완료
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {images.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* 썸네일 */}
                        <div 
                          className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedImage(image.preview)
                            setImageViewerOpen(true)
                          }}
                        >
                          <img 
                            src={image.preview} 
                            alt="업로드된 이미지"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <ZoomIn className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        
                        {/* 파일 정보 */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {image.file.name}
                            </span>
                            {getImageStatusIcon(image.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(image.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          {image.error && (
                            <div className="text-sm text-red-500">
                              오류: {image.error}
                            </div>
                          )}
                        </div>
                        
                        {/* 삭제 버튼 */}
                        {!isProcessing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onImageRemove(image.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 추가 이미지 업로드 버튼 */}
          {images.length > 0 && images.length < maxImages && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={isProcessing}
              >
                <Plus className="h-4 w-4" />
                이미지 추가 ({images.length}/{maxImages})
              </Button>
            </div>
          )}

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              이전
            </Button>
            
            <Button 
              onClick={onNext}
              disabled={images.length === 0 || isProcessing}
              className={`flex items-center gap-2 ${
                images.length > 0 && !isProcessing
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
                  : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                <>
                  다음: AI 분석 시작
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 이미지 뷰어 오버레이 */}
      {imageViewerOpen && selectedImage && (
        <ImageOverlay
          src={selectedImage}
          alt="업로드된 이미지 미리보기"
          onClose={() => {
            setImageViewerOpen(false)
            setSelectedImage(null)
          }}
        />
      )}
    </div>
  )
}