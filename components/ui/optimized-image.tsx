"use client"

import * as React from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

/**
 * 모바일 최적화된 이미지 컴포넌트
 * 
 * 디바이스별 최적 해상도와 포맷을 자동으로 선택하고,
 * lazy loading과 placeholder를 제공합니다.
 */

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  /** 이미지 소스 */
  src: string
  /** 대체 텍스트 (접근성 필수) */
  alt: string
  /** 모바일 최적화 버전 소스 */
  mobileSrc?: string
  /** 플레이스홀더 타입 */
  placeholder?: 'blur' | 'skeleton' | 'none'
  /** 스켈레톤 색상 */
  skeletonColor?: string
  /** 종횡비 유지 */
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto'
  /** 이미지 로딩 우선순위 */
  loadPriority?: 'high' | 'normal' | 'low'
  /** 에러 시 대체 이미지 */
  fallbackSrc?: string
}

const aspectRatioStyles = {
  'square': 'aspect-square',
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  'auto': ''
}

/**
 * 이미지 스켈레톤 컴포넌트
 */
const ImageSkeleton: React.FC<{
  className?: string
  color?: string
}> = ({ className, color = 'bg-muted' }) => (
  <div 
    className={cn(
      "animate-pulse rounded-md",
      color,
      className
    )}
    aria-label="이미지 로딩 중"
  />
)

export const OptimizedImage = React.forwardRef<HTMLDivElement, OptimizedImageProps>(
  ({
    src,
    alt,
    mobileSrc,
    placeholder = 'skeleton',
    skeletonColor,
    aspectRatio = 'auto',
    loadPriority = 'normal',
    fallbackSrc = '/placeholder.svg',
    className,
    width,
    height,
    fill,
    sizes,
    quality = 85,
    ...props
  }, ref) => {
    const isMobile = useMobile()
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)
    const [imageSrc, setImageSrc] = React.useState(src)

    // 모바일 최적화 소스 선택
    const optimizedSrc = React.useMemo(() => {
      if (isMobile && mobileSrc) {
        return mobileSrc
      }
      return imageSrc
    }, [isMobile, mobileSrc, imageSrc])

    // 모바일에 맞는 sizes 속성 자동 계산
    const responsiveSizes = React.useMemo(() => {
      if (sizes) return sizes
      
      // 기본 반응형 sizes
      if (fill) {
        return "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      }
      
      return "(max-width: 768px) 100vw, 800px"
    }, [sizes, fill])

    // 로딩 우선순위에 따른 loading 속성
    const loadingStrategy = React.useMemo(() => {
      switch (loadPriority) {
        case 'high':
          return 'eager' as const
        case 'low':
          return 'lazy' as const
        default:
          return 'lazy' as const
      }
    }, [loadPriority])

    // 이미지 로드 완료 핸들러
    const handleImageLoad = React.useCallback(() => {
      setIsLoading(false)
      setHasError(false)
    }, [])

    // 이미지 로드 에러 핸들러
    const handleImageError = React.useCallback(() => {
      setIsLoading(false)
      setHasError(true)
      setImageSrc(fallbackSrc)
    }, [fallbackSrc])

    // 에러 발생 시 대체 이미지로 재시도
    React.useEffect(() => {
      if (hasError && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc)
        setHasError(false)
        setIsLoading(true)
      }
    }, [hasError, imageSrc, fallbackSrc])

    return (
      <div 
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          aspectRatio !== 'auto' && aspectRatioStyles[aspectRatio],
          className
        )}
      >
        {/* 스켈레톤 플레이스홀더 */}
        {isLoading && placeholder === 'skeleton' && (
          <ImageSkeleton 
            className="absolute inset-0 w-full h-full"
            color={skeletonColor}
          />
        )}

        {/* 실제 이미지 */}
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          sizes={responsiveSizes}
          quality={quality}
          loading={loadingStrategy}
          priority={loadPriority === 'high'}
          placeholder={placeholder === 'blur' ? 'blur' : 'empty'}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            fill ? "object-cover" : "",
            hasError && "grayscale"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...props}
        />

        {/* 에러 상태 표시 */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🖼️</div>
              <p className="text-sm">이미지를 불러올 수 없습니다</p>
            </div>
          </div>
        )}
      </div>
    )
  }
)

OptimizedImage.displayName = "OptimizedImage"

/**
 * 아바타 이미지 컴포넌트 (모바일 최적화)
 */
interface AvatarImageProps {
  src?: string
  alt: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'square'
  className?: string
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  className
}) => {
  const initials = React.useMemo(() => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [name])

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center bg-muted text-muted-foreground font-medium",
        avatarSizes[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          aspectRatio="square"
          className={shape === 'circle' ? 'rounded-full' : 'rounded-md'}
          placeholder="skeleton"
          loadPriority="low"
        />
      ) : (
        <span className={cn(
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg'
        )}>
          {initials}
        </span>
      )}
    </div>
  )
}

/**
 * 게임 관련 이미지 (등급 배지, 아이콘 등)
 */
interface GameImageProps {
  type: 'grade-badge' | 'alliance-logo' | 'item-icon' | 'building-icon'
  grade?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const GameImage: React.FC<GameImageProps> = ({
  type,
  grade,
  className,
  size = 'md'
}) => {
  const getImageSrc = () => {
    switch (type) {
      case 'grade-badge':
        return `/images/grades/${grade?.toLowerCase()}.svg`
      case 'alliance-logo':
        return '/images/alliance-logo.svg'
      case 'item-icon':
        return '/images/items/default.svg'
      case 'building-icon':
        return '/images/buildings/default.svg'
      default:
        return '/placeholder.svg'
    }
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <OptimizedImage
      src={getImageSrc()}
      alt={`${type} ${grade || ''}`}
      width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
      height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
      className={cn(sizeClasses[size], className)}
      placeholder="skeleton"
      loadPriority="low"
    />
  )
}