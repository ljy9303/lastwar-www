"use client"

import { useState, useRef, useCallback } from "react"
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
  Plus
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

  // 파일 선택 처리
  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    
    for (const file of fileArray) {
      // 이미지 파일 확인
      if (!ImageProcessingService.isImageFile(file)) {
        toast({
          title: "지원하지 않는 파일",
          description: `${file.name}은(는) 이미지 파일이 아닙니다.`,
          variant: "destructive"
        })
        continue
      }

      // 지원되는 형식 확인
      if (!ImageProcessingService.isSupportedImageType(file)) {
        toast({
          title: "지원하지 않는 형식",
          description: `${file.name}은(는) 지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 지원)`,
          variant: "destructive"
        })
        continue
      }

      // 파일 크기 확인
      if (!ImageProcessingService.isFileSizeValid(file, maxSizeMB)) {
        toast({
          title: "파일 크기 초과",
          description: `${file.name}은(는) ${maxSizeMB}MB를 초과합니다.`,
          variant: "destructive"
        })
        continue
      }

      validFiles.push(file)
    }

    // 최대 이미지 수 확인
    if (images.length + validFiles.length > maxImages) {
      toast({
        title: "이미지 수 초과",
        description: `최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`,
        variant: "destructive"
      })
      return
    }

    if (validFiles.length > 0) {
      onImagesAdd(validFiles)
    }
  }, [images.length, maxImages, maxSizeMB, onImagesAdd, toast])

  // 파일 입력 변경
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      handleFileSelect(files)
    }
    // 입력값 초기화 (같은 파일 다시 선택 가능)
    event.target.value = ''
  }, [handleFileSelect])

  // 드래그 앤 드롭
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = ImageProcessingService.getFilesFromDrop(e)
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  // 클립보드 붙여넣기
  const handleClipboardPaste = useCallback(async () => {
    try {
      const files = await ImageProcessingService.getImagesFromClipboard()
      if (files.length === 0) {
        toast({
          title: "클립보드에 이미지 없음",
          description: "클립보드에 이미지가 없습니다. 스크린샷을 복사한 후 다시 시도해주세요.",
          variant: "destructive"
        })
        return
      }
      
      handleFileSelect(files)
      
      toast({
        title: "클립보드에서 이미지 추가됨",
        description: `${files.length}개의 이미지가 클립보드에서 추가되었습니다.`,
      })
    } catch (error) {
      console.error("클립보드 처리 실패:", error)
      toast({
        title: "클립보드 접근 실패",
        description: "클립보드에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.",
        variant: "destructive"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          2단계: 이미지 업로드
        </CardTitle>
        <p className="text-muted-foreground">
          Last War 연맹원 목록 스크린샷을 업로드해주세요. 
          여러 이미지를 한 번에 업로드하거나 클립보드에서 붙여넣기가 가능합니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 업로드 영역 */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">이미지를 여기로 드래그하세요</h3>
              <p className="text-sm text-muted-foreground mb-4">
                또는 아래 버튼으로 파일을 선택하거나 클립보드에서 붙여넣으세요
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  variant="default"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  파일 선택
                </Button>
                
                <Button
                  onClick={handleClipboardPaste}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  클립보드에서 붙여넣기
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>지원 형식: JPEG, PNG, WebP</p>
              <p>최대 크기: {maxSizeMB}MB | 최대 개수: {maxImages}개</p>
              <p>단축키: Ctrl+V로 클립보드에서 붙여넣기</p>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">업로드된 이미지 ({images.length}개)</h3>
              <Badge variant="outline">
                {images.filter(img => img.status === 'completed').length} / {images.length} 완료
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative border rounded-lg overflow-hidden">
                  {/* 이미지 미리보기 */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => onImageRemove(image.id)}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  {/* 이미지 정보 */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate" title={image.file.name}>
                        {image.file.name}
                      </span>
                      <Badge variant={
                        image.status === 'completed' ? 'default' :
                        image.status === 'failed' ? 'destructive' :
                        image.status === 'processing' ? 'secondary' : 'outline'
                      }>
                        {image.status === 'completed' && '완료'}
                        {image.status === 'failed' && '실패'}
                        {image.status === 'processing' && '처리중'}
                        {image.status === 'pending' && '대기'}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {ImageProcessingService.formatFileSize(image.file.size)}
                    </div>
                    
                    {image.status === 'completed' && image.players.length > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        <ImageIcon className="h-3 w-3 inline mr-1" />
                        {image.players.length}명 인식됨
                      </div>
                    )}
                    
                    {image.status === 'failed' && image.error && (
                      <div className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{image.error}</span>
                      </div>
                    )}
                    
                    {image.status === 'processing' && (
                      <div className="space-y-1">
                        <Progress value={50} className="h-1" />
                        <div className="text-xs text-muted-foreground">OCR 처리중...</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button onClick={onBack} variant="outline" disabled={isProcessing}>
            이전 단계
          </Button>
          
          <div className="flex items-center gap-3">
            {images.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {images.length}개 이미지 업로드됨
              </span>
            )}
            
            <Button 
              onClick={onNext} 
              disabled={images.length === 0 || isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <>처리중...</>
              ) : (
                <>OCR 시작</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}