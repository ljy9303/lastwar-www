'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { BoardPostDetail } from '@/components/board/board-post-detail';
import { useCurrentUser } from '@/lib/auth-utils';

export default function PostDetailPage() {
  const params = useParams();
  const postId = parseInt(params.postId as string);
  
  // 현재 사용자 정보 가져오기
  const { userSeq: currentUserId } = useCurrentUser();

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
    <div className="container mx-auto">
      <BoardPostDetail 
        postId={postId}
        currentUserId={currentUserId}
      />
    </div>
  );
}