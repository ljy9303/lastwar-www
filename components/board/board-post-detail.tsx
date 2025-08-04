'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedTouchButton } from '@/components/ui/optimized-touch-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Pin, 
  Edit, 
  Trash2,
  ArrowLeft,
  Calendar,
  User
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardPost, BoardComment } from '@/types/board';
import { BoardCommentList } from './board-comment-list';
import { ImageOverlay } from '@/components/ui/image-overlay';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BoardPostDetailProps {
  postId: number;
  currentUserId?: number;
}

export function BoardPostDetail({ postId, currentUserId }: BoardPostDetailProps) {
  const router = useRouter();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 좋아요 UI 상태 (실제 데이터와 별도)
  const [likeUIState, setLikeUIState] = useState<{
    isLiked: boolean;
    pendingChange: number; // +1, -1, 0
    isProcessing: boolean; // API 처리 중 여부
  }>({ isLiked: false, pendingChange: 0, isProcessing: false });

  // 이미지 오버레이 상태
  const [imageOverlay, setImageOverlay] = useState<{
    isOpen: boolean;
    src: string;
    alt: string;
  }>({ isOpen: false, src: '', alt: '' });

  // 게시글 로드
  const loadPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const postData = await boardApi.getPostDetail(postId);
      setPost(postData);
      
      // UI 상태 초기화
      setLikeUIState({
        isLiked: postData.isLiked,
        pendingChange: 0,
        isProcessing: false
      });
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 로드
  const loadComments = async () => {
    try {
      setIsCommentsLoading(true);
      const commentsData = await boardApi.getAllCommentsByPost(postId);
      setComments(commentsData);
    } catch (err) {
      console.error('댓글 로드 실패:', err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  // 총 댓글 개수 계산 (대댓글 포함)
  const getTotalCommentCount = (comments: BoardComment[]): number => {
    return comments.reduce((total, comment) => {
      let count = 1; // 현재 댓글 1개
      if (comment.replies && comment.replies.length > 0) {
        count += getTotalCommentCount(comment.replies); // 대댓글 재귀 계산
      }
      return total + count;
    }, 0);
  };

  // 좋아요 토글 - UI +1 방식 (중복 클릭 방지)
  const handleLikeToggle = async () => {
    if (!post || likeUIState.isProcessing) {
      console.log('[DEBUG] 좋아요 처리 중이거나 post가 없음. 무시됨');
      return;
    }

    // 즉각적인 UI 반응
    const newIsLiked = !likeUIState.isLiked;
    const pendingChange = newIsLiked 
      ? (likeUIState.isLiked ? 0 : 1)  // 좋아요 추가: 원래 좋아요면 변화없음, 아니면 +1
      : (likeUIState.isLiked ? -1 : 0); // 좋아요 취소: 원래 좋아요면 -1, 아니면 변화없음

    setLikeUIState({
      isLiked: newIsLiked,
      pendingChange: pendingChange,
      isProcessing: true
    });

    try {
      // 백엔드 API 호출
      console.log('[DEBUG] 게시글 좋아요 API 호출 시작:', postId, '현재 상태:', post.isLiked);
      await boardApi.togglePostLike(postId);
      console.log('[DEBUG] 게시글 좋아요 API 호출 완료:', postId);
      
      // 성공 시 처리 상태만 해제
      setLikeUIState(prev => ({ ...prev, isProcessing: false }));
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      // 에러 시 원래 상태로 롤백
      setLikeUIState({
        isLiked: post.isLiked,
        pendingChange: 0,
        isProcessing: false
      });
    }
  };

  // 게시글 삭제
  const handleDelete = async () => {
    if (!post || !confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await boardApi.deletePost(postId);
      router.push('/board');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
    }
  };


  // 댓글 변경 시 호출되는 콜백 - 댓글 리스트 새로고침
  const handleCommentsUpdate = (action?: 'add' | 'delete') => {
    // 댓글 리스트를 새로고침하여 최신 상태 반영
    loadComments();
  };

  // 댓글 새로고침 (초기 로딩이나 필요시에만 사용)
  const refreshComments = () => {
    loadComments();
  };

  // 게시글 내용의 이미지에 클릭 이벤트 추가
  useEffect(() => {
    if (!post?.content) return;

    // DOM이 업데이트된 후 실행되도록 setTimeout 사용
    const timer = setTimeout(() => {
      const handleImageClick = (event: Event) => {
        const target = event.target as HTMLImageElement;
        if (target.tagName === 'IMG') {
          event.preventDefault();
          event.stopPropagation();
          console.log('이미지 클릭됨:', target.src); // 디버그용
          setImageOverlay({
            isOpen: true,
            src: target.src,
            alt: target.alt || '이미지'
          });
        }
      };

      // 게시글 내용 컨테이너에서 이미지 클릭 이벤트 리스너 추가
      const contentContainer = document.querySelector('.prose');
      console.log('Content container found:', contentContainer); // 디버그용
      
      if (contentContainer) {
        const images = contentContainer.querySelectorAll('img');
        console.log('Images found:', images.length); // 디버그용
        
        images.forEach(img => {
          img.style.cursor = 'pointer';
          img.addEventListener('click', handleImageClick);
          console.log('Event listener added to:', img.src); // 디버그용
        });

        return () => {
          images.forEach(img => {
            img.removeEventListener('click', handleImageClick);
          });
        };
      }
    }, 100); // 100ms 지연

    return () => clearTimeout(timer);
  }, [post?.content]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  if (error) {
    return (
      <div className="px-4">
        <div>
          <EmptyState
            title="게시글을 불러올 수 없습니다"
            description={error}
            action={{
              label: '목록으로 돌아가기',
              onClick: () => router.push('/board')
            }}
          />
        </div>
      </div>
    );
  }

  if (isLoading || !post) {
    return (
      <div className="px-4">
        <div>
          {/* 뒤로 가기 버튼 스켈레톤 */}
          <Skeleton className="h-10 w-24 mb-6" />
          {/* 메인 카드 스켈레톤 */}
          <Card className="mb-6">
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-6 w-20 mb-3" />
                  <Skeleton className="h-10 w-3/4 mb-4" />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-48 w-full" />
                <div className="flex justify-center pt-6">
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuthor = currentUserId === post.userId;

  return (
    <div className="px-4">
      {/* 모바일 최적화 네비게이션 */}
      <div className="mb-6">
        <OptimizedTouchButton 
          variant="outline" 
          size="mobile-default"
          className="mb-4" 
          onClick={() => {
            // 이전 페이지가 게시판 목록이면 뒤로가기, 아니면 게시판으로 이동
            if (document.referrer.includes('/board') && !document.referrer.includes('/posts/')) {
              router.back();
            } else {
              router.push('/board');
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </OptimizedTouchButton>
      </div>

      {/* 메인 게시글 카드 */}
      <Card className="mb-6">
        {/* 모바일 최적화 게시글 헤더 */}
        <CardHeader className="pb-4 border-b">
          <div className="space-y-4">
            {/* 카테고리와 핀 */}
            <div className="flex items-center gap-2">
              {post.isPinned && <Pin className="h-5 w-5 text-orange-500" />}
              {post.categoryName && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {post.categoryName}
                </Badge>
              )}
            </div>
            
            {/* 제목 - 모바일 반응형 */}
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight break-words">
              {post.title}
            </CardTitle>
            
            {/* 작성자 정보 - 모바일 최적화 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src={post.authorProfileImageUrl} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    {post.serverNumber && post.allianceTag && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 w-fit">
                        {post.serverNumber}서버 [{post.allianceTag}]
                      </Badge>
                    )}
                    <span className="font-semibold text-gray-900 truncate">{post.authorName}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.createdAt), { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </div>
                </div>
              </div>
              
              {/* 액션 버튼 - 모바일 최적화 */}
              {isAuthor && (
                <div className="flex gap-2 self-start sm:self-center">
                  <OptimizedTouchButton
                    variant="outline"
                    size="mobile-sm"
                    onClick={() => router.push(`/board/posts/${postId}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </OptimizedTouchButton>
                  <OptimizedTouchButton
                    variant="outline"
                    size="mobile-sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </OptimizedTouchButton>
                </div>
              )}
            </div>
            
            {/* 통계 정보 - 모바일 최적화 */}
            <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.likeCount + likeUIState.pendingChange}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {getTotalCommentCount(comments)}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* 게시글 내용 */}
        <CardContent className="p-8">
          <div 
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-lg prose-img:shadow-sm prose-img:cursor-pointer prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 tiptap-content"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'IMG') {
                e.preventDefault();
                const img = target as HTMLImageElement;
                console.log('이미지 클릭됨 (onClick):', img.src); // 디버그용
                setImageOverlay({
                  isOpen: true,
                  src: img.src,
                  alt: img.alt || '이미지'
                });
              }
            }}
          />


          {/* 좋아요 버튼 - 모바일 최적화 */}
          <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
            <OptimizedTouchButton
              variant={likeUIState.isLiked ? "default" : "outline"}
              size="mobile-lg"
              onClick={handleLikeToggle}
              disabled={likeUIState.isProcessing}
              className={`px-8 py-3 text-base font-medium transition-all ${likeUIState.isLiked 
                ? "bg-red-500 hover:bg-red-600 shadow-md text-white" 
                : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              } ${likeUIState.isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart className={`h-5 w-5 mr-2 ${likeUIState.isLiked ? 'fill-current' : ''}`} />
              좋아요 {post.likeCount + likeUIState.pendingChange}
            </OptimizedTouchButton>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <div>
        <BoardCommentList
          postId={postId}
          currentUserId={currentUserId}
          postAuthorId={post.userId}
          comments={comments}
          isLoading={isCommentsLoading}
          onCommentsUpdate={handleCommentsUpdate}
        />
      </div>

      {/* 이미지 오버레이 */}
      <ImageOverlay
        src={imageOverlay.src}
        alt={imageOverlay.alt}
        isOpen={imageOverlay.isOpen}
        onClose={() => setImageOverlay({ isOpen: false, src: '', alt: '' })}
      />
    </div>
  );
}