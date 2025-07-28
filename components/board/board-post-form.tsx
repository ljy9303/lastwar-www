'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Save, 
  X, 
  Upload,
  Image as ImageIcon,
  File,
  Trash2
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardCategory, BoardPostRequest, AttachmentRequest, ContentImageRequest } from '@/types/board';

interface BoardPostFormProps {
  postId?: number; // 수정 모드인 경우
  initialData?: {
    title: string;
    content: string;
    categoryId: number;
    thumbnailUrl?: string;
  };
}

export function BoardPostForm({ postId, initialData }: BoardPostFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    categoryId: initialData?.categoryId || 0,
    thumbnailUrl: initialData?.thumbnailUrl || ''
  });

  // 첨부파일 및 이미지
  const [attachments, setAttachments] = useState<AttachmentRequest[]>([]);
  const [contentImages, setContentImages] = useState<ContentImageRequest[]>([]);

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const categoriesData = await boardApi.getCategories();
      setCategories(categoriesData.filter(cat => cat.isActive));
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.categoryId) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      const request: BoardPostRequest = {
        categoryId: formData.categoryId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        thumbnailUrl: formData.thumbnailUrl || undefined,
        attachments,
        contentImages
      };

      if (postId) {
        // 수정 모드
        const updatedPost = await boardApi.updatePost(postId, request);
        router.push(`/board/posts/${updatedPost.postId}`);
      } else {
        // 생성 모드
        const newPost = await boardApi.createPost(request);
        router.push(`/board/posts/${newPost.postId}`);
      }
    } catch (err) {
      console.error('게시글 저장 실패:', err);
      alert('게시글 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 업로드 (임시 구현)
  const handleFileUpload = async (file: File, type: 'attachment' | 'image') => {
    try {
      // 실제로는 boardApi.uploadImage() 또는 uploadAttachment() 사용
      // 지금은 임시로 URL.createObjectURL 사용
      const tempUrl = URL.createObjectURL(file);
      
      if (type === 'attachment') {
        const newAttachment: AttachmentRequest = {
          imageUrl: tempUrl,
          imageKey: `temp_${Date.now()}`,
          originalFilename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          isThumbnail: false,
          sortOrder: attachments.length
        };
        setAttachments(prev => [...prev, newAttachment]);
      } else {
        const newImage: ContentImageRequest = {
          imageUrl: tempUrl,
          imageKey: `temp_${Date.now()}`
        };
        setContentImages(prev => [...prev, newImage]);
        
        // 에디터에 이미지 삽입 (간단한 구현)
        const imageTag = `<img src="${tempUrl}" alt="${file.name}" style="max-width: 100%; height: auto;" />`;
        setFormData(prev => ({
          ...prev,
          content: prev.content + '\n' + imageTag
        }));
      }
    } catch (err) {
      console.error('파일 업로드 실패:', err);
      alert('파일 업로드에 실패했습니다.');
    }
  };

  // 첨부파일 삭제
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {postId ? '게시글 수정' : '새 게시글 작성'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                {isCategoriesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.categoryId.toString()}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                          {category.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  placeholder="게시글 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={200}
                />
                <div className="text-sm text-gray-500 text-right">
                  {formData.title.length}/200
                </div>
              </div>

              {/* 썸네일 URL (선택사항) */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">썸네일 URL (선택사항)</Label>
                <Input
                  id="thumbnail"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={formData.thumbnailUrl}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))
                  }
                />
              </div>

              {/* 내용 */}
              <div className="space-y-2">
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  placeholder="게시글 내용을 입력하세요"
                  value={formData.content}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, content: e.target.value }))
                  }
                  className="min-h-[300px]"
                />
                <div className="text-sm text-gray-500 text-right">
                  {formData.content.length}자
                </div>
              </div>

              {/* 파일 업로드 */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div>
                    <Label htmlFor="image-upload">이미지 삽입</Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => handleFileUpload(file, 'image'));
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      이미지
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="file-upload">첨부파일</Label>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => handleFileUpload(file, 'attachment'));
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <File className="h-4 w-4 mr-2" />
                      파일
                    </Button>
                  </div>
                </div>

                {/* 첨부파일 목록 */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>첨부파일 목록</Label>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 border rounded">
                          <File className="h-4 w-4 text-gray-500" />
                          <span className="flex-1 text-sm truncate">
                            {attachment.originalFilename}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)}MB
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim() || !formData.content.trim() || !formData.categoryId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? '저장 중...' : postId ? '수정하기' : '작성하기'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}