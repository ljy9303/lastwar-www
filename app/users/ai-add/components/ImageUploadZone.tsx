"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  FileImage,
  Clipboard,
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  Zap,
  Camera,
  Download,
  Sparkles,
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageProcessingService } from "@/lib/image-processing"
import type { ProcessedImage } from "@/types/ai-user-types"

interface ImageUploadZoneProps {
  images: ProcessedImage[]
  onImagesAdd: (files: File[]) => void
  onImageRemove: (id: string) => void
  onNext: () => void
  onBack: () => void
  isProcessing: boolean
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
  maxImages = 10,
  maxSizeMB = 5
}: ImageUploadZoneProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
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

  // 파일 선택 처리
  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      onImagesAdd(validFiles)
      toast({
        title: "이미지 업로드 성공",
        description: `${validFiles.length}개의 이미지가 추가되었습니다.`,
      })
    }
  }, [validateFiles, onImagesAdd, toast])

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect(files)
  }, [handleFileSelect])

  // 파일 입력 변경 처리
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFileSelect(files)
    e.target.value = '' // 같은 파일 재선택 가능
  }, [handleFileSelect])

  // 클립보드 붙여넣기
  const handleClipboardPaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      const files: File[] = []
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], `클립보드_이미지_${Date.now()}.png`, { type: imageType })
          files.push(file)
        }
      }
      
      if (files.length > 0) {
        handleFileSelect(files)
      } else {
        toast({
          title: "클립보드에 이미지가 없습니다",
          description: "먼저 이미지를 복사한 후 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "클립보드 접근 실패",
        description: "브라우저에서 클립보드 접근이 허용되지 않았습니다.",
        variant: "destructive",
      })
    }
  }, [handleFileSelect, toast])

  // 키보드 단축키 (Ctrl+V)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault()
      handleClipboardPaste()
    }
  }, [handleClipboardPaste])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30">
        <div className="ai-fade-in">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="relative">
              <Upload className="h-8 w-8 text-green-600" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ai-pulse-glow" />
            </div>
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              2단계: 이미지 업로드
            </span>
          </CardTitle>
          <div className="space-y-2 mt-3">
            <p className="text-muted-foreground">
              LastWar 연맹원 목록 스크린샷을 업로드해주세요.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <Camera className="h-4 w-4" />
                <span>드래그 & 드롭</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Clipboard className="h-4 w-4" />
                <span>클립보드 붙여넣기</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <Zap className="h-4 w-4" />
                <span>다중 선택</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* 업로드 영역 */}
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 overflow-hidden
            ${isDragOver 
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 scale-105 shadow-lg' 
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-950/20 dark:hover:to-blue-950/20'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* 배경 애니메이션 */}
          {isDragOver && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl ai-pulse-glow" />
          )}
          
          <div className="relative space-y-6">
            {/* 아이콘 영역 */}
            <div className="flex justify-center">
              <div className={`
                p-4 rounded-full transition-all duration-300 shadow-lg
                ${isDragOver 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                <Upload className={`h-10 w-10 transition-transform ${
                  isDragOver ? 'ai-gentle-bounce' : ''
                }`} />
              </div>
            </div>
            
            {/* 메인 메시지 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-2">
                {isDragOver ? '이미지를 여기에 놓아주세요!' : '이미지를 여기로 드래그하세요'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                또는 아래 버튼을 사용해 파일을 선택하거나 클립보드에서 붙여넣으세요
              </p>
              
              {/* 버튼 그룹 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg ai-hover-scale"
                >
                  <FileImage className="h-5 w-5 mr-2" />
                  파일 선택
                </Button>
                
                <Button
                  onClick={handleClipboardPaste}
                  disabled={isProcessing}
                  size="lg"
                  variant="outline"
                  className="border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-700 dark:hover:bg-blue-950/30 ai-hover-scale"
                >
                  <Clipboard className="h-5 w-5 mr-2" />
                  클립보드 붙여넣기
                </Button>
              </div>
            </div>

            {/* 정보 배지 */}
            <div className="space-y-2 text-xs text-muted-foreground bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>지원: JPEG, PNG, WebP</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Download className="h-3 w-3 text-blue-500" />
                  <span>최대: {maxSizeMB}MB 당 {maxImages}개</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3 text-purple-500" />
                  <span>단축키: Ctrl+V</span>
                </div>
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isProcessing}
          />
        </div>

        {/* 업로드된 이미지 목록 */}
        {images.length > 0 && (
          <div className="space-y-4 ai-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                업로드된 이미지 ({images.length}개)
              </h3>
              {images.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {images.filter(img => img.status === 'completed').length}/{images.length} 준비됨
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ai-hover-lift">
                  <div className="aspect-video relative bg-gray-50 dark:bg-gray-900">
                    <img
                      src={image.preview}
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 상태 오버레이 */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 text-white">
                        {image.status === 'processing' && (
                          <>
                            <Clock className="h-4 w-4 ai-gentle-bounce" />
                            <span className="text-sm">처리 중...</span>
                          </>
                        )}
                        {image.status === 'completed' && (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">준비 완료</span>
                          </>
                        )}
                        {image.status === 'error' && (
                          <>
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">오류 발생</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* 삭제 버튼 */}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity ai-hover-scale"
                      onClick={() => onImageRemove(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {image.file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(image.file.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                    
                    {image.status === 'processing' && (
                      <div className="mt-2">
                        <Progress value={50} className="h-1" />
                      </div>
                    )}
                    
                    {image.status === 'completed' && image.players.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                        <Users className="h-3 w-3" />
                        <span>{image.players.length}명 인식됨</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 ai-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="ai-hover-scale">
            <Button 
              onClick={onBack} 
              variant="outline" 
              disabled={isProcessing}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="ai-gentle-sway">←</div>
              이전 단계
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            {images.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full ai-pulse-glow"></div>
                  <span className="font-medium">{images.length}개 이미지 준비됨</span>
                </div>
                {images.filter(img => img.status === 'completed').length > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>{images.filter(img => img.status === 'completed').length}개 완료</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="ai-hover-scale">
              <Button 
                onClick={onNext} 
                disabled={images.length === 0 || isProcessing}
                size="lg"
                className={`
                  min-w-[140px] transition-all duration-300 shadow-lg
                  ${
                    images.length === 0 || isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl'
                  }
                `}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="ai-pulse-glow">
                      <Zap className="h-4 w-4" />
                    </div>
                    처리 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="ai-gentle-bounce">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    AI 분석 시작
                    <div className="ai-gentle-sway">→</div>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}