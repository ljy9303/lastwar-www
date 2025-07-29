'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BoardPostForm } from '@/components/board/board-post-form';

export default function NewPostPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>
      </div>
      <BoardPostForm />
    </div>
  );
}