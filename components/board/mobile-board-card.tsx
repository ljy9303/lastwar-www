"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TouchButton } from "@/components/ui/touch-button"
import { SwipeCard } from "@/components/ui/swipe-card"
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Pin, 
  Calendar,
  User,
  Share2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BoardPost } from "@/types/board"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface MobileBoardCardProps {
  post: BoardPost
  isPinned?: boolean
  onLikeToggle?: (postId: number) => void
  onShare?: (post: BoardPost) => void
  likeUIState?: {
    isLiked: boolean
    pendingChange: number
    isProcessing?: boolean
  }
  onNavigate?: () => void
}

export function MobileBoardCard({ 
  post, 
  isPinned = false, 
  onLikeToggle,
  onShare,
  likeUIState,
  onNavigate
}: MobileBoardCardProps) {
  const router = useRouter()
  
  const uiState = likeUIState || { 
    isLiked: post.isLiked, 
    pendingChange: 0, 
    isProcessing: false 
  }

  const handleCardClick = React.useCallback(() => {
    onNavigate?.()
    router.push(`/board/posts/${post.postId}`)
  }, [router, post.postId, onNavigate])

  const handleLikeClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onLikeToggle?.(post.postId)
  }, [onLikeToggle, post.postId])

  const handleShareClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare?.(post)
  }, [onShare, post])

  return (
    <SwipeCard
      className="w-full bg-white dark:bg-gray-900 border-0 shadow-sm hover:shadow-md transition-shadow"
      onSwipeLeft={() => onLikeToggle?.(post.postId)}
      onSwipeRight={handleCardClick}
      leftActionLabel="좋아요"
      rightActionLabel="보기"
      leftActionColor="success"
      rightActionColor="default"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* 상단: 카테고리 및 핀 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPinned && <Pin className="h-4 w-4 text-orange-500 flex-shrink-0" />}
            {post.categoryName && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-1"
              >
                {post.categoryName}
              </Badge>
            )}
          </div>
          
          {/* 작성자 서버 정보 */}
          {post.serverNumber && post.allianceTag && (
            <Badge 
              variant="outline" 
              className="text-xs bg-gray-50 text-gray-600 border-gray-200 px-1.5 py-0.5"
            >
              {post.serverNumber}서버 [{post.allianceTag}]
            </Badge>
          )}
        </div>

        {/* 제목 */}
        <h3 className="font-semibold text-base line-clamp-2 text-gray-900 dark:text-gray-100 leading-snug">
          {post.title}
        </h3>

        {/* 썸네일 또는 콘텐츠 미리보기 */}
        <div className="w-full">
          {post.thumbnailUrl ? (
            <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100">
              <img 
                src={post.thumbnailUrl} 
                alt="썸네일"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : post.contentPreview && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                {post.contentPreview}
              </p>
            </div>
          )}
        </div>

        {/* 작성자 정보 */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {post.authorName}
          </span>
          <span className="text-gray-400">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(post.createdAt), { 
              addSuffix: true, 
              locale: ko 
            })}
          </span>
        </div>

        {/* 하단: 통계 및 액션 버튼 */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* 통계 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.commentCount}
            </span>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1">
            {onShare && (
              <TouchButton
                variant="ghost"
                size="icon-sm"
                onClick={handleShareClick}
                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                ariaLabel="게시글 공유"
                hapticFeedback
              >
                <Share2 className="h-3.5 w-3.5" />
              </TouchButton>
            )}
            
            <TouchButton
              variant="ghost"
              size="icon-sm"
              onClick={handleLikeClick}
              disabled={uiState.isProcessing}
              className={cn(
                "h-8 w-8 transition-colors",
                uiState.isLiked 
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
                  : "text-gray-500 hover:text-red-500 hover:bg-gray-100"
              )}
              ariaLabel={`게시글 좋아요 ${uiState.isLiked ? '취소' : '추가'}`}
              hapticFeedback
              loading={uiState.isProcessing}
            >
              <Heart className={cn(
                "h-3.5 w-3.5 transition-all",
                uiState.isLiked && "fill-current"
              )} />
              <span className="ml-1 text-xs font-medium">
                {post.likeCount + uiState.pendingChange}
              </span>
            </TouchButton>
          </div>
        </div>
      </CardContent>
    </SwipeCard>
  )
}