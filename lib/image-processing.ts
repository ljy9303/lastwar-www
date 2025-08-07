"use client"

export class ImageProcessingService {
  /**
   * 이미지 파일을 압축하여 최적화
   */
  static async compressImage(file: File, maxSize: number = 1024, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
          // 원본 크기 계산
          let { width, height } = img

          // 크기 조정 (maxSize 기준)
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height)
            width *= ratio
            height *= ratio
          }

          // 캔버스 크기 설정
          canvas.width = width
          canvas.height = height

          // 이미지 그리기
          ctx?.drawImage(img, 0, 0, width, height)

          // Blob으로 변환
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob], 
                  file.name, 
                  { type: 'image/jpeg' }
                )
                resolve(compressedFile)
              } else {
                reject(new Error('이미지 압축에 실패했습니다.'))
              }
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 이미지 파일인지 확인
   */
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
  }

  /**
   * 지원되는 이미지 타입인지 확인
   */
  static isSupportedImageType(file: File): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ]
    return supportedTypes.includes(file.type)
  }

  /**
   * 파일 크기 제한 확인
   */
  static isFileSizeValid(file: File, maxSizeMB: number): boolean {
    return file.size <= maxSizeMB * 1024 * 1024
  }

  /**
   * 이미지 미리보기 URL 생성
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * 메모리 정리를 위한 미리보기 URL 해제
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  /**
   * 클립보드에서 이미지 추출
   */
  static async getImagesFromClipboard(): Promise<File[]> {
    try {
      const clipboardItems = await navigator.clipboard.read()
      const imageFiles: File[] = []

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type)
            const file = new File(
              [blob], 
              `clipboard-${Date.now()}.${type.split('/')[1]}`, 
              { type }
            )
            imageFiles.push(file)
          }
        }
      }

      return imageFiles
    } catch (error) {
      console.error('클립보드에서 이미지 추출 실패:', error)
      return []
    }
  }

  /**
   * 드래그앤드롭에서 파일 추출
   */
  static getFilesFromDrop(event: DragEvent): File[] {
    const files: File[] = []
    
    if (event.dataTransfer?.items) {
      // DataTransferItemList 사용
      Array.from(event.dataTransfer.items).forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file && this.isImageFile(file)) {
            files.push(file)
          }
        }
      })
    } else if (event.dataTransfer?.files) {
      // DataTransferFileList 사용
      Array.from(event.dataTransfer.files).forEach((file) => {
        if (this.isImageFile(file)) {
          files.push(file)
        }
      })
    }

    return files
  }

  /**
   * 여러 이미지를 배치로 압축
   */
  static async compressImages(files: File[], maxSize: number = 1024, quality: number = 0.8): Promise<File[]> {
    const compressedFiles: File[] = []
    
    for (const file of files) {
      try {
        const compressedFile = await this.compressImage(file, maxSize, quality)
        compressedFiles.push(compressedFile)
      } catch (error) {
        console.error(`파일 ${file.name} 압축 실패:`, error)
        // 압축 실패 시 원본 파일 사용
        compressedFiles.push(file)
      }
    }

    return compressedFiles
  }

  /**
   * 이미지 메타데이터 추출
   */
  static async getImageMetadata(file: File): Promise<{
    name: string
    size: number
    type: string
    lastModified: number
    width?: number
    height?: number
  }> {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }

    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      return {
        ...metadata,
        width: img.width,
        height: img.height
      }
    } catch (error) {
      console.error('이미지 메타데이터 추출 실패:', error)
      return metadata
    }
  }
}