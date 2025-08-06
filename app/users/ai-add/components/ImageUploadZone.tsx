"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
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
  Download
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="relative">
              <Upload className="h-8 w-8 text-green-600" />
              <motion.div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              2단계: 이미진 업로드
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
        </motion.div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* 업로드 영역 */}
        <motion.div
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
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
        >
          {/* 배경 애니메이션 */}
          {isDragOver && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl"
            />
          )}
          
          <div className="relative space-y-6">
            {/* 아이콘 영역 */}
            <motion.div 
              className="flex justify-center"
              animate={isDragOver ? { scale: 1.2, rotate: [0, -5, 5, 0] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`
                p-4 rounded-full transition-all duration-300 shadow-lg
                ${isDragOver 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                <Upload className={`h-10 w-10 transition-transform ${
                  isDragOver ? 'animate-bounce' : ''
                }`} />
              </div>
            </motion.div>
            
            {/* 메인 메시지 */}
            <div className="space-y-4">
              <motion.h3 
                className="text-xl font-bold mb-2"
                animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
              >
                {isDragOver ? '이미지를 여기에 놓아주세요!' : '이미지를 여기로 드래그하세요'}
              </motion.h3>
              <p className="text-sm text-muted-foreground mb-6">
                또는 아래 버튼을 사용해 파일을 선택하거나 클립보드에서 붙여넣으세요
              </p>
              
              {/* 버튼 그룹 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <FileImage className="h-5 w-5 mr-2" />
                    파일 선택
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleClipboardPaste}
                    disabled={isProcessing}
                    size="lg"
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-700 dark:hover:bg-blue-950/30"
                  >
                    <Clipboard className="h-5 w-5 mr-2" />
                    클립보드 붙여넣기
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* 정보 배지 */}
            <motion.div 
              className="space-y-2 text-xs text-muted-foreground bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
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
            </motion.div>
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
        </motion.div>

        {/* 업로드된 이미지 목록 */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-full">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">업로드된 이미진 ({images.length}개)</h3>
                    <p className="text-sm text-muted-foreground">이미지 처리 상태를 확인하세요</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="bg-white dark:bg-gray-800 px-3 py-1"
                  >
                    {images.filter(img => img.status === 'completed').length} / {images.length} 완료
                  </Badge>
                  <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(images.filter(img => img.status === 'completed').length / images.length) * 100}%`
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              
              {/* 이미지 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {images.map((image, index) => (
                    <motion.div 
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {/* 이미지 미리보기 */}
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        
                        {/* 오버레이 상태 */}
                        {image.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mb-2"
                              >
                                <Clock className="h-8 w-8 mx-auto" />
                              </motion.div>
                              <div className="text-sm font-medium">처리 중...</div>
                            </div>
                          </div>
                        )}
                        
                        {image.status === 'completed' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 left-2"
                          >
                            <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          </motion.div>
                        )}
                        
                        {image.status === 'failed' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 left-2"
                          >
                            <div className="bg-red-500 text-white rounded-full p-1 shadow-lg">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          </motion.div>
                        )}
                        
                        {/* 삭제 버튼 */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0 rounded-full shadow-lg hover:scale-110 transition-transform"
                            onClick={() => onImageRemove(image.id)}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                      
                      {/* 이미지 정보 패널 */}
                      <div className="p-4 space-y-3">
                        {/* 파일명 및 상태 */}
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="text-sm font-medium truncate flex-1" 
                            title={image.file.name}
                          >
                            {image.file.name}
                          </span>
                          <Badge 
                            variant={
                              image.status === 'completed' ? 'default' :
                              image.status === 'failed' ? 'destructive' :
                              image.status === 'processing' ? 'secondary' : 'outline'
                            }
                            className="flex-shrink-0"
                          >
                            {image.status === 'completed' && '완료'}
                            {image.status === 'failed' && '실패'}
                            {image.status === 'processing' && '처리중'}
                            {image.status === 'pending' && '대기'}
                          </Badge>
                        </div>
                        
                        {/* 파일 크기 */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Download className="h-3 w-3" />
                          {ImageProcessingService.formatFileSize(image.file.size)}
                        </div>
                        
                        {/* 상태별 추가 정보 */}
                        {image.status === 'completed' && image.players.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md"
                          >
                            <div className="p-1 bg-green-500 rounded-full">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              {image.players.length}명 인식됨
                            </span>
                          </motion.div>
                        )}
                        
                        {image.status === 'failed' && image.error && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md"
                          >
                            <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-red-600 dark:text-red-400 leading-tight">
                              {image.error}
                            </span>
                          </motion.div>
                        )}
                        
                        {image.status === 'processing' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Zap className="h-3 w-3 text-purple-500" />
                              </motion.div>
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                AI 분석 중...
                              </span>
                            </div>
                            <Progress value={75} className="h-1" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 네비게이션 버튼 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={onBack} 
              variant="outline" 
              disabled={isProcessing}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <motion.div
                animate={{ x: isProcessing ? 0 : [-2, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                ←
              </motion.div>
              이전 단계
            </Button>
          </motion.div>
          
          <div className="flex items-center gap-4">
            {images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{images.length}개 이미진 준비됨</span>
                </div>
                {images.filter(img => img.status === 'completed').length > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>{images.filter(img => img.status === 'completed').length}개 완료</span>
                  </div>
                )}
              </motion.div>
            )}
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="h-4 w-4" />
                    </motion.div>
                    처리 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    AI 분석 시작
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      →
                    </motion.div>
                  </div>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}