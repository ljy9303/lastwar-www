'use client';

import React, { useState } from 'react';
import { BoardList } from '@/components/board/board-list';
import { BoardCategoryNav } from '@/components/board/board-category-nav';

export default function BoardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();

  const handleCategorySelect = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드바 - 카테고리 네비게이션 */}
        <div className="lg:col-span-1">
          <BoardCategoryNav
            currentCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            className="sticky top-4"
          />
        </div>

        {/* 메인 콘텐츠 - 게시글 목록 */}
        <div className="lg:col-span-3">
          <BoardList
            categoryId={selectedCategoryId}
            title={selectedCategoryId ? '카테고리별 게시글' : '전체 게시글'}
            showCreateButton={true}
          />
        </div>
      </div>
    </div>
  );
}