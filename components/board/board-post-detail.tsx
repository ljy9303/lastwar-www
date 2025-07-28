'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Share2,
  ArrowLeft,
  Download,
  Calendar,
  User
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardPost, BoardComment } from '@/types/board';
import { BoardCommentList } from './board-comment-list';
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

  // 게시글 로드
  const loadPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const postData = await boardApi.getPostDetail(postId);
      setPost(postData);
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

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!post) return;

    try {
      await boardApi.togglePostLike(postId);
      
      setPost(prev => prev ? {
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
      } : null);
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
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

  // 공유하기
  const handleShare = async () => {
    if (!post) return;

    try {
      await navigator.share({
        title: post.title,
        text: post.contentPreview || post.title,
        url: window.location.href
      });
    } catch (err) {
      // 공유 API를 지원하지 않는 경우 URL 복사
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  // 댓글 새로고침 콜백
  const handleCommentsUpdate = () => {
    loadComments();
    // 게시글의 댓글 수도 업데이트
    setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
  };

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="게시글을 불러올 수 없습니다"
          description={error}
          action={{
            label: '목록으로 돌아가기',
            onClick: () => router.push('/board')
          }}
        />
      </div>
    );
  }

  if (isLoading || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 스켈레톤 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 콘텐츠 스켈레톤 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-40 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuthor = currentUserId === post.userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로 가기 버튼 */}
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>

        {/* 게시글 헤더 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* 제목 및 카테고리 */}
                <div className="flex items-center gap-2 mb-4">
                  {post.isPinned && <Pin className="h-5 w-5 text-orange-500" />}
                  {post.categoryName && (
                    <Badge variant="secondary">
                      {post.categoryName}
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="text-2xl mb-4">{post.title}</CardTitle>
                
                {/* 메타 정보 */}
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    조회 {post.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    좋아요 {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    댓글 {post.commentCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(post.createdAt), { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </span>
                </div>

                {/* 작성자 정보 */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.authorProfileImageUrl} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{post.authorName}</div>
                    {post.authorUserLabel && (
                      <Badge variant="outline" className="text-xs">
                        {post.authorUserLabel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                {isAuthor && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/board/posts/${postId}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 게시글 내용 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* 첨부파일 */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">첨부파일</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.attachments.map(attachment => (
                    <div 
                      key={attachment.attachmentId}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      {attachment.mimeType.startsWith('image/') ? (
                        <img 
                          src={attachment.imageUrl}
                          alt={attachment.originalFilename}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Download className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {attachment.originalFilename}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attachment.formattedFileSize}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.imageUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 좋아요 버튼 */}
        <div className="flex justify-center mb-6">
          <Button
            variant={post.isLiked ? "default" : "outline"}
            size="lg"
            onClick={handleLikeToggle}
            className={post.isLiked ? "bg-red-500 hover:bg-red-600" : ""}
          >
            <Heart className={`h-5 w-5 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
            좋아요 {post.likeCount}
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* 댓글 섹션 */}
        <BoardCommentList
          postId={postId}
          currentUserId={currentUserId}
          comments={comments}
          isLoading={isCommentsLoading}
          onCommentsUpdate={handleCommentsUpdate}
        />
      </div>
    </div>
  );
}