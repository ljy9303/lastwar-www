'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedTouchButton } from '@/components/ui/optimized-touch-button';
import { ArrowLeft } from 'lucide-react';
import { BoardPostForm } from '@/components/board/board-post-form';

export default function NewPostPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4">
      {/* 모바일 최적화 헤더 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              새 게시글 작성
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              게시글을 작성하고 커뮤니티와 공유해보세요
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
      <BoardPostForm />
    </div>
  );
}