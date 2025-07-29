'use client';

import React, { useState } from 'react';
import { BoardList } from '@/components/board/board-list';

export default function BoardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();

  const handleCategorySelect = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="container mx-auto">
      <BoardList
        categoryId={selectedCategoryId}
        title={selectedCategoryId ? '카테고리별 게시글' : '전체 게시글'}
        showCreateButton={true}
        onCategorySelect={handleCategorySelect}
      />
    </div>
  );
}