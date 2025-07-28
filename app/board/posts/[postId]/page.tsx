'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { BoardPostDetail } from '@/components/board/board-post-detail';

export default function PostDetailPage() {
  const params = useParams();
  const postId = parseInt(params.postId as string);

  // TODO: 현재 사용자 ID를 가져오는 로직 추가
  // 실제로는 인증 컨텍스트나 세션에서 가져와야 함
  const currentUserId = undefined; // 임시로 undefined

  if (isNaN(postId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">잘못된 게시글 ID</h1>
          <p className="text-gray-600">유효하지 않은 게시글 주소입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <BoardPostDetail 
      postId={postId}
      currentUserId={currentUserId}
    />
  );
}