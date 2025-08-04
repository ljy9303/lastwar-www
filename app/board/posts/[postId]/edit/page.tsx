'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BoardPostForm } from '@/components/board/board-post-form';
import { boardApi } from '@/lib/board-api';
import { BoardPost, BoardCategory } from '@/types/board';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { OptimizedTouchButton } from '@/components/ui/optimized-touch-button';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = parseInt(params.postId as string);
  
  const [post, setPost] = useState<BoardPost | null>(null);
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 게시글과 카테고리 정보 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [postData, categoriesData] = await Promise.all([
        boardApi.getPostDetail(postId),
        boardApi.getCategories()
      ]);

      setPost(postData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 데이터 변환 함수
  const getInitialData = (post: BoardPost) => {
    return {
      title: post.title,
      content: post.content || '',
      categoryId: post.categoryId,
      thumbnailUrl: post.thumbnailUrl,
      contentImages: post.contentImages || []  // 기존 이미지 정보 포함
    };
  };

  useEffect(() => {
    if (isNaN(postId)) {
      setError('잘못된 게시글 ID입니다.');
      return;
    }
    loadData();
  }, [postId]);

  if (isNaN(postId)) {
    return (
      <div className="container mx-auto px-4">
        <div className="mb-6">
        </div>
        <EmptyState
          title="잘못된 게시글 ID"
          description="유효하지 않은 게시글 주소입니다."
          action={{
            label: '목록으로 돌아가기',
            onClick: () => router.push('/board')
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
        {/* 모바일 최적화 헤더 */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                게시글 수정
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                오류가 발생했습니다
              </p>
            </div>
            <OptimizedTouchButton 
              variant="outline" 
              size="mobile-default"
              onClick={() => router.back()}
              className="self-start sm:self-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로 가기
            </OptimizedTouchButton>
          </div>
        </div>
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
      <div className="container mx-auto px-4">
        {/* 로딩 시 헤더 스켈레톤 */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-12 w-24 self-start sm:self-center" />
          </div>
        </div>
        
        {/* 폼 스켈레톤 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {/* 모바일 최적화 헤더 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              게시글 수정
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              게시글 내용을 수정하고 저장하세요
            </p>
          </div>
          <OptimizedTouchButton 
            variant="outline" 
            size="mobile-default"
            onClick={() => router.back()}
            className="self-start sm:self-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </OptimizedTouchButton>
        </div>
      </div>

      {/* 게시글 수정 폼 */}
      <BoardPostForm
        postId={postId}
        initialData={getInitialData(post)}
      />
    </div>
  );
}